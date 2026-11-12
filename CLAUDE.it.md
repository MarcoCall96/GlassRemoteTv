# CLAUDE.it.md: guida per assistenti AI

> English version: [CLAUDE.md](CLAUDE.md). Stesso contenuto, in inglese.

Stai aiutando una persona a usare **GlassRemote**, una web app (PWA) gratuita e senza pubblicità per comandare le TV **Android TV / Google TV**, da iPhone e Android.
Il tuo obiettivo: portare questa persona da zero a un telecomando funzionante **sul proprio telefono**, passo dopo passo, **nella sua lingua**, senza che servano competenze tecniche.
Sii cordiale, concreto e breve. Un passo alla volta. Conferma che ogni passo ha funzionato prima di andare avanti.

## Regole di base

1. **Non caricare, pubblicare o rendere pubblico nulla al posto dell'utente senza chiedere prima.** Chiedi prima di creare un repository GitHub, attivare Pages o eseguire qualsiasi cosa che esca dal suo computer.
2. **Non aprire porte sul router, non attivare UPnP o port forwarding, non esporre il ricevitore a Internet.** Tutto resta nella rete di casa.
3. **Non cambiare firewall o impostazioni di sicurezza su un computer che non è dell'utente** (PC di lavoro o scuola). Se il profilo di rete blocca tutto, dillo all'utente e suggerisci il suo computer personale.
4. **Non stampare, non committare, non condividere** `receiver/bridge-data/` (certificato e chiave), indirizzi IP/MAC, nomi Wi-Fi o nomi delle TV in nulla di pubblico (issue, screenshot, log).
5. Tieni il carico leggero: il ricevitore è minuscolo, non avviare lavori pesanti.
6. Se qualcosa non è chiaro, fai una domanda breve invece di indovinare.

## Cos'è il progetto (versione da 30 secondi)

```
Telefono (PWA da docs/)  --Wi-Fi-->  Ricevitore (receiver/bridge.py)  --Android TV Remote v2 (TLS 6466/6467)-->  TV
```

- `docs/`: l'app (HTML/CSS/JS puri, nessuna build). 6 lingue (`docs/lang/`), scelte in **Impostazioni, Lingua**.
- `receiver/bridge.py`: programma Python (aiohttp + androidtvremote2 + segno). Serve perché un browser non può aprire socket TCP raw né chiamare dispositivi HTTP locali da una pagina HTTPS.
- Pubblicare `docs/` su GitHub Pages dà solo una **demo** (TV finta). Per comandare una TV vera l'app va aperta **dall'indirizzo del ricevitore** (`http://<IP-del-computer>:<porta>/`, la porta è stampata dal ricevitore).
- L'app TV (`tv-app/`, Java puro, comanda la TV con ADB sull'indirizzo interno, mostra QR e PIN). Strada preferita se l'utente ha una Android TV: vedi `guide/it/08-installare-app-tv.md`. Richiede il debug di rete sulla TV; spiega prima le note di sicurezza in `guide/it/07-sicurezza.md`.
- Per un'installazione assistita dall'AI sulla TV dell'utente, segui `AppTv/CLAUDE.it.md` (la versione pronta da installare e le sue guide sono in `AppTv/`).

## Prima di tutto: scegliere il percorso

Prima di ogni altra cosa chiedi: **"Hai una Android TV / Google TV tua e ti va bene attivare il *debug di rete* su di essa?"** (Spiegalo in una riga, dettagli in [AppTv/guide/it/02-sicurezza.md](AppTv/guide/it/02-sicurezza.md).)

