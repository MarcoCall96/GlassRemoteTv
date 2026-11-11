# 6. Roadmap: the Android TV app (no computer needed)

> Italiano: [it/06-app-android-tv-roadmap.md](it/06-app-android-tv-roadmap.md)

## The idea

Today you need a computer running the receiver. The goal is to **put the receiver inside the TV**: a small Android TV app that

1. runs a tiny HTTP + WebSocket server on the TV (for example `http://<tv-ip>:8780`) and serves the same PWA from `docs/`;
2. talks to the TV's own **Android TV Remote service** (or directly to the system through an Accessibility service / `adb`-less input injection);
3. starts automatically with the TV, so the phone works any time with no computer.

The phone then opens `http://<tv-ip>:8780`, taps *Add to Home Screen*, and that is the only setup.

**Status: not built yet. Contributors welcome.** The Python receiver is the reference implementation: port its behaviour.

## What the app needs

| Piece | Suggested approach |
|---|---|
| Language / tooling | Kotlin, Android Studio (or JDK 17 + Android SDK 34 command line), `minSdk 23`, a Leanback launcher activity so it appears on the TV |
| HTTP + WebSocket server | [Ktor](https://ktor.io/) (CIO engine) or NanoHTTPD + NanoWSD |
| Serve the PWA | Bundle `docs/` into the APK `assets/` and serve it |
| Sending keys | Option A: connect to `127.0.0.1:6466` with the Android TV Remote v2 protocol (a Kotlin port of `androidtvremote2`, e.g. the open-source `AndroidTVRemote` libraries). Option B: an **AccessibilityService** that dispatches key events. Option C: `InputManager` with a privileged permission (not available to normal apps) |
| Launching apps | `PackageManager.getLaunchIntentForPackage(...)` or `getLeanbackLaunchIntentForPackage(...)`; the `launch` message already carries the package name |
| Pairing | If Option A is used, it can skip pairing against localhost by being the TV itself |
| Start on boot | `RECEIVE_BOOT_COMPLETED` receiver + foreground service with a notification |
| Security | Bind to the LAN only, reject non-private clients (same `lan_only` rule), no port-forwarding, optional PIN |
| Wake from standby | The TV's own network stack must wake it; the phone can keep using Wake-on-LAN from the phone side (not possible from a browser), so a Shortcut or the receiver may still be needed for wake |

## How to install an APK on a TV (for testers)

1. Build the APK (`./gradlew assembleDebug`).
2. On the TV enable *Developer options* (Settings, About, tap *Build* seven times), then *USB debugging* or *Network debugging* (some TVs call it *ADB debugging*).
3. From a computer: `adb connect <tv-ip>:5555` then `adb install app-debug.apk`.
4. Or copy the APK to a USB drive and open it with a TV file manager; allow *Install unknown apps*.

## Acceptance checklist

- [ ] The TV app starts on boot and shows its address on screen once
- [ ] The same `docs/` PWA works unchanged against it (same WebSocket protocol, see [05-protocol-and-api.md](05-protocol-and-api.md))
- [ ] Keys, text, app launch, scenes, sleep timer and volume work
- [ ] It refuses non-LAN clients
- [ ] No ads, no analytics, no account
- [ ] README section and a signed release APK

If you start working on it, open an issue titled "Android TV app" so we can coordinate.
