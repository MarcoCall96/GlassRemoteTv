# 1. Install GlassRemoteTv on your TV

> Italiano: [it/01-installare-sulla-tua-tv.md](it/01-installare-sulla-tua-tv.md) · Back to the [README](../README.md)

This guide takes you from zero to a working remote on your phone. It needs about 5 minutes and no computer (a computer is only one of the three install methods).

Before you start, read [02-security.md](02-security.md) once. The app needs **network debugging** on the TV, and you should know what that means.

**You need:**

- an Android TV or Google TV (Android 5 or newer) that you own;
- an iPhone or an Android phone;
- the TV and the phone on the same home Wi-Fi (phone VPN off).

Samsung (Tizen), LG (webOS), Roku, Fire TV and Apple TV are not supported.

## Step 1. Get the APK

This step is for the USB stick and adb methods (B and C). With the Downloader app (method A) you download nothing now: the TV downloads the file itself in step 2, over HTTPS, from the official release address. In that case skip to step 2.

1. Open the [Releases page](https://github.com/MarcoCall96/GlassRemoteTv/releases) and download `GlassRemoteTv-0.4.1.apk`. The same file is also in this repository: [../release/GlassRemoteTv-0.4.1.apk](../release/GlassRemoteTv-0.4.1.apk).
2. Check it. The SHA-256 must match [../release/SHA256SUMS.txt](../release/SHA256SUMS.txt):
   - Windows: `Get-FileHash -Algorithm SHA256 GlassRemoteTv-0.4.1.apk`
   - macOS / Linux: `shasum -a 256 GlassRemoteTv-0.4.1.apk`

The TV cannot check a checksum, so with the Downloader app that check is skipped on the TV. If an AI assistant is helping you, it can check `release/GlassRemoteTv-0.4.1.apk` against `release/SHA256SUMS.txt` from the repository files for you.

## Step 2. Install it on the TV

Pick one method.

### Method A: the Downloader app (easiest)

1. On the TV, open the **Google Play Store**, search for **Downloader** (by AFTVnews) and install it.
2. Open Downloader. The first time it asks for permission to access media and files: choose **Allow**.
3. In the URL field, type the direct link to the APK, then press **Go**: `https://github.com/MarcoCall96/GlassRemoteTv/releases/download/v0.4.1/GlassRemoteTv-0.4.1.apk`. If that link does not work, use this one: `https://github.com/MarcoCall96/GlassRemoteTv/raw/main/AppTv/release/GlassRemoteTv-0.4.1.apk`.
4. When the download ends, choose **Install**.
5. If the TV says it cannot install unknown apps, allow **Install unknown apps** for Downloader (Settings > Device Preferences > Security & restrictions > Unknown sources; menu names vary by TV brand), then try again.

Typing a long link with the TV remote is slow and must be exact. If it is too tedious, use method B (USB stick) or C (adb) instead.

### Method B: USB stick

1. Copy `GlassRemoteTv-0.4.1.apk` to a USB stick.
2. Plug the stick into the TV and open a file manager app on the TV.
3. Select the APK and choose **Install**. Allow **Install unknown apps** for the file manager if asked.

### Method C: from a computer with adb

1. Install Android platform-tools on the computer (the computer must be on the same network as the TV).
2. Turn on network debugging on the TV first (step 3 below), then run:

```
adb connect 192.168.x.x:5555
adb install GlassRemoteTv-0.4.1.apk
```

Replace `192.168.x.x` with the TV address (TV Settings, Network). The TV will ask you to allow this computer. Tick **Always allow from this computer** only for your own computer, then press **Allow**.

**Check:** a **GlassRemoteTv** icon appears in the TV apps.

## Step 3. Turn on network debugging

1. On the TV open **Settings > Device Preferences > About** and tap **Build** (or *Android TV OS build*) seven times. A message says you are now a developer.
2. Press back, then open **Developer options** (in **Settings > Device Preferences**).
3. Turn on **USB debugging** and **Network debugging**. The names vary by brand; look for ADB or debugging over the network.

**Check:** the Developer options list shows both switches on.

## Step 4. First start

1. Open **GlassRemoteTv** from the TV apps.
2. The TV asks **Allow USB debugging?**. Tick **Always allow from this computer**, then press **Allow**. You do this once. If the message disappears, the app asks again by itself after a minute.
3. The screen shows a **QR code**, an **address** with its own port (for example `http://192.168.x.x:<port>`) and a **6-digit PIN**.

**Check:** the screen says *Connected and ready*. Keep the app open on the TV for now: you need the 6-digit PIN shown on it in step 6 (and in step 5 if scanning does not work). If you already left the app, open **GlassRemoteTv** from the TV apps list to see the PIN again. The app keeps running in the background and starts again when the TV boots. The port stays the same after a restart.

Every installation picks its own random port (between 20000 and 59999) the first time and keeps it.

## Step 5. Connect your phone

1. Phone on the same Wi-Fi. Scan the QR code on the TV screen with the camera. On iPhone, tap the yellow banner/link the Camera shows at the top (or open the link in Safari). The app opens and signs in by itself.
2. Or open the address shown on the TV in Safari (iPhone) or Chrome (Android) and type the 6-digit PIN once. The PIN is on the TV screen, next to the QR code.

**Check:** the remote opens. Press an arrow: the TV reacts.

## Step 6. Add it to the Home Screen

- **iPhone:** in Safari, tap Share, then **Add to Home Screen**. Open the new icon and type the 6-digit PIN (shown on the TV) once more. The Safari tab and the Home Screen icon have separate storage, so the installed app asks for the PIN on its own.
- **Android:** in Chrome, open the menu and choose **Install app**.

If the layout looks too short the very first time after adding it to the Home Screen on iPhone, close the app from the app switcher and open it again.

From then on the app opens already connected.

## Put the app on your TV Home screen (optional)

After the install, the app is in the **Apps** tab of the TV, as the last tile, with its banner (GlassRemote, TV receiver). If you want it in the favorites row of the Home screen, do this. It was tested on a Google TV launcher with Android 10 and an Italian interface. Names vary by brand and language.

**Before you start, decide which position you want** (for example first, fifth or last). You will need it in step 3.

1. Press **Home** on the TV remote and go to the **Favorite apps** row ("App preferite").
2. Move to the last tile of the row, **Add apps to favorites** ("Aggiungi app ai preferiti"), and press **OK**. In the **Select apps** list ("Seleziona app") choose **GlassRemoteTv**. It is added at the end of the row.
3. To move it, focus its tile and **press and hold OK** until a menu appears (*Remove from favorites*, *Move*, *Open*). Choose **Move**, then press **Left** or **Right** to reach the position you want. Each press moves it one place. Press **OK** to drop it.

Moving left by N places from the last position puts the app in position (count - N), where count is the number of tiles in the row. For example, with 8 apps in the row, 3 presses of Left put it in position 5.

**Check:** the app tile is in the row, in the position you chose.

## Language

The app follows your phone. To change it, open **Settings, Language**: Italiano, English, Español, Français, Deutsch, Português.

## If the TV address changes

Some routers give the TV a new address after a restart. If the app stops finding the TV, scan the QR code on the TV screen again. Better: give the TV a fixed address in your router.

## Update

Install the new APK the same way, over the old one. Your PIN, port and signed-in phones stay. An APK signed with a different key cannot be installed over the old one: uninstall the old app first (see [04-build-from-source.md](04-build-from-source.md)).

## Switch it off

1. On the TV, turn off **Network debugging** and **USB debugging** in Developer options. The remote stops working until you turn them on again.
2. To remove every trusted computer, use **Revoke USB debugging authorizations** in Developer options.
3. To forget everything in the app (new PIN, new port, all phones signed out), clear the app data: Android settings, Apps, GlassRemoteTv, *Clear data*.
4. To remove the app, uninstall it from the same screen.

Something not working? See [03-troubleshooting.md](03-troubleshooting.md).