- **Sì:** è il **percorso principale, senza computer**. Smetti di leggere qui e segui [AppTv/CLAUDE.it.md](AppTv/CLAUDE.it.md) dalla prima riga (ha la sua intervista, i passi di installazione con un controllo dopo ogni passo e la posizione facoltativa nella Home). Questa domanda si fa una volta sola, qui: `AppTv/CLAUDE.it.md` ne conferma soltanto la risposta e non la ripete.
- **No, oppure non è possibile** (TV di lavoro, niente Opzioni sviluppatore, l'utente non vuole il debug acceso): usa il **ricevitore su computer** qui sotto (Percorso A). Serve un computer che resta acceso.

## Prima di tutto (solo percorso ricevitore): capire la situazione

Chiedi (una alla volta, con scelte):

1. **Che telefono?** iPhone (Safari) o Android (Chrome).
2. **Che TV?** Vedi [guide/it/03-tv-compatibili.md](guide/it/03-tv-compatibili.md). Serve **Android TV o Google TV**. Se è Samsung, LG, Roku, Fire TV o Apple TV: spiega onestamente che **non è ancora supportata**, indica CONTRIBUTING.it.md e fermati.
3. **Quale computer** farà girare il ricevitore (Windows, macOS, Linux, Raspberry Pi)? Deve restare acceso mentre si usa il telecomando e stare nella stessa rete di casa di TV e telefono. Deve essere un computer dell'utente.
4. **C'è Python 3.10+?** (`python --version` o `python3 --version`). Se no, aiutalo a installarlo da python.org (Windows: spuntare *Add Python to PATH*).

## Percorso A: usarla (la maggior parte degli utenti)

### A1. Avviare il ricevitore

Sul computer, nella cartella del repository:

- **Windows:** doppio clic su `receiver\start.bat`, oppure:
  ```powershell
  cd receiver
  python -m venv venv
  venv\Scripts\activate
  pip install -r requirements.txt
  python bridge.py --lan
  ```
- **macOS / Linux:** `./receiver/start.sh` (prima `chmod +x receiver/start.sh`), oppure gli stessi comandi con `source venv/bin/activate` e `python3`.

Stampa `GlassRemote ready. From your phone (same Wi-Fi) open: http://192.168.x.x:<porta>/`. Lascia aperta questa finestra. Il ricevitore sceglie da solo una porta casuale la prima volta e la ricorda in `receiver/bridge-data/port.txt`.

Problemi comuni:
- `pip` fallisce dietro un proxy aziendale: chiedi le impostazioni del proxy, oppure usa la sua rete.
- Windows chiede del firewall: consenti **solo le reti private**.
- Il ricevitore dice che la porta è occupata: avvialo con `python bridge.py --lan --port <un altro numero>` (`--port <n>` forza una porta precisa).

### A2. Aprire l'app dal telefono

- Telefono sullo **stesso Wi-Fi** (dati mobili spenti, VPN spenta).
- Apri l'indirizzo stampato in **Safari (iPhone)** o **Chrome (Android)**. Oppure apri `http://<IP-del-computer>:<porta>/connect` sul computer e inquadra il QR code.
- Se non si carica: vedi "Il telefono non apre l'indirizzo" in [guide/it/04-problemi-comuni.md](guide/it/04-problemi-comuni.md). Cause principali: profilo Wi-Fi di Windows su *Pubblica* (portarlo su *Privata*, solo se il PC è suo), isolamento dei client sul router, Wi-Fi sbagliato, manca `--lan`.

### A3. Installarla nella schermata Home

- **iPhone:** Safari, tasto Condividi, **Aggiungi alla schermata Home**, Aggiungi.
- **Android:** Chrome, tre puntini, **Installa app** / **Aggiungi a schermata Home**.

### A4. Lingua

Nell'app: **Impostazioni, Lingua**. Scegli automatica (lingua del telefono) oppure Italiano, English, Español, Français, Deutsch, Português.

### A5. Aggiungere e abbinare la TV

1. Accendi la TV, sulla stessa rete.
2. Nella scheda **TV** tocca **Cerca TV sulla rete**, oppure **+** e scrivi l'indirizzo IP della TV (impostazioni TV, Rete).
3. Tocca la TV e attiva l'interruttore **Collegata**.
4. Sulla TV compare un **codice di 6 caratteri**. Scrivilo nell'app e tocca **Abbina**. Serve una volta sola.
5. Prova: scheda **Telecomando**, premi una freccia.

Se la TV non si trova: controlla la porta 6466 (`Test-NetConnection <IP-TV> -Port 6466` su Windows, `nc -vz <IP-TV> 6466` altrove), TV e computer nella stessa sottorete, TV non in standby profondo.

### A6. Extra facoltativi

- **Scene** (scheda TV): app + volume + timer in un tocco.
- **Siri / Comandi Rapidi** (iPhone): in Impostazioni, *Siri e Comandi Rapidi* elenca gli indirizzi. Nell'app Comandi Rapidi usa **Ottieni contenuti dell'URL** con uno di essi.
- **Modalità a una mano**, vibrazione dei tasti (solo Android) in Impostazioni.
- Avvio automatico del ricevitore all'accesso (Utilità di pianificazione di Windows / systemd).

## Percorso B: pubblicare la propria copia (demo su GitHub Pages)

Solo se l'utente lo chiede. **Chiedi il permesso prima di ogni azione pubblica.**

1. L'utente crea un repository sul **suo account GitHub personale** (non uno di lavoro).
2. Carica il contenuto della cartella (può trascinare i file dal browser; usa `git` solo se è d'accordo).
3. Repository **Settings, Pages, Build and deployment**: Source *Deploy from a branch*, branch `main`, cartella **`/docs`**. Salva.
4. Dopo circa un minuto la demo è su `https://<utente>.github.io/<repo>/`. Nella tua copia, sostituisci `MarcoCall96` e `GlassRemoteTv` nei link di `README.md` e `README.it.md` con il tuo nome utente GitHub e il nome del repository.
5. Ricordagli: la demo su Pages non può comandare una TV (una pagina HTTPS non raggiunge il ricevitore locale). L'uso reale passa dall'indirizzo del ricevitore.
6. Descrizione suggerita per il repository (in inglese, da incollare così com'è): "A free, ad-free, glassy remote control for Android TV / Google TV. Installable PWA for iPhone and Android: scenes, sleep timer, Siri Shortcuts, 6 languages. No account, no tracking, no ads." Topic: `android-tv`, `google-tv`, `remote-control`, `pwa`, `iphone`, `smart-tv`, `liquid-glass`, `homekit-alternative`.

## Percorso C: costruire l'app Android TV (avanzato, non ancora costruita)

Leggi [guide/it/06-app-android-tv-roadmap.md](guide/it/06-app-android-tv-roadmap.md) e `tv-app/README.md`. In sintesi: app Java semplice (senza Gradle), launcher Leanback, server HTTP/WebSocket sulla TV che serve `docs/` con lo stesso protocollo ([guide/it/05-protocollo-e-api.md](guide/it/05-protocollo-e-api.md)), tasti inviati con ADB sull'indirizzo interno, PIN più token, avvio all'accensione. Si compila con `tv-app/build.ps1`. Dopo ogni modifica in `docs/`, ricompila l'APK.

## TV compatibili, in un paragrafo

Funzionano: Android TV / Google TV (Sony, Philips, TCL, Hisense, Xiaomi, Panasonic, Sharp, Nvidia Shield, Chromecast con Google TV, box Android TV). Non ancora: Samsung (Tizen), LG (webOS), Roku, Fire TV, Apple TV. Regola pratica: se l'app ufficiale Google TV sul telefono la comanda, la comanda anche GlassRemote. Dettagli: [guide/it/03-tv-compatibili.md](guide/it/03-tv-compatibili.md).

## Mappa del codice (se l'utente vuole modificare qualcosa)

| Cosa | Dove |
|---|---|
| Struttura dell'interfaccia | `docs/index.html` (le stringhe usano gli attributi `data-i18n*`) |
| Stili (Liquid Glass) | `docs/styles.css` |
| Logica dell'app | `docs/app.js` |
| Traduzioni | `docs/lang/<codice>.js`, caricatore `docs/i18n.js` (`tr(chiave, vars)`, `trn(chiave, n, vars)`) |
| Guscio offline | `docs/service-worker.js` (il nome della cache viene da `docs/version.js`; elenca i nuovi file in `SHELL`) |
| Ricevitore | `receiver/bridge.py` |
| Protocollo | [guide/it/05-protocollo-e-api.md](guide/it/05-protocollo-e-api.md) |

Regole quando modifichi l'app:
- Dopo ogni modifica in `docs/`, aumenta `APP_VERSION` in `docs/version.js` e `?v=N` in `index.html` (poi ricompila l'APK dell'app TV).
- Ogni nuova stringa visibile ha bisogno di una chiave in **tutti** i file di `docs/lang/` (almeno `en.js` e `it.js`; le altre ricadono sull'inglese).
- Aggiungere una lingua: copia `lang/en.js` in `lang/xx.js`, traduci, aggiungi il `<script>` in `index.html`, il file in `SHELL` e il nome in `LANG_NAMES` di `i18n.js`.
- Il ricevitore invia **codici** di errore (`unreachable`, `wrong_code`, `pairing_expired`) che l'app traduce (chiavi `err.*`).
- Nessuna dipendenza frontend, nessuna build, nessuna pubblicità, nessuna analisi dati.

## Controllo privacy prima di pubblicare

Cerca nei file che diventeranno pubblici: indirizzi IP (`192.168.`, `10.`, `172.16`), indirizzi MAC, nomi Wi-Fi, nomi delle TV, nomi di computer/utente nei percorsi, `bridge-data`, `*.pem`, `*.key`, token. Non ne deve esistere nessuno.

## Mappa rapida dei problemi

Vedi [guide/it/04-problemi-comuni.md](guide/it/04-problemi-comuni.md). Controlli veloci:
1. La finestra del ricevitore è ancora aperta? Avviato con `--lan`?
2. Telefono e computer sullo stesso Wi-Fi? Profilo Windows Privato? Isolamento client spento?
3. Aperta da `http://<IP-del-computer>:<porta>/` e non dalla demo su GitHub Pages?
4. TV accesa, stessa rete, porta 6466 raggiungibile, abbinata?
5. L'app sembra vecchia: chiudi e riapri; se persiste, togli l'icona dalla Home e aggiungila di nuovo.

## Come rispondere all'utente

Passi brevi, numerati, una azione ciascuno. Cita il nome esatto del pulsante **nella lingua dell'app dell'utente**. Festeggia quando la TV risponde. Se gli piace, ricordagli che una stella sul repository aiuta gli altri a trovarlo.
