# 4. Build from source

> Italiano: [it/04-compilare-dal-sorgente.md](it/04-compilare-dal-sorgente.md) · Back to the [README](../README.md)

The app is plain Java. There is no Gradle and nothing to download: the build script uses the command line tools of the Android SDK. It works on Windows with PowerShell.

## What you need

- A **JDK 17 or newer**.
- The **Android SDK** with `build-tools;34...` and `platforms;android-34` (newer versions also work).
- Environment variables:
  - `JAVA_HOME`: the JDK folder.
  - `ANDROID_HOME`: the Android SDK folder.

```powershell
$env:JAVA_HOME = "C:\path\to\jdk-17"
$env:ANDROID_HOME = "C:\path\to\android-sdk"
```

## Build

From the `tv-app` folder of the repository (it finds the web app in `..\docs`):

```powershell
cd tv-app
powershell -File build.ps1
```

The APK is `build\GlassRemoteTv.apk`.

To build and install it on the TV over the network (network debugging must be on, see [01-install-on-your-tv.md](01-install-on-your-tv.md)):

```powershell
powershell -File build.ps1 -Install 192.168.x.x:5555
```

The script bundles the phone web app from `docs/` into the APK, compiles the Java sources, signs the APK and, with `-Install`, installs it with adb.

## Your own signing key

- The first build creates your own signing key in `tv-app/keystore` (with a random password next to it). It is in `.gitignore`. **Keep it, and never share it or commit it.** Back it up: an app can only be updated by an APK signed with the same key.
- Your APK is signed with **your** key, so its fingerprint is different from the one of the release in [AppTv/release/](../release/). That is expected.
- An APK signed with another key cannot be installed over an app that is already on the TV. Uninstall the old GlassRemoteTv first, install yours, then redo the one-time ADB approval on the TV screen. You get a new PIN and a new port.
- To see the fingerprint of any APK: `apksigner verify --print-certs GlassRemoteTv.apk` (in the Android build-tools). The official release has certificate subject `CN=GlassRemoteTv` and SHA-256 `62:38:B1:A8:AB:67:23:29:2A:25:60:C9:23:48:8C:82:05:B6:98:1E:61:5F:77:4C:2B:65:44:92:DF:6D:57:07`.

## Limits you can change

By default the TV app remembers up to **30 phones**. Each browser tab and each Home Screen icon counts as one. When a 31st signs in, the oldest one is forgotten and must type the PIN again. It also keeps up to **24 connections open at the same time**, with at most **6 connections from one device**. That is plenty for a household.

If you need more, change these constants and rebuild:

| Constant | File | What it limits |
|---|---|---|
| `MAX_TOKENS` | `tv-app/src/app/glassremote/tv/Auth.java` | Phones remembered |
| `MAX_CONNECTIONS` | `tv-app/src/app/glassremote/tv/Server.java` | Connections open at the same time, in total |
| `MAX_PER_PEER` | `tv-app/src/app/glassremote/tv/Server.java` | Connections from one device |

Then build the APK and install it again on the TV:

```powershell
powershell -File build.ps1 -Install 192.168.x.x:5555
```

The one-time ADB approval and the saved phones are kept, because the signing key and the app data stay the same.

More simultaneous connections use more TV memory. Raise the numbers only as much as you need.

Other small constants, if you want to change the behaviour of the 0.5.0 features (change, rebuild, install again):

| Constant | File | What it sets |
|---|---|---|
| restart retry 30 min, give-up 6 h, minimum gap 12 h | `tv-app/src/app/glassremote/tv/Maintenance.java` | How the automatic restart retries and how often it can run |
| cache-clean interval 10 s, stats cache 2 s | `tv-app/src/app/glassremote/tv/TvLink.java` | How often the cache can be cleaned, and how long a health reading is reused |
| `IDLE_MS` (10 minutes) | `tv-app/src/app/glassremote/tv/KeyInjector.java` | When the key helper stops after the last key |

## Tests

There are two test programs. They run on a normal JDK. Every output line must start with `PASS`.

`AuthTest` covers the PIN logic (`Auth.java`): right and wrong PIN, the per-address lock, the new PIN after too many tries, the saved port. It uses two small stubs instead of the Android classes.

In `tv-app/tests`:

