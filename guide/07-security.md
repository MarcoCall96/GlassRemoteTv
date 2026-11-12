# 7. Security and privacy

> Italiano: [it/07-sicurezza.md](it/07-sicurezza.md)

## What GlassRemote does not do

- No account, no sign-in, no ads, no analytics, no tracking, no cloud.
- No data is sent to any server. The app and the receiver talk to each other and to your TV, only inside your home network.

## What you must do

1. **Never open ports on your router** for the receiver (no port forwarding, no DMZ). Never expose it to the internet.
2. Keep **UPnP** off on your router if you do not need it, so nothing opens ports by itself.
3. Run the receiver only on a computer you trust, on your **home** network.
4. Protect `receiver/bridge-data/`: `cert.pem` and `key.pem` are the identity your TV trusts. Anyone who gets them on your network can control the TV. They are in `.gitignore`; never upload them, never attach them to an issue.
5. Do not use the receiver on public Wi-Fi (cafes, hotels, offices) other than a network you control.
6. If you use a work computer, ask the IT team first. Do not change firewall settings on devices you do not own.

## How the receiver protects itself

- By default it listens on `127.0.0.1` only. `--lan` is needed to let the phone in.
- Even with `--lan`, a middleware accepts only **private (RFC 1918) and loopback** client addresses. Requests from public IPs get an error.
- Web pages cannot control the receiver: it refuses requests whose Host is not a private IP address or localhost, requests with a foreign Origin, and requests marked cross-site by the browser.
- Command endpoints only exist on the local network; the computer receiver has no authentication layer, so treat everyone on your Wi-Fi as able to control the TV. Do not run it on a network shared with strangers.

## The TV app (GlassRemoteTv): network debugging and PIN

The TV app presses the remote keys through Android's debug bridge (ADB) over the TV's own loopback address. For that, **network debugging** must be on (Settings, Device Preferences, Developer options). Things to know:

- A device that wants to use ADB on the TV must be approved on the TV screen. Ticking *Always allow from this computer* trusts it for good. GlassRemoteTv approves itself once and then stays trusted.
- With network debugging on, any computer on your Wi-Fi that you approve on the TV screen gets deep control of the TV. Do not approve prompts you do not recognize.
- You can switch it off at any time. The remote then stops working until it is on again. *Revoke USB debugging authorizations* in Developer options removes every trusted device.
- GlassRemoteTv itself is protected by a **6-digit PIN**, shown on the TV and inside the QR code. A phone types it (or scans the QR code) once and receives a long random token that it keeps. Without a valid token the TV app ignores every command. The PIN lock is kept per client address: 5 wrong tries lock that address for 1 minute, doubling each round up to 15 minutes, and after 30 wrong tries in total the TV app picks a new PIN by itself (the TV screen and the QR code update). The port is random for each installation, not a fixed well-known number.
- The traffic on your home network is not encrypted (plain HTTP), so do not use it on Wi-Fi you do not trust. A guest on your Wi-Fi can only use the TV if they see the PIN or the QR code on your TV screen.
- The PIN stays the same until the app data is cleared. If you want a new PIN, clear the app data in Android settings (this also removes all trusted phones).

## If you publish a fork or screenshots

Remove, before publishing: IP and MAC addresses, TV names, Wi-Fi names, computer or user names in paths, `bridge-data/`, logs. Replace them with placeholders like `192.168.x.x`.

## Reporting a vulnerability

Open a private security advisory on GitHub (*Security, Report a vulnerability*) rather than a public issue.
