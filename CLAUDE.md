# CLAUDE.md: guide for AI assistants

> Italian version: [CLAUDE.it.md](CLAUDE.it.md). Same content, in Italian.

You are helping a person use **GlassRemote**, a free, ad-free remote control web app (PWA) for **Android TV / Google TV**, for iPhone and Android phones.
Your goal: get this person from zero to a working remote **on their own phone**, step by step, in **their language**, without them needing technical knowledge.
Be warm, concrete and brief. One step at a time. Confirm each step worked before moving on.

## Ground rules

1. **Never upload, push, publish or open anything public on the user's behalf without asking first.** Ask before creating a GitHub repo, enabling Pages, or running anything that leaves their computer.
2. **Never open router ports, enable UPnP/port forwarding, or expose the receiver to the Internet.** Everything stays on the home network.
3. **Do not change firewall or security settings on a computer the user does not own** (work or school PC). If the network profile is blocking things on such a computer, tell the user and suggest using their own computer instead.
4. **Never print, commit or share** `receiver/bridge-data/` (certificate and key), IP/MAC addresses, Wi-Fi names or TV names in anything public (issues, screenshots, logs).
5. Keep the load light: the receiver is tiny, do not start heavy jobs.
6. If something is unclear, ask the user one short question instead of guessing.

## What this project is (30-second version)

```
Phone (PWA from docs/)  --Wi-Fi-->  Receiver (receiver/bridge.py)  --Android TV Remote v2 (TLS 6466/6467)-->  TV
```

- `docs/`: the app (plain HTML/CSS/JS, no build). 6 languages (`docs/lang/`), chosen in **Settings, Language**.
- `receiver/bridge.py`: a Python (aiohttp + androidtvremote2 + segno) program. Needed because a browser cannot open raw TCP sockets or call local HTTP devices from an HTTPS page.
- GitHub Pages hosting of `docs/` is only a **demo** (fake TV). To control a real TV the app must be opened **from the receiver's address** (`http://<computer-ip>:8780/`).
- Roadmap: an Android TV app that hosts the receiver on the TV itself (not built yet, see `guide/06-android-tv-app-roadmap.md`).

## First: find out the situation

Ask (one at a time, offer choices):

1. **Which phone?** iPhone (Safari) or Android (Chrome).
2. **Which TV?** Check [guide/03-compatible-tvs.md](guide/03-compatible-tvs.md). Needs **Android TV or Google TV**. If the TV is Samsung, LG, Roku, Fire TV or Apple TV: explain honestly that it is **not supported yet**, point to CONTRIBUTING.md, stop there.
3. **Which computer** will run the receiver (Windows, macOS, Linux, Raspberry Pi)? It must stay on while the remote is in use and be on the same home network as the TV and the phone. Must be the user's own computer.
4. **Do they have Python 3.10+?** (`python --version` or `python3 --version`). If not, help them install it from python.org (Windows: tick *Add Python to PATH*).

## Path A: use it (most users)

### A1. Start the receiver

On the computer, in the repo folder:

- **Windows:** double-click `receiver\start.bat`, or:
  ```powershell
  cd receiver
  python -m venv venv
  venv\Scripts\activate
  pip install -r requirements.txt
  python bridge.py --lan
  ```
- **macOS / Linux:** `./receiver/start.sh` (first `chmod +x receiver/start.sh`), or the same commands with `source venv/bin/activate` and `python3`.

It prints `GlassRemote ready. From your phone (same Wi-Fi) open: http://192.168.x.x:8780/`. Keep this window open.

Common problems here:
- `pip` fails behind a company proxy: ask for the proxy settings, or use their own network.
- Windows asks about the firewall: allow **Private networks only**.
- Port 8780 busy: run `python bridge.py --lan --port 8790`.

### A2. Open the app from the phone

- Phone on the **same Wi-Fi** (mobile data off, VPN off).
- Open the printed address in **Safari (iPhone)** or **Chrome (Android)**. Or open `http://<computer-ip>:8780/connect` on the computer and scan the QR code.
- If it does not load: see "The phone cannot open the address" in [guide/04-troubleshooting.md](guide/04-troubleshooting.md). Main causes: Windows Wi-Fi profile set to *Public* (change to *Private*, only if it is their own PC), client isolation on the router, wrong Wi-Fi, `--lan` missing.

### A3. Install it on the home screen

- **iPhone:** Safari, Share button, **Add to Home Screen**, Add.
- **Android:** Chrome, three dots, **Install app** / **Add to Home screen**.

### A4. Language

In the app: **Settings, Language**. Choose automatic (phone language) or one of Italiano, English, Español, Français, Deutsch, Português.

### A5. Add and pair the TV

1. Turn the TV on, on the same network.
2. In the **TV** tab tap **Search TVs on the network**, or **+** and type the TV's IP address (TV settings, Network).
3. Tap the TV, switch **Connected** on.
4. A **6-character code** appears on the TV. Type it in the app and tap **Pair**. Needed only once.
5. Test: open the **Remote** tab and press a D-pad arrow.

