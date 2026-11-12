# GlassRemoteTv (the TV app)

An Android TV app written in plain Java, with no Gradle and no libraries. It:

- serves the GlassRemote web app from `docs/` (copied into the APK) on a random port (20000-59999, picked on first start, saved and shown on the TV screen);
- shows a QR code, the address and a PIN on the TV screen;
- presses the TV's keys through ADB on the TV's own loopback address (network debugging must be on), with a small helper (`Injector.java`, started with `app_process`, fed through its standard input, no network socket) for fast keys, and a fallback to `input keyevent`;
- shows TV health (CPU, memory, processes), cleans the apps' cache and can restart the TV automatically in standby (`Stats.java`, `Maintenance.java`, `Schedule.java`);
- asks every phone for the PIN once (`Auth.java`).

User guide: [../AppTv/guide/01-install-on-your-tv.md](../AppTv/guide/01-install-on-your-tv.md) (short summary: [../guide/08-install-tv-app.md](../guide/08-install-tv-app.md)). The other guides in [../AppTv/guide/](../AppTv/guide/) cover security, troubleshooting and building from source. Security notes: [../guide/07-security.md](../guide/07-security.md).

[`../AppTv/release/`](../AppTv/release/) holds the signed APK built from these sources, with `SHA256SUMS.txt`. The helper `tools/hold-key/Hold.java` holds a key down on the TV (used by the AI-assistant instructions in [../AppTv/CLAUDE.md](../AppTv/CLAUDE.md) to move the app tile on the Home screen).

## Build it

You need a JDK 17 and the Android SDK (build-tools 34 and platform android-34). From this folder, in PowerShell:

```powershell
$env:JAVA_HOME = "C:\path\to\jdk-17"
$env:ANDROID_HOME = "C:\path\to\android-sdk"
.\build.ps1                              # builds build\GlassRemoteTv.apk
.\build.ps1 -Install 192.168.x.x:5555    # also installs it on the TV with adb
```

The first build creates a private signing key in `keystore\` (git-ignored; access limited to your user). Keep it: an app can only be updated with the same key. Never commit `keystore\` or `build\`. A release is the same build, signed with the maintainer's key.

## Tests

The PIN, lock and port logic of `Auth.java` has a small test that runs on a normal JVM (it uses two tiny stand-ins for Android classes). From this folder:

```powershell
$out = "$env:TEMP\authtest"
javac -d $out tests\stubs\android\content\Context.java tests\stubs\android\util\Base64.java src\app\glassremote\tv\Auth.java tests\AuthTest.java
java -cp $out app.glassremote.tv.AuthTest   # every line must start with PASS
```

`tests\FeaturesTest.java` (51 checks) covers the restart schedule maths (including daylight saving), the config validation, the load-figure parser and the link allowlist:

```powershell
$out = "$env:TEMP\featurestest"
javac -d $out src\app\glassremote\tv\Schedule.java src\app\glassremote\tv\Stats.java src\app\glassremote\tv\Links.java tests\FeaturesTest.java
java -cp $out app.glassremote.tv.FeaturesTest   # every line must start with PASS
```

## Source map

| File | What it does |
|---|---|
| `MainActivity.java` | The TV screen: QR code, address, PIN, status |
| `Qr.java` | Small QR code generator (byte mode, level M) |
| `Server.java` | HTTP and WebSocket server on the saved random port, same messages as `receiver/bridge.py` plus `/api/stats`, `/api/clean-cache`, `/api/maintenance`, `/api/open-link` (TV app only) |
| `Auth.java` | The PIN, the tokens and the brute-force lock |
| `TvLink.java` | Talks to the TV: keys, volume, apps, status, health reading, cache cleaning |
| `Adb.java`, `Identity.java` | Minimal ADB client (long-lived stream, longer-timeout exec) and its RSA identity |
| `Injector.java`, `KeyInjector.java` | Key helper run by `app_process` as the ADB shell user (about 10 ms per key), and the TV-side part that starts and feeds it |
| `Stats.java` | Parser of the health reading |
| `Schedule.java`, `Maintenance.java` | Automatic restart: schedule maths and validation, saved config and safety checks |
| `Links.java` | Allowlist for "open a link on the TV" (`POST /api/open-link`; http/https with a host) and package-name check |
| `ReceiverService.java`, `BootReceiver.java` | Keep it running, start at boot |
| `tools/hold-key/Hold.java` | Helper that holds a key down on the TV (not part of the APK) |

## Rule for contributors

Every change to `docs/` must bump `APP_VERSION` in `docs/version.js` and the `?v=N` in `docs/index.html`, then rebuild the APK so it carries the new web app.
