# 3. Troubleshooting

> Italiano: [it/03-problemi-comuni.md](it/03-problemi-comuni.md) · Back to the [README](../README.md)

Each item reads: **symptom**, then **cause**, then **fix**.

## The TV screen says to turn on network debugging

- **Cause:** ADB over the network is off on the TV.
- **Fix:** Settings, Device Preferences, Developer options: turn on **USB debugging** and **Network debugging** (names vary by brand). If you do not see Developer options, tap **Build** seven times in Settings, Device Preferences, About. See [01-install-on-your-tv.md](01-install-on-your-tv.md).

## The TV screen says to allow the connection

- **Cause:** the TV is showing, or showed, the **Allow USB debugging?** message and nobody pressed *Allow*.
- **Fix:** tick **Always allow from this computer** and press **Allow** with the TV remote. The message disappears after about a minute; the app asks again by itself. If it never appears, switch Network debugging off and on again, then reopen GlassRemoteTv.

## The app on the phone asks for the PIN

- **Cause:** this phone (or this Home Screen app) is not signed in yet, or the PIN changed.
- **Fix:** scan the QR code on the TV screen, or type the 6 digits shown on the TV. On iPhone the Safari tab and the Home Screen icon are separate, so each needs the PIN once.

## "Locked" or "too many tries"

- **Cause:** 5 wrong PIN tries lock that address for 1 minute. The lock doubles each round, up to 15 minutes. Only your device is locked, not the others.
- **Fix:** wait, then type the PIN shown on the TV, or scan the QR code. After 30 wrong tries in total the app picks a new PIN by itself: read the new one on the TV screen.

## The phone cannot open the address

- **Cause:** different network, VPN or mobile data in the way, guest Wi-Fi with client isolation, or the TV address or port changed.
- **Fix:** phone on the same Wi-Fi as the TV, VPN off. Use the main network, not the guest network, or turn off *AP / client isolation* on the router. Read the current address and port on the TV screen and scan the QR code again. If the page does not load, check that GlassRemoteTv is open or running on the TV (open it once).

## It stopped working after the TV restarted

- **Cause:** the TV got a new address from the router, or network debugging was reset by the TV.
- **Fix:** scan the QR code on the TV screen again. Give the TV a fixed address in your router. Check that **Network debugging** is still on. The port stays the same after a restart, but the address can change.

## The remote does nothing, but the app opens

- **Cause:** network debugging off, or the authorization was revoked.
- **Fix:** turn on Network debugging, reopen GlassRemoteTv on the TV and tick *Always allow from this computer*, then press *Allow*, when asked. The TV screen should say *Connected and ready*.

## The TV does not wake from standby

- **Cause:** a TV in deep standby may close the network, and the app then cannot reach it.
- **Fix:** turn the TV on once with its own remote. Enable *Wake on LAN*, *Wake on Wi-Fi* or *Network standby* in the TV settings if they exist. Not every TV supports it.

## I cannot find the app on the TV

- **Cause:** the app is not on the Home screen by itself. It is in the **Apps** tab, as the last tile. The favorites row of the TV Home screen is separate.
- **Fix:** open the Apps tab and look at the last tile. To add it to the Home favorites row, follow [Put the app on your TV Home screen](01-install-on-your-tv.md#put-the-app-on-your-tv-home-screen-optional) in guide 01. If it is not in the Apps tab either, see the next item.

## The app is not in the TV apps list

- **Cause:** the install did not finish, or the TV lists it only in the system apps row.
- **Fix:** look in Settings, Apps, See all apps. Install again (see [01-install-on-your-tv.md](01-install-on-your-tv.md)). If the TV says "App not installed", see the next item.

## "App not installed" or an update fails

- **Cause:** the old copy was signed with a different key (for example one you built yourself), and Android does not let an APK signed with another key replace it.
- **Fix:** uninstall the old GlassRemoteTv from Settings, Apps. Install the new APK. Open it and approve the connection once more. You get a new PIN and a new port.

## The TV says it cannot install unknown apps

- **Cause:** *Install unknown apps* is off for the app you use to open the APK.
- **Fix:** allow it for Downloader (or your file manager) in the TV settings (Settings > Device Preferences > Security & restrictions > Unknown sources; menu names vary by TV brand), then try again.

## iPhone: the layout is too short the first time

- **Cause:** an iOS quirk on the very first launch after *Add to Home Screen*.
- **Fix:** close the app from the app switcher and open it again.

## iPhone: the app asks for the PIN again after adding it to the Home Screen

- **Cause:** the Safari tab and the Home Screen icon have separate storage.
- **Fix:** type the PIN once in the installed app. You need to do it only once.

## The app looks old after an update

- **Fix:** close and reopen it. If it stays old, delete the Home Screen icon and add it again.

## Still stuck?

Open an issue and include: phone model and OS, TV brand, model and Android version, what the TV screen says, what you see on the phone. **Remove IP addresses, the PIN and any personal data** from screenshots and logs before posting. For a security problem, use a private security advisory (see [02-security.md](02-security.md)).
