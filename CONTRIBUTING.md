# Contributing

> Italiano: [CONTRIBUTING.it.md](CONTRIBUTING.it.md)

Thanks for helping! GlassRemote is small on purpose: plain HTML/CSS/JS for the app, one Python file for the receiver.

## Good first issues

1. **Add a language.** The app has 6 (Italiano, English, Español, Français, Deutsch, Português). Copy `docs/lang/en.js` to `docs/lang/xx.js`, translate the values, add the `<script>` in `docs/index.html`, the file in `SHELL` in `docs/service-worker.js` and the name in `LANG_NAMES` in `docs/i18n.js`. Native speakers are very welcome to review the existing translations too.
2. **Test on your TV.** Reports of tested TVs are very welcome: use the [TV report form](https://github.com/MarcoCall96/GlassRemoteTv/issues/new?template=tv-report.yml) (see [AppTv/guide/06-tested-tvs.md](AppTv/guide/06-tested-tvs.md)) with brand, model, Android TV version and what worked (wake from standby, volume, app launch, keyboard).
3. **TV app** (Java): see [tv-app/README.md](tv-app/README.md) and [guide/06-android-tv-app-roadmap.md](guide/06-android-tv-app-roadmap.md).
4. **Other brands:** Samsung (Tizen WebSocket API), LG (webOS SSAP), Roku (ECP), Fire TV (ADB). The receiver talks to TVs through the `Tv` class in `receiver/bridge.py`; add a class per protocol.
5. **Screenshots / demo GIF** for the README.

## Development

```bash
cd receiver
python -m venv venv && venv/bin/pip install -r requirements.txt   # Windows: venv\Scripts\...
python bridge.py            # localhost only, http://localhost:<port>/ (the port is printed)
```

Preview the interface without a TV: `cd docs && python -m http.server 8000`, then open `http://localhost:8000/` (a demo TV is shown).

Debug parameters for the app URL: `?s=tv|remote|apps|settings`, `&m=dpad|touch|numbers|keyboard`, `&f=fav|all`, `&on=1`, `&d=1`.

## Rules

- **Never commit personal data**: IP addresses, MAC addresses, Wi-Fi names, TV names, keys, certificates, screenshots showing them.
- After changing any file in `docs/`, bump `APP_VERSION` in `docs/version.js` and the `?v=N` in `docs/index.html`, so phones reload the new version. Then rebuild the TV app APK.
- Every new visible string needs a key in the language files (`docs/lang/`): at least `en.js` and `it.js`.
- No frontend dependencies, no build step.
- Keep the app usable with one hand and without ads or tracking. Those are the product.

## Pull requests

Small and focused. Say what you tested (phone, TV model). Screenshots are welcome for UI changes.
