# Contribuire

> English: [CONTRIBUTING.md](CONTRIBUTING.md)

GlassRemote è piccolo di proposito: HTML/CSS/JS puri per l'app, un solo file Python per il ricevitore.

## Buone prime attività

1. **Aggiungere una lingua.** L'app ne ha 6 (Italiano, English, Español, Français, Deutsch, Português). Copia `docs/lang/en.js` in `docs/lang/xx.js`, traduci i valori, aggiungi il `<script>` in `docs/index.html`, il file in `SHELL` in `docs/service-worker.js` e il nome in `LANG_NAMES` in `docs/i18n.js`. Anche rivedere le traduzioni esistenti è molto gradito.
2. **Prova sulla tua TV.** Apri una issue con marchio, modello, versione di Android TV e cosa ha funzionato (riaccensione dallo standby, volume, apertura app, tastiera).
3. **App TV** (Java): vedi [tv-app/README.md](tv-app/README.md) e [guide/it/06-app-android-tv-roadmap.md](guide/it/06-app-android-tv-roadmap.md).
4. **Altri marchi:** Samsung (API WebSocket Tizen), LG (webOS SSAP), Roku (ECP), Fire TV (ADB). Il ricevitore parla con le TV tramite la classe `Tv` in `receiver/bridge.py`: aggiungi una classe per ogni protocollo.
5. **Screenshot / GIF di demo** per il README.

## Sviluppo

```bash
cd receiver
python -m venv venv && venv/bin/pip install -r requirements.txt   # Windows: venv\Scripts\...
python bridge.py            # solo localhost, http://localhost:<porta>/ (la porta viene stampata)
```

Anteprima dell'interfaccia senza TV: `cd docs && python -m http.server 8000`, poi apri `http://localhost:8000/` (compare una TV di prova).

Parametri di debug nell'URL dell'app: `?s=tv|remote|apps|settings`, `&m=dpad|touch|numbers|keyboard`, `&f=fav|all`, `&on=1`, `&d=1`.

## Regole

- **Mai dati personali nei commit**: indirizzi IP, MAC, nomi Wi-Fi, nomi delle TV, chiavi, certificati, screenshot che li mostrano.
- Dopo aver modificato un file in `docs/`, aumenta `APP_VERSION` in `docs/version.js` e il `?v=N` in `docs/index.html`, così i telefoni ricaricano la nuova versione. Poi ricompila l'APK dell'app TV.
- Ogni nuova stringa visibile ha bisogno di una chiave nei file lingua (`docs/lang/`): almeno `en.js` e `it.js`.
- Nessuna dipendenza frontend, nessuna build.
- L'app deve restare usabile con una mano, senza pubblicità e senza tracciamento. Sono il prodotto.

## Pull request

Piccole e mirate. Scrivi cosa hai provato (telefono, modello di TV). Gli screenshot sono graditi per le modifiche all'interfaccia.
