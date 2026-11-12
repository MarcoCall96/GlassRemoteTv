# 6. The Android TV app: how it works and what is next

> Italiano: [it/06-app-android-tv-roadmap.md](it/06-app-android-tv-roadmap.md)

The TV app (`tv-app/`) is built. This page explains the design and lists open ideas for contributors. To install it, see [08-install-tv-app.md](08-install-tv-app.md).

## What it does

1. Runs a small HTTP and WebSocket server on the TV (its port is random and shown on the TV screen) that serves `docs/` and speaks the **same protocol** as `receiver/bridge.py` ([05-protocol-and-api.md](05-protocol-and-api.md)).
2. Presses the TV's keys through **ADB on the TV's own loopback address** (network debugging on).
3. Shows a QR code, the address and a PIN on the TV screen, and asks each phone for the PIN once.
4. Starts automatically when the TV boots.

## Design notes

| Topic | Decision |
|---|---|
| Language / tooling | Plain Java 8, no Gradle, no libraries. `build.ps1` calls `aapt2`, `javac`, `d8`, `zipalign` and `apksigner`. `minSdk 21`, `targetSdk 29`, a Leanback launcher so it appears in the TV apps |
| Sending keys | `input keyevent`, `input text`, `monkey` and `am start` through an ADB shell. The official Android TV Remote service (port 6466) was tried first, but the TV closes connections that come from the TV itself, so it cannot work on-device |
| ADB client | `Adb.java` is a minimal ADB client (CNXN, AUTH with the app's own RSA key, shell streams). The key is created on first start and kept in the app's private storage |
| Status | Polled with `dumpsys window`, `dumpsys power` and `media volume`, then pushed to phones over the WebSocket |
| Volume | Absolute volume with `media volume --stream 3 --set N` (0 to 100) |
| Security | LAN-only, PIN plus tokens, rate limited. See [07-security.md](07-security.md) |
| Web app | The APK carries a copy of `docs/` in its assets, so it works with no internet |

## Open ideas

- A guided first-run screen on the TV that opens the Developer options for the user.
- Wake from standby tested on more TVs and a "wake on phone open" option.
- Measure and reduce key latency (batching already helps).
- Ports for other TV brands (Samsung Tizen, LG webOS, Roku, Fire TV), each as its own receiver speaking the same WebSocket protocol.
- HTTPS with a locally trusted certificate, so the installed phone app and the TV app share one origin on iOS.
- Run without network debugging, if Android ever offers a safe way for an app to inject remote keys.
