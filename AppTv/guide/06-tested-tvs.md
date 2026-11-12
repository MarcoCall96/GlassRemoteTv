# 6. Tested TVs

> Italiano: [it/06-tv-testate.md](it/06-tv-testate.md) · Back to the [README](../README.md)

An honest page: which TVs the TV app has really been tried on, what to expect on yours, how to test it in 5 minutes and how to tell us the result.

## Tested TVs

Only one TV has been verified so far. Every other row is waiting for a report: nothing is assumed.

| TV | Android version | Features checked | Notes |
|---|---|---|---|
| Panasonic 4KTV-JUP (Jupiter, MediaTek), ARMv7, Google TV launcher, Italian interface | Android 10 (SDK 29) | OK: install via adb; QR code + PIN; phone sign-in from an iPhone 16 Pro (Safari and Home Screen icon); keys (about 10 ms with the key helper); volume; app launch; scenes; wake from standby; sleep timer; open a link on the TV (YouTube opened); TV health screen; clean cache; automatic restart in standby; pinning the app in the Home favorites row | After the automatic restart the TV was back in about 95 seconds, and Network debugging and the app came back by themselves |
| Your TV here | Waiting for reports | Waiting for reports | [Report your TV](#report-your-tv) |
| Your TV here | Waiting for reports | Waiting for reports | [Report your TV](#report-your-tv) |
| Your TV here | Waiting for reports | Waiting for reports | [Report your TV](#report-your-tv) |

## What Android version do I need?

The APK installs from **Android 5.0 (API 21)**. That is only the technical minimum and it is **not tested**. The version tested is **Android 10**.

The real requirement is that the TV offers **Network debugging** (ADB over the network, on port 5555) in Developer options. The app uses the classic ADB protocol.

| Android version | What to expect |
|---|---|
| 9 and 10 | Likely OK. It is the family of the tested TV. |
| 7 and 8 | Likely OK for keys, apps and links. The Processes list of the TV health screen may be reduced (a different `top` command). |
| 11 and newer | **Untested.** Many recent TVs offer only **Wireless debugging** with a pairing code, which this app does not support: the TV then shows the QR code but cannot be controlled. Some devices (for example Chromecast with Google TV) may still offer the classic option through *USB debugging*: this is unverified. |

If the key helper cannot start, the app silently falls back to the slow method (about 1 second per key): the remote still works.

Not supported at all: Samsung (Tizen), LG (webOS), Roku, Fire TV and Apple TV.

## Test your TV in 5 minutes

Follow the steps in order and compare each result with the expected one. Stop at the first step that fails and note it for your report.

1. **Install** the APK ([01-install-on-your-tv.md](01-install-on-your-tv.md)). Expected: a GlassRemoteTv icon is in the TV apps.
2. **Turn on Network debugging** in Developer options, open the app and, when the TV asks *Allow USB debugging?*, tick *Always allow from this computer* and press *Allow*. Expected: no error on the TV. If there is no such setting, or only *Wireless debugging* with a pairing code, your TV is not compatible: please report it.
3. **Open the app on the TV.** Expected: the screen shows a QR code, an address, a PIN and *Connected and ready*.
4. **Scan the QR code** with the phone camera. Expected: the remote opens and signs in by itself.
5. **Press a few keys** (arrows, OK, Back). Expected: the TV reacts at once (about 10 ms with the key helper; about 1 second per key if it falls back to the slow method).
6. **Volume** up and down. Expected: the TV volume changes.
7. **Open an app** from the Apps tab. Expected: the app opens on the TV.
8. **Wake the TV from standby** with the remote on your phone. Expected: the TV turns on (this depends on the TV, see [03-troubleshooting.md](03-troubleshooting.md)).
9. **Open a link:** on the Apps screen, paste a YouTube link in *Open a link on the TV* and tap *Open on TV*. Expected: the TV opens the link in the YouTube app, if it is installed.
10. **Open TV health** (Settings > TV health). Expected: CPU and memory numbers appear and refresh.
11. *Optional:* tap **Clean** in Maintenance. Expected: the screen shows the MB freed (0 is normal).
12. *Optional, advanced:* set an **automatic restart** 3 minutes ahead (see [05-health-and-maintenance.md](05-health-and-maintenance.md)) and put the TV in standby. Expected: the TV restarts and comes back with the app and Network debugging still on. If Network debugging turned off, say so in your report.

## Report your TV

Please tell us how it went, even if everything worked. Open the report form: [TV report](https://github.com/MarcoCall96/GlassRemoteTv/issues/new?template=tv-report.yml).

Include:

- the **brand and model** of the TV;
- the **Android version** (Settings > Device Preferences > About);
- the launcher / Home screen (for example Google TV or Android TV);
- **what worked** and **what did not** (the checklist above helps);
- a **screenshot of the TV screen** if the app shows an error.

Do not post IP addresses, the PIN or other personal data. Reports will be added to the table above.
