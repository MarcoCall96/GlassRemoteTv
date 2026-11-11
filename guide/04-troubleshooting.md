# 4. Troubleshooting

> Italiano: [it/04-problemi-comuni.md](it/04-problemi-comuni.md)

## The phone cannot open the receiver address

- Same Wi-Fi? Phone and computer must be on the **same network**. Mobile data off, VPN off.
- Receiver started **with `--lan`**? Without it, only the computer itself can connect.
- **Windows firewall / network profile:** set your Wi-Fi to **Private** (Settings, Network, Wi-Fi, *Network profile type*). On a Public profile Windows blocks incoming connections. Allow Python on private networks when asked.
- **Client isolation:** guest Wi-Fi and some routers stop devices from seeing each other. Use the main network or disable *AP / client isolation*.
- Try `http://<computer-ip>:8780/connect` from the computer to see the correct IP and a QR code.
- Port 8780 used by something else? Start with `--port 8790` and use the new address.

## The app opens but says "No receiver connected"

- You probably opened the **GitHub Pages demo**. Pages is HTTPS and cannot reach your receiver (browsers block HTTPS pages from calling local HTTP devices). Open the app from `http://<computer-ip>:8780/` instead.
- Check **Settings, Advanced, Receiver address**: leave it empty when you open the app from the receiver.
- Is the receiver window still running?

## No TV found

- TV is on and on the same network (Wi-Fi or Ethernet).
- The search scans the receiver's local `/24` subnet (for example `192.168.1.0-255`). If your TV is on another subnet, add it manually with **+** and its IP.
- Android TV Remote needs port **6466**. Test from the computer: `Test-NetConnection <tv-ip> -Port 6466` (Windows PowerShell) or `nc -vz <tv-ip> 6466` (macOS / Linux).
- A Samsung, LG or Roku TV is detected but marked "not supported yet": see [03-compatible-tvs.md](03-compatible-tvs.md).

## Pairing fails or the code never appears

- Make sure no other device is in the middle of pairing with the TV.
- Type the code in **capitals**, exactly as shown (6 characters, letters A-F and digits).
- Delete `receiver/bridge-data/` and restart the receiver, then pair again.
- On the TV, if you previously paired many remotes, remove old ones in *Settings, Remotes & accessories*.

## Commands lag or stop working after a while

- The TV may have gone to deep standby. Tap the power button in the app (wake) or turn it on once with the real remote.
- Power-saving Wi-Fi on the TV or router can delay packets. Prefer Ethernet on the TV or enable *Wi-Fi always on* / *Network standby*.
- Restart the receiver. Make sure only one copy of it is running.

## The TV does not turn on from standby

Not every TV supports it. Enable *Wake on LAN / Wake on Wi-Fi / Network standby* in the TV's settings. Otherwise turn the TV on with its own remote once, then use the app.

## The app looks old after an update

Close and reopen it. If it persists, delete the home screen icon, add it again. On the development side bump `VERSION` in `docs/service-worker.js` and `?v=N` in `docs/index.html`.

## iPhone specifics

- Haptic vibration does not work in iPhone web apps (iOS limitation).
- Over plain HTTP Safari does not register the offline service worker. The app still opens; offline caching only applies over HTTPS.
- Dictation uses the iOS keyboard microphone, not a GlassRemote feature.

## Siri / Shortcuts does nothing

- The shortcut must use **Get contents of URL** with the full address shown in Settings.
- It only works on your home Wi-Fi and while the receiver is running.

## Still stuck?

Open an issue and include: phone model and OS, computer OS, TV brand/model, what the receiver window prints, and what you see in the app. **Remove IP addresses and any personal data from screenshots and logs** before posting.
