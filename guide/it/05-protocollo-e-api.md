# 5. Protocollo e API

> English: [../05-protocol-and-api.md](../05-protocol-and-api.md)

Per chi contribuisce e per gli assistenti AI che devono estendere l'app o il ricevitore.

## Architettura

```
Browser del telefono (PWA, docs/)  <--HTTP + WebSocket-->  receiver/bridge.py (aiohttp)  <--TLS 6466/6467-->  Android TV
```

- `bridge.py` usa [`androidtvremote2`](https://github.com/tronikos/androidtvremote2) per il lato TV.
- Un oggetto `Tv` per ogni IP di TV (classe `Tv`): mantiene viva la connessione (`supervise()`), gestisce abbinamento, scene, timer di spegnimento e volume.
- Serve `docs/` come file statici, così app e WebSocket condividono la stessa origine (niente CORS, niente contenuti misti).
- Il middleware `lan_only` rifiuta i client che non hanno un indirizzo privato o di loopback. `no_cache` imposta `Cache-Control: no-store`.
- Per default ascolta su `127.0.0.1`. `--lan` ascolta su `0.0.0.0`.

## WebSocket `/ws?host=<IP_TV>`

L'app apre un socket per ogni TV. Il primo messaggio del server è uno `state`.

### Dal client al server

| Messaggio | Significato |
|---|---|
| `{"type":"key","key":"DPAD_UP"}` | Preme un tasto. Funziona qualsiasi nome di `KeyEvent` Android: `DPAD_UP/DOWN/LEFT/RIGHT/CENTER`, `HOME`, `BACK`, `MENU`, `POWER`, `VOLUME_UP/DOWN`, `MUTE`, `MEDIA_PLAY_PAUSE`, `0`..`9`, `CHANNEL_UP/DOWN`... `EXIT` è un alias di `ESCAPE`. |
| `{"type":"text","text":"ciao"}` | Scrive testo nel campo attivo sulla TV |
| `{"type":"launch","package":"com.netflix.ninja"}` | Apre un'app dal nome del pacchetto (o deep link) |
| `{"type":"pair","code":"A1B2C3"}` | Completa l'abbinamento con il codice mostrato dalla TV |
| `{"type":"set_enabled","enabled":true}` | Collega / scollega questa TV (interruttore "Collegata") |
| `{"type":"wake"}` | Riaccende la TV (Wake-on-LAN, poi tasto accensione) |
| `{"type":"scene","id":"cinema"}` | Avvia una scena |
| `{"type":"sleep_timer","minutes":30}` | Timer di spegnimento (0 annulla, massimo 360) |
| `{"type":"set_volume","level":25}` | Porta il volume a un livello, a passi |

### Dal server al client

`{"type":"state", ...}` con, tra gli altri: `connected`, `needs_pairing`, `enabled`, `current_app`, `volume`, `sleep_at`, `error`.
`error` è un **codice** che l'app traduce: `unreachable`, `wrong_code`, `pairing_expired` (chiavi `err.*` in `docs/lang/*.js`).
`{"type":"error","message":"..."}` per una richiesta errata.

## Endpoint HTTP

| Endpoint | Descrizione |
|---|---|
| `GET /` | L'app |
| `GET /connect` | Pagina con l'indirizzo del ricevitore e un QR code |
| `GET /api/discover` | Scansiona la `/24` locale in cerca di TV. Restituisce marchio, tipo, `supported` |
| `GET /api/info?host=IP` | Tutto ciò che la TV espone in rete (porte, dati del dispositivo) |
| `GET /api/scenes` / `PUT /api/scenes` | Legge / salva le scene (`receiver/bridge-data/scenes.json`) |
| `GET /api/shortcut?host=IP&action=...&value=...` | Per Siri / Comandi Rapidi di iOS |

Azioni di `/api/shortcut`: `wake`, `power_off`, `scene` (`value` = id della scena), `volume` (`value` = 0-100), `sleep` (`value` = minuti), `app` (`value` = pacchetto), più i tasti `mute`, `volume_up`, `volume_down`, `home`, `back`, `play_pause`. Risponde `{"ok":true,"message":"..."}`.

## PIN (solo app TV)

L'app TV (`tv-app/`) protegge i comandi con un PIN. Il ricevitore su computer non lo usa, quindi un client deve funzionare con o senza.

- Alla connessione senza un token valido il server invia `{"type":"auth_required"}` e ignora ogni messaggio tranne `auth`.
- Client: `{"type":"auth","pin":"123456"}` oppure `{"type":"auth","token":"..."}`. Risposte: `{"type":"auth_ok","token":"..."}` (poi un messaggio `state`) oppure `{"type":"auth_error","code":"bad_pin"|"pin_locked"}`.
- Un token già noto si può passare anche come `/ws?host=IP&token=...`.
- HTTP: `/api/shortcut`, `/api/info` e `PUT /api/scenes` richiedono il token nell'header `x-gr-token` o nel parametro `token`. Senza rispondono `401`.
- Il blocco del PIN è per indirizzo del client: 5 tentativi sbagliati bloccano quell'indirizzo per 1 minuto, raddoppiando a ogni giro fino a 15 minuti. Dopo 30 tentativi sbagliati in totale l'app TV sceglie da sola un PIN NUOVO (lo schermo della TV e il codice QR si aggiornano).
- Il codice QR sulla TV apre `http://<ip-tv>:<porta>/#pin=123456`. L'app legge il frammento (accetta ancora anche la vecchia forma `?pin=`), lo toglie dall'indirizzo e fa l'accesso.

## Formato di una scena

```json
{"id":"cinema","name":"Cinema","icon":"film","color":"red","app":"com.netflix.ninja","volume":30,"timer":0}
```

Colori: `red, orange, green, teal, indigo, pink`. `volume: -1` significa "non cambiare". `timer` è in minuti (0 = nessuno).

## Ricerca delle TV

`FINGERPRINTS` in `bridge.py` associa le porte aperte alle piattaforme: 6466 Android TV (supportata), 8060 Roku, 8002 Samsung, 3001 LG (riconosciute, non supportate).

## Aggiungere una nuova piattaforma di TV

1. Scrivi una classe con la stessa interfaccia di `Tv` (connessione, `handle(msg)`, `state()`, `wake()`, `set_enabled`, `run_scene`...).
2. Fai scegliere la classe a `get_tv(host)` in base all'impronta rilevata.
3. Imposta `supported` a `True` per quella piattaforma in `FINGERPRINTS`.
4. Documentala in [03-tv-compatibili.md](03-tv-compatibili.md).

## Note sul frontend

- JavaScript puro in `docs/app.js`, nessuna build. Lo stato è in `localStorage` (elenco TV, preferite, scene in cache, app recenti, modalità a una mano, indirizzo del ricevitore, `lang`).
- Traduzioni: `docs/i18n.js` + `docs/lang/<codice>.js`. L'HTML usa `data-i18n`, `data-i18n-html`, `data-i18n-aria`, `data-i18n-ph`; il JS usa `tr(chiave, vars)` e `trn(chiave, n, vars)` (chiavi plurali `chiave.one` / `chiave.other`). La lingua si sceglie in Impostazioni ed è salvata in `localStorage.lang` (vuoto = segue il telefono).
- `bridgeUrl()` ricava dall'indirizzo della pagina l'URL WebSocket del ricevitore. Su `*.github.io` restituisce vuoto e l'app funziona in modalità demo.
- Il service worker (`docs/service-worker.js`, cache `glassremote-vX`) si registra solo su `http(s)` e funziona solo in contesti sicuri.
- Parametri di debug nell'URL: `?s=tv|remote|apps|settings&m=dpad|touch|numbers|keyboard&f=fav|all&on=1&d=1`.
