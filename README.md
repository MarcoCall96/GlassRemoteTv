<div align="center">

<img src="docs/assets/icon-192.png" width="120" alt="GlassRemote icon" />

# GlassRemote

**A free, ad-free, glassy remote control for your Android TV.**
**No ads. No account. No tracking. No limits. It never freezes on you.**

[Try the live demo](https://marcocall96.github.io/GlassRemoteTv/) · [Install on iPhone / Android](guide/01-install-on-your-phone.md) · [Italiano](README.it.md)

![license](https://img.shields.io/badge/license-MIT-blue) ![ads](https://img.shields.io/badge/ads-none-brightgreen) ![PWA](https://img.shields.io/badge/PWA-iPhone%20%2B%20Android-black) ![dependencies](https://img.shields.io/badge/frontend%20dependencies-0-orange)

</div>

---

## Why this exists

Most TV remote apps are full of ads, locked behind subscriptions, limited to a few buttons, and crash at the worst moment.
GlassRemote is a small, fast, open-source web app that does one thing: **control your TV**.

- **Liquid Glass design** made for the iPhone 16 Pro, and it looks great on Android too
- **Zero ads, zero accounts, zero analytics.** Everything stays on your home network
- **Installs like a real app** (PWA): add it to your home screen, no App Store needed
- **Pure HTML, CSS and JavaScript.** No framework, no build step, no external libraries

## Features

| | |
|---|---|
| Navigation | D-pad, touch pad, number pad, home, back, menu |
| Keyboard | Full QWERTY, voice dictation, paste |
| Apps | Official app icons, recent apps, edit mode, one tap to launch |
| Scenes | "Cinema", "Night" and your own: app + volume + sleep timer in one tap |
| Sleep timer | Turn the TV off after 15, 30, 60 minutes or more |
| Many TVs | Favorites, quick TV switcher, automatic TV discovery |
| Siri / Shortcuts | Control the TV by voice through iOS Shortcuts |
| One-handed mode | Reachable layout for big phones |
| Languages | Italiano, English, Español, Français, Deutsch, Português. Automatic or chosen in Settings |
| Offline | The interface opens even with no connection |

## How it works (the honest version)

A web page cannot talk directly to a TV: browsers cannot open raw TCP sockets, and an HTTPS page cannot call a device on your home network.
So GlassRemote has two parts:

```
 [ Phone: the app ]  --Wi-Fi-->  [ Receiver ]  --Android TV Remote v2-->  [ Your TV ]
   docs/  (PWA)                   receiver/ (Python, ~600 lines)           ports 6466 / 6467
```

1. **The app** (`docs/`): the interface you see. It also runs as a **demo** on GitHub Pages, with a fake TV.
2. **The receiver** (`receiver/`): a tiny Python program that runs on a computer in your home and talks to the TV using the official Android TV Remote protocol. It also serves the app to your phone.

> The live demo on GitHub Pages is just a preview: it cannot control a real TV.
> To control your TV, open the app **from your receiver** (`http://<computer-ip>:8780`).

> **Roadmap:** an Android app for the TV itself, so the receiver lives inside the TV and you do not need a computer at all. See [guide/06-android-tv-app-roadmap.md](guide/06-android-tv-app-roadmap.md). Contributors welcome!

## Quick start (5 minutes)

**You need:** a computer on your home Wi-Fi (Windows, macOS or Linux) with [Python 3.10+](https://www.python.org/downloads/), and an Android TV / Google TV on the same network.

```bash
git clone https://github.com/MarcoCall96/GlassRemoteTv.git
cd GlassRemoteTv/receiver
python -m venv venv
# Windows:  venv\Scripts\activate        macOS / Linux:  source venv/bin/activate
pip install -r requirements.txt
python bridge.py --lan
```

The receiver prints an address like `http://192.168.x.x:8780/`.

1. On your phone (same Wi-Fi) open that address. **iPhone:** Safari, then Share, then *Add to Home Screen*. **Android:** Chrome, then menu, then *Add to Home screen / Install app*.
2. In the app tap **+** or **Search TVs on the network** and choose your TV.
3. The TV shows a **6-character code**. Type it in the app (**Pair**). Done, you only pair once.

> The app speaks **6 languages** (Italiano, English, Español, Français, Deutsch, Português). It follows your phone by default; change it in **Settings, Language**.

Need more help? [Step-by-step guide](guide/01-install-on-your-phone.md) · [Receiver guide](guide/02-run-the-receiver.md) · [Troubleshooting](guide/04-troubleshooting.md)

## Which TVs work?

Any TV that runs **Android TV or Google TV** (Sony, Philips, TCL, Hisense, Xiaomi, Panasonic, Sharp, Nvidia Shield, Chromecast with Google TV and more).
Samsung (Tizen), LG (webOS), Roku and Fire TV are **not supported yet**. Full list: [guide/03-compatible-tvs.md](guide/03-compatible-tvs.md).

## Let an AI assistant do the setup for you

This repo ships with [`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md): complete instructions for an AI coding assistant (Claude, Copilot, Codex...).
Open the repo with your assistant and say: **"Set up GlassRemote for me."** It will walk you through every step, in your language.

## Privacy and security

- No data leaves your home network. There is no server, no analytics, no account.
- The receiver only answers to devices on your **local network** and refuses everything else.
- **Never open ports on your router for it.** Never expose it to the internet.
- Your pairing key and certificate stay in `receiver/bridge-data/`, which is git-ignored.

More in [guide/07-security.md](guide/07-security.md).

## Contributing

Ideas, bug reports and pull requests are very welcome, especially for:

- the **Android TV app** (Kotlin) that makes the computer unnecessary
- support for **Samsung, LG, Roku, Fire TV**
- new **languages** and better translations
- testing on more TVs and phones

See [CONTRIBUTING.md](CONTRIBUTING.md). If GlassRemote saves you from one more ad, **give it a star** so others can find it.

## Credits and trademarks

Built on [androidtvremote2](https://github.com/tronikos/androidtvremote2) (Apache-2.0), [aiohttp](https://github.com/aio-libs/aiohttp) and [segno](https://github.com/heuer/segno). Brand logos come from [Simple Icons](https://simpleicons.org/).
All product names, logos and app icons are trademarks of their respective owners and are used only to identify the apps on your TV. This project is not affiliated with or endorsed by any TV or streaming brand.

## License

[MIT](LICENSE)
