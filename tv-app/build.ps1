# Builds GlassRemoteTv.apk with the command line tools of the Android SDK (no Gradle, no extra downloads).
#
# Needs: a JDK (17 or newer) and the Android SDK with "platforms;android-34" (or newer) and "build-tools".
#   $env:JAVA_HOME     = path of the JDK
#   $env:ANDROID_HOME  = path of the Android SDK
# Usage:
#   powershell -File build.ps1                            builds build\GlassRemoteTv.apk
#   powershell -File build.ps1 -Install 192.168.x.x:5555  also installs it on the TV with adb
param([string]$Install = "")
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$jdk = $env:JAVA_HOME
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { $env:ANDROID_SDK_ROOT }
if (-not $jdk -or -not (Test-Path "$jdk\bin\javac.exe")) { throw "Set JAVA_HOME to a JDK (17 or newer)." }
if (-not $sdk -or -not (Test-Path "$sdk\build-tools")) { throw "Set ANDROID_HOME to the Android SDK folder." }
$bt = Get-ChildItem "$sdk\build-tools" -Directory | Sort-Object { [version]($_.Name -replace '[^\d.].*$', '') } -Descending | Select-Object -First 1
$btPath = $bt.FullName
$platform = Get-ChildItem "$sdk\platforms" -Directory | Where-Object Name -match '^android-\d+$' | Sort-Object { [int]($_.Name -replace 'android-', '') } -Descending | Select-Object -First 1
$androidJar = "$($platform.FullName)\android.jar"
$adb = "$sdk\platform-tools\adb.exe"
$env:JAVA_HOME = $jdk
$env:PATH = "$jdk\bin;$env:PATH"

$out = "$root\build"
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory "$out\classes", "$out\assets\www", "$out\dex" | Out-Null

# 1. the phone app is bundled inside the APK: a copy in .\www (AppTv release) or the PWA in ..\docs (GlassRemoteTv repository)
$docs = "$root\www"
if (-not (Test-Path "$docs\index.html")) { $docs = Join-Path (Split-Path -Parent $root) "docs" }
if (-not (Test-Path "$docs\index.html")) { throw "Cannot find the phone app (.\www or ..\docs)" }
Copy-Item "$docs\*" "$out\assets\www" -Recurse
Remove-Item "$out\assets\www\.nojekyll", "$out\assets\www\assets\screenshots" -Recurse -ErrorAction SilentlyContinue

# 2. resources + manifest
& "$btPath\aapt2.exe" compile --dir "$root\res" -o "$out\res.zip"
if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed" }
& "$btPath\aapt2.exe" link -o "$out\base.apk" -I $androidJar --manifest "$root\AndroidManifest.xml" `
    --min-sdk-version 21 --target-sdk-version 29 --version-code 4 --version-name 0.4.0 -A "$out\assets" "$out\res.zip"
if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed" }

# 3. Java -> classes -> dex
$sources = Get-ChildItem "$root\src" -Recurse -Filter *.java | ForEach-Object FullName
& "$jdk\bin\javac.exe" -source 8 -target 8 -Xlint:-options -encoding UTF-8 -bootclasspath $androidJar -d "$out\classes" $sources
if ($LASTEXITCODE -ne 0) { throw "javac failed" }
$classes = Get-ChildItem "$out\classes" -Recurse -Filter *.class | ForEach-Object FullName
& "$btPath\d8.bat" --release --min-api 21 --lib $androidJar --output "$out\dex" $classes
if ($LASTEXITCODE -ne 0) { throw "d8 failed" }

# 4. add classes.dex to the APK
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open("$out\base.apk", "Update")
[void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "$out\dex\classes.dex", "classes.dex")
$zip.Dispose()

# 5. align and sign (your own signing key is created on the first build and kept in .\keystore, never share it)
$ks = "$root\keystore\glassremote.jks"
if (-not (Test-Path $ks)) {
    New-Item -ItemType Directory "$root\keystore" -Force | Out-Null
    $bytes = New-Object byte[] 18
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    $pw = [Convert]::ToBase64String($bytes).Replace('+', 'a').Replace('/', 'b')
    Set-Content "$root\keystore\password.txt" $pw -Encoding ASCII
    try { & icacls "$root\keystore" /inheritance:r /grant:r "$($env:USERNAME):(OI)(CI)F" | Out-Null } catch { }
    $env:GR_KS_PASS = $pw
    & "$jdk\bin\keytool.exe" -genkeypair -keystore $ks -storepass:env GR_KS_PASS -keypass:env GR_KS_PASS -alias glassremote -keyalg RSA -keysize 2048 -validity 9125 -dname "CN=GlassRemoteTv" | Out-Null
}
# the password goes to the tools through an environment variable, not on their command line
$env:GR_KS_PASS = (Get-Content "$root\keystore\password.txt" -Raw).Trim()
& "$btPath\zipalign.exe" -f 4 "$out\base.apk" "$out\aligned.apk" | Out-Null
& "$btPath\apksigner.bat" sign --ks $ks --ks-pass env:GR_KS_PASS --key-pass env:GR_KS_PASS --out "$out\GlassRemoteTv.apk" "$out\aligned.apk"
$signed = $LASTEXITCODE
Remove-Item Env:GR_KS_PASS -ErrorAction SilentlyContinue
if ($signed -ne 0) { throw "apksigner failed" }
Remove-Item "$out\base.apk", "$out\aligned.apk" -ErrorAction SilentlyContinue
"Built: $out\GlassRemoteTv.apk  ($([int]((Get-Item "$out\GlassRemoteTv.apk").Length / 1KB)) KB)"

if ($Install) {
    & $adb connect $Install | Out-Null
    & $adb -s $Install install -r "$out\GlassRemoteTv.apk"
}