```powershell
cd tv-app\tests
New-Item -ItemType Directory ..\build\authtest -Force | Out-Null
javac -d ..\build\authtest stubs\android\content\Context.java stubs\android\util\Base64.java ..\src\app\glassremote\tv\Auth.java AuthTest.java
java -cp ..\build\authtest app.glassremote.tv.AuthTest
```

`FeaturesTest` (51 checks) covers the restart schedule maths (including daylight saving), the config validation, the load-figure parser and the link allowlist:

```powershell
cd tv-app
$out = "build\featurestest"
New-Item -ItemType Directory $out -Force | Out-Null
javac -d $out src\app\glassremote\tv\Schedule.java src\app\glassremote\tv\Stats.java src\app\glassremote\tv\Links.java tests\FeaturesTest.java
java -cp $out app.glassremote.tv.FeaturesTest
```

Expect every line of the output to start with `PASS`. If a line starts with anything else, something is broken.

## How the key helper works

1. When a phone connects, the TV app opens a second ADB connection to its own loopback address and starts `app_process` with the class `app.glassremote.tv.Injector` (from the same APK) as the ADB shell user.
2. `KeyInjector.java` writes one key code per line to the helper's standard input; the helper injects the key. There is no network socket. It takes about 10 ms from the phone message to the key, instead of about 1000 ms for `input keyevent`.
3. The helper stops after 10 minutes without keys (it holds about 60 MB of RAM), exits when the app or the connection closes, and if it cannot start the app falls back to `input keyevent`.

## Source map

All Java files are in `tv-app/src/app/glassremote/tv/`.

| File | What it does |
|---|---|
| `MainActivity.java` | The TV screen: QR code, address, PIN and status |
| `Qr.java` | Small QR code generator (byte mode, level M) |
| `Server.java` | HTTP and WebSocket server on the saved random port; serves the web app and handles the phone commands (including `/api/stats`, `/api/clean-cache`, `/api/maintenance`, `/api/open-link`) |
| `Auth.java` | The PIN, the tokens, the saved port and the brute-force lock |
| `TvLink.java` | Talks to the TV: keys, volume, apps, status, health reading, cache cleaning |
| `Adb.java`, `Identity.java` | Minimal ADB client (with a long-lived stream and a longer-timeout exec) and its RSA identity |
| `Injector.java`, `KeyInjector.java` | The key helper that runs as the ADB shell user, and the TV-side part that starts it and feeds it |
| `Stats.java` | Parses the health reading (`/proc/stat`, `/proc/meminfo`, `loadavg`, `uptime`, `top`, `ps`) |
| `Schedule.java`, `Maintenance.java` | The automatic restart: schedule maths and validation, and the saved config (`maintenance.txt`) and its checks |
| `Links.java` | The allowlist for "open a link on the TV" (`POST /api/open-link`, handled in `Server.java` and `TvLink.java`) and the package-name check |
| `ReceiverService.java`, `BootReceiver.java` | Keep the app running in the background and start it when the TV boots |

Other places:

| Path | What it holds |
|---|---|
| `docs/` | The phone web app (plain HTML, CSS, JavaScript) bundled in the APK, including the TV health screen |
| `tv-app/res/` | Icon and TV banner |
| `tv-app/AndroidManifest.xml` | Permissions, launcher entry, service, boot receiver |
| `tv-app/build.ps1` | The build script |
| `tv-app/tests/` | `AuthTest.java`, `FeaturesTest.java` and the stubs |
| `tv-app/tools/hold-key/` | `Hold.java`, a helper that holds a key down on the TV (used by the AI-assistant instructions) |

## Rule when you change the web app

The web app lives in `docs/` of the repository, and the computer receiver in `receiver/`. The build bundles `docs/` into the APK. Every change to the web app needs:

1. a new version in `docs/version.js` (`APP_VERSION`);
2. the matching `?v=N` bump in `docs/index.html` for the files you changed;
3. a rebuild of the APK (`powershell -File build.ps1`), so it carries the new web app.

Without the bump, phones keep the old cached files.

## Privacy check before you publish anything

Search your files for IP addresses, Wi-Fi names, TV names, user names in paths, `keystore`, `*.jks`, `password.txt`, PINs and tokens. None must be present. Use `192.168.x.x` as a placeholder.