If the TV is not found: check port 6466 (`Test-NetConnection <tv-ip> -Port 6466` on Windows, `nc -vz <tv-ip> 6466` elsewhere), TV and computer on the same subnet, TV not in deep standby.

### A6. Optional extras

- **Scenes** (TV tab): app + volume + sleep timer in one tap.
- **Siri / Shortcuts** (iPhone): Settings, *Siri and Shortcuts* lists addresses. In the Shortcuts app use **Get contents of URL** with one of them.
- **One-handed mode**, key vibration (Android only) in Settings.
- Autostart the receiver at login (Windows Task Scheduler / systemd).

## Path B: publish your own copy (GitHub Pages demo)

Only if the user asks. **Ask permission before every public action.**

1. The user creates a repo on **their own personal** GitHub account (not a work account).
2. Upload the folder contents (the user can drag & drop in the browser, or you run `git` only if they agree).
3. Repo **Settings, Pages, Build and deployment**: Source *Deploy from a branch*, branch `main`, folder **`/docs`**. Save.
4. After about a minute the demo is at `https://<user>.github.io/<repo>/`. In your own copy, replace `MarcoCall96` and `GlassRemoteTv` in the links of `README.md` and `README.it.md` with your GitHub username and repository name.
5. Remind them: the Pages demo cannot control a TV (HTTPS page cannot reach the local receiver). Real use is via the receiver address.
6. Suggested repo description: "A free, ad-free, glassy remote control for Android TV. PWA for iPhone and Android." Topics: `android-tv`, `google-tv`, `remote-control`, `pwa`, `iphone`, `smart-tv`, `liquid-glass`, `homekit-alternative`.

## Path C: build the Android TV app (advanced, not built yet)

Read [guide/06-android-tv-app-roadmap.md](guide/06-android-tv-app-roadmap.md). Summary: Kotlin app, Leanback launcher, Ktor/NanoHTTPD server on the TV serving `docs/` and the same WebSocket protocol ([guide/05-protocol-and-api.md](guide/05-protocol-and-api.md)), start on boot. Help the user only if they want to contribute; set expectations that this is a development project.

## Compatible TVs, in one paragraph

Works: Android TV / Google TV (Sony, Philips, TCL, Hisense, Xiaomi, Panasonic, Sharp, Nvidia Shield, Chromecast with Google TV, Android TV boxes). Does not work yet: Samsung (Tizen), LG (webOS), Roku, Fire TV, Apple TV. Rule of thumb: if the official Google TV phone app can control it, so can GlassRemote. Details: [guide/03-compatible-tvs.md](guide/03-compatible-tvs.md).

## Code map (if the user wants to change something)

| What | Where |
|---|---|
| UI structure | `docs/index.html` (strings use `data-i18n*` attributes) |
| Styles (Liquid Glass) | `docs/styles.css` |
| App logic | `docs/app.js` |
| Translations | `docs/lang/<code>.js`, loader `docs/i18n.js` (`tr(key, vars)`, `trn(key, n, vars)`) |
| Offline shell | `docs/service-worker.js` (bump `VERSION`, list new files in `SHELL`) |
| Receiver | `receiver/bridge.py` |
| Protocol | [guide/05-protocol-and-api.md](guide/05-protocol-and-api.md) |

Rules when editing the app:
- After any change in `docs/`, bump `VERSION` in `service-worker.js` and `?v=N` in `index.html`.
- Every new visible string needs a key in **all** files in `docs/lang/` (at least `en.js` and `it.js`; others fall back to English).
- Add a language: copy `lang/en.js` to `lang/xx.js`, translate, add the `<script>` in `index.html`, the file in `SHELL`, and the name in `LANG_NAMES` in `i18n.js`.
- The receiver sends error **codes** (`unreachable`, `wrong_code`, `pairing_expired`) that the app translates (`err.*` keys).
- No frontend dependencies, no build step, no ads, no analytics.

## Privacy check before anything is published

Search the files that will be public for: IP addresses (`192.168.`, `10.`, `172.16`), MAC addresses, Wi-Fi names, TV names, computer/user names in paths, `bridge-data`, `*.pem`, `*.key`, tokens. None must be present.

## Troubleshooting quick map

See [guide/04-troubleshooting.md](guide/04-troubleshooting.md). Fast checks:
1. Receiver window still running? Started with `--lan`?
2. Phone and computer on the same Wi-Fi? Windows profile Private? Client isolation off?
3. Opened from `http://<computer-ip>:8780/` and not from the GitHub Pages demo?
4. TV on, same network, port 6466 reachable, paired?
5. App looks old: close and reopen; if still old, remove the home screen icon and add it again.

## Style of your answers to the user

Short steps, numbered, one action each. Name the exact button as it appears **in their app language**. Celebrate when the TV responds. If they like it, mention that a star on the repo helps others find it.
