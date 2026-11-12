# 1. Install the app on your phone

> Italiano: [it/01-installare-sul-telefono.md](it/01-installare-sul-telefono.md)

You do **not** need the App Store or Google Play. GlassRemote is a web app (PWA) that you add to your home screen.

> **Before you start:** the app can only control a real TV when you open it **from your receiver** (see [02-run-the-receiver.md](02-run-the-receiver.md)).
> Opening it from GitHub Pages shows a demo with a fake TV. Both install the same way.

You need the address of your receiver. When you start it with `python bridge.py --lan` it prints:

```
GlassRemote ready.  From your phone (same Wi-Fi) open:  http://192.168.x.x:<port>/
```

The port is chosen by the receiver the first time and printed here. Your phone must be on the **same Wi-Fi** as the computer that runs the receiver. You can also open `http://<computer-ip>:<port>/connect` on the computer: it shows a **QR code** to scan with the phone camera.

## iPhone (Safari)

1. Open the address in **Safari** (it must be Safari, other iPhone browsers cannot install web apps the same way).
2. Tap the **Share** button (square with an arrow).
3. Scroll down and tap **Add to Home Screen** (*Aggiungi alla schermata Home*).
4. Tap **Add**. The GlassRemote icon appears on your home screen.
5. Open the app from the icon: it runs full-screen, like a native app.

Notes for iPhone:
- Over plain `http://` on your home network, Safari does not cache the app for offline use. The interface still opens instantly, but the receiver must be running to control the TV.
- Haptic vibration is not available in iPhone web apps. This is an iOS limitation.
- If the layout looks old after an update: delete the home screen icon and add it again.

## Android (Chrome)

1. Open the address in **Chrome**.
2. Tap the **three dots** menu.
3. Tap **Install app** or **Add to Home screen**.
4. Confirm. The icon appears on your home screen.

Notes for Android:
- On a plain `http://` address Chrome adds a shortcut that opens full-screen. Full offline caching needs HTTPS; this is optional and not required to control the TV.

## First time in the app

Pick your language first: **Settings, Language** (automatic by default, or Italiano, English, Español, Français, Deutsch, Português). The names below are the English ones.

### Add and pair your TV

1. Turn the TV **on**.
2. In the **TV** tab tap **Search TVs on the network**, or tap **+** and type the TV's IP address (TV Settings, Network, shows it).
3. Choose your TV. The status says **Needs pairing**.
4. The TV shows a **6-character code** on screen. Type it into the app and tap **Pair**.
5. The status becomes **Connected**. You only pair once.

### Control it

- **Remote tab:** D-pad, touch pad, number pad, QWERTY keyboard (with dictation and paste).
- **Apps tab:** tap an icon to launch the app. Use *Edit* to add or remove apps.
- **Scenes:** one tap sets app, volume and sleep timer.
- **Sleep timer:** turns the TV off after 15 minutes to 2 hours.

### Siri and Shortcuts (iPhone)

In **Settings**, *Siri and Shortcuts* shows ready-made addresses. In the iOS **Shortcuts** app create a shortcut with the action **Get contents of URL**, paste the address and name the shortcut how you want to say it ("Hey Siri, turn on the TV"). It only works on your home Wi-Fi.

## Updating

Pull the latest version of the repository on the computer that runs the receiver, restart the receiver, then close and reopen the app on the phone. If the old version still shows, delete the icon and add it again.

Something not working? See [04-troubleshooting.md](04-troubleshooting.md).
