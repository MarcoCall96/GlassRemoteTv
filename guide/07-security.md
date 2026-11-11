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
- Command endpoints only exist on the local network; there is no authentication layer, so treat everyone on your Wi-Fi as able to control the TV. Do not run it on a network shared with strangers.

## If you publish a fork or screenshots

Remove, before publishing: IP and MAC addresses, TV names, Wi-Fi names, computer or user names in paths, `bridge-data/`, logs. Replace them with placeholders like `192.168.x.x`.

## Reporting a vulnerability

Open a private security advisory on GitHub (*Security, Report a vulnerability*) rather than a public issue.
