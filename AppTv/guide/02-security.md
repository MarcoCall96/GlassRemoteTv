# 2. Security and privacy

> Italiano: [it/02-sicurezza.md](it/02-sicurezza.md) · Back to the [README](../README.md)

Read this once before you install. It is short and honest.

## What GlassRemoteTv does not do

- No account, no sign-in, no ads, no analytics, no tracking, no cloud.
- No data is sent to any server. The app, your phone and your TV talk to each other only inside your home network.

## The threat model in plain words

GlassRemoteTv is made for **one home, one family, one trusted Wi-Fi**. It protects you from:

- a stranger on the internet (the app refuses every address that is not on a private network, and you never open a port on the router);
- a neighbour or a guest on your Wi-Fi who does not see your TV screen (they do not know the PIN and cannot guess it quickly).

It does **not** protect you from:

- someone who sits in front of your TV and can read the PIN or the QR code on the screen;
- someone who listens to your Wi-Fi traffic (plain HTTP is not encrypted);
- a computer on your Wi-Fi that you approve on the TV screen when the TV asks *Allow USB debugging?* (see the next section).

## What "network debugging" means

The TV app presses the remote keys through Android's debug bridge (ADB), connecting to the TV's own loopback address. This is the only way a normal app can do it: the official remote service refuses requests that come from the TV itself.

For that, **network debugging** must be ON in the TV's Developer options. The trade-off:

- A device that wants to use ADB on the TV must be approved on the TV screen. GlassRemoteTv approves itself once (you choose *Always allow*) and then stays trusted.
- With network debugging on, **any computer on your Wi-Fi that you approve on the TV screen gets ADB control of the TV**. That is shell-level control, much deeper than a remote. **Do not approve prompts you do not recognize.**
- If you switch network debugging off, the remote stops working until you switch it on again.

## How the PIN, the token and the port work

- **Random port.** On first start each installation picks its own port between 20000 and 59999, saves it and keeps it. It is not a fixed, well-known number. It is shown on the TV screen.
- **PIN.** A 6-digit PIN is shown on the TV screen and inside the QR code. The QR code opens `http://<tv-ip>:<port>/#pin=<PIN>`, so scanning it signs the phone in automatically. Or you open the address and type the PIN once.
- **Token.** After the right PIN, the phone receives a long random token and keeps it. Without a valid token the TV app ignores every command. The TV app remembers up to 30 phones. Tokens do not expire.
- **iPhone detail.** The Safari tab and the Home Screen icon have separate storage, so the installed app asks for the PIN once more.
- **Lock after wrong tries.** The lock is per address: 5 wrong tries lock that address for 1 minute, doubling at each round, up to 15 minutes. One device cannot lock the others out.
- **New PIN by itself.** After 30 wrong tries in total, the app picks a new PIN (the TV screen and the QR code update).
- **Private addresses only.** Only devices on your home network (private addresses) can connect.
- **Same PIN until reset.** The PIN, port and tokens stay until you clear the app data.

## What to do

1. Keep **Network debugging** off when you do not need the remote, or at least be careful about what you approve.
2. Approve ADB prompts on the TV only when you started them yourself.
3. Use it only on a home Wi-Fi you trust.
4. Give the TV a fixed address in your router if you can.
5. Check the APK checksum and signature before installing (see the [README](../README.md#verify-your-download)).
6. Keep your own signing key private if you build the app yourself.

## What not to do

- **Never forward a port on your router** to the TV. No port forwarding, no DMZ. Never expose the app to the internet.
- Do not use it on public or shared Wi-Fi (cafes, hotels, offices, guest networks with strangers). The traffic is plain HTTP, not encrypted.
- Do not share the PIN or a photo of the QR code.
- Do not use it on a TV or network that is not yours.
- Do not approve ADB prompts you do not recognize.

## How to switch it off

1. **Remote off:** turn off **Network debugging** and **USB debugging** in the TV's Developer options. The app stops controlling the TV until you turn them on again.
2. **Remove trusted computers:** use **Revoke USB debugging authorizations** in Developer options. The next time you start GlassRemoteTv it asks for the approval again (choose *Always allow* once more).
3. **New PIN, new port, all phones signed out:** clear the app data in Android settings (Apps, GlassRemoteTv, *Clear data*).
4. **Remove the app:** uninstall it from the Android settings.

## If you publish screenshots or logs

Remove IP and MAC addresses, TV names, Wi-Fi names, user names in paths, and any PIN or token before you post. Replace addresses with `192.168.x.x`.

## Reporting a vulnerability

Please open a **private security advisory** on GitHub (*Security*, *Report a vulnerability*) in this repository, not a public issue. Describe what you found and how to reproduce it. Do not include your own PIN, tokens or addresses.

See also: [01-install-on-your-tv.md](01-install-on-your-tv.md), [03-troubleshooting.md](03-troubleshooting.md).
