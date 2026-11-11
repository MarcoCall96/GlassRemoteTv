# 5. Protocol and API reference

> Italiano: [it/05-protocollo-e-api.md](it/05-protocollo-e-api.md)

For contributors and AI assistants that need to extend the app or the receiver.

## Architecture

```
Phone browser (PWA, docs/)  <--HTTP + WebSocket-->  receiver/bridge.py (aiohttp)  <--TLS 6466/6467-->  Android TV
```

- `bridge.py` uses [`androidtvremote2`](https://github.com/tronikos/androidtvremote2) for the TV side.
- One `Tv` object per TV IP (class `Tv`): it keeps the connection alive (`supervise()`), handles pairing, scenes, sleep timer, volume.
- It serves `docs/` as static files, so the app and the WebSocket share one origin (no CORS, no mixed content).
- Middleware `lan_only` rejects any client that is not on a private or loopback address. `no_cache` sets `Cache-Control: no-store`.
- Default bind is `127.0.0.1`. `--lan` binds `0.0.0.0`.

## WebSocket `/ws?host=<TV_IP>`

The app opens one socket per TV. The first server message is a `state`.

### Client to server

| Message | Meaning |
|---|---|
| `{"type":"key","key":"DPAD_UP"}` | Press a key. Any Android `KeyEvent` name works: `DPAD_UP/DOWN/LEFT/RIGHT/CENTER`, `HOME`, `BACK`, `MENU`, `POWER`, `VOLUME_UP/DOWN`, `MUTE`, `MEDIA_PLAY_PAUSE`, `0`..`9`, `CHANNEL_UP/DOWN`... `EXIT` is aliased to `ESCAPE`. |
| `{"type":"text","text":"hello"}` | Type text into the focused field on the TV |
| `{"type":"launch","package":"com.netflix.ninja"}` | Launch an app by package name (or deep link) |
| `{"type":"pair","code":"A1B2C3"}` | Finish pairing with the code shown on the TV |
| `{"type":"set_enabled","enabled":true}` | Connect / disconnect this TV ("Collegata" switch) |
| `{"type":"wake"}` | Wake the TV (Wake-on-LAN, then power key) |
| `{"type":"scene","id":"cinema"}` | Run a scene |
| `{"type":"sleep_timer","minutes":30}` | Sleep timer (0 cancels, max 360) |
| `{"type":"set_volume","level":25}` | Step the volume to a level |

### Server to client

`{"type":"state", ...}` with, among others: `connected`, `needs_pairing`, `enabled`, `current_app`, `volume`, `sleep_at`, `error`.
`error` is a **code** the app translates: `unreachable`, `wrong_code`, `pairing_expired` (keys `err.*` in `docs/lang/*.js`).
`{"type":"error","message":"..."}` on a bad request.

## HTTP endpoints

| Endpoint | Description |
|---|---|
| `GET /` | The app |
| `GET /connect` | Page with the receiver address and a QR code |
| `GET /api/discover` | Scan the local `/24` for TVs. Returns brand, kind, `supported` |
| `GET /api/info?host=IP` | Everything the TV exposes on the network (ports, device info) |
| `GET /api/scenes` / `PUT /api/scenes` | Read / save scenes (`receiver/bridge-data/scenes.json`) |
| `GET /api/shortcut?host=IP&action=...&value=...` | For Siri / iOS Shortcuts |

`/api/shortcut` actions: `wake`, `power_off`, `scene` (`value` = scene id), `volume` (`value` = 0-100), `sleep` (`value` = minutes), `app` (`value` = package), and the key shortcuts `mute`, `volume_up`, `volume_down`, `home`, `back`, `play_pause`. It answers `{"ok":true,"message":"..."}`.

## Scene format

```json
{"id":"cinema","name":"Cinema","icon":"film","color":"red","app":"com.netflix.ninja","volume":30,"timer":0}
```

Colors: `red, orange, green, teal, indigo, pink`. `volume: -1` means "do not change". `timer` is in minutes (0 = none).

## Discovery

`FINGERPRINTS` in `bridge.py` maps open ports to platforms: 6466 Android TV (supported), 8060 Roku, 8002 Samsung, 3001 LG (recognised, not supported).

## Adding a new TV platform

1. Write a class with the same surface as `Tv` (connect, `handle(msg)`, `state()`, `wake()`, `set_enabled`, `run_scene`...).
2. Make `get_tv(host)` choose it from the discovery fingerprint.
3. Flip `supported` to `True` for that platform in `FINGERPRINTS`.
4. Document it in [03-compatible-tvs.md](03-compatible-tvs.md).

## Frontend notes

- Plain JS in `docs/app.js`, no build step. State lives in `localStorage` (TV list, favorites, scenes cache, recent apps, one-handed mode, receiver address, `lang`).
- Translations: `docs/i18n.js` + `docs/lang/<code>.js`. HTML uses `data-i18n`, `data-i18n-html`, `data-i18n-aria`, `data-i18n-ph`; JS uses `tr(key, vars)` and `trn(key, n, vars)` (plural keys `key.one` / `key.other`). The language is chosen in Settings and stored in `localStorage.lang` (empty = follow the phone).
- `bridgeUrl()` returns the receiver WebSocket URL derived from `location`. On `*.github.io` it returns empty and the app runs in demo mode.
- The service worker (`docs/service-worker.js`, cache `glassremote-vX`) only registers on `http(s)` and only works in secure contexts.
- Debug URL parameters: `?s=tv|remote|apps|settings&m=dpad|touch|numbers|keyboard&f=fav|all&on=1&d=1`.
