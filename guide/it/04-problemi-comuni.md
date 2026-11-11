# 4. Problemi comuni

> English: [../04-troubleshooting.md](../04-troubleshooting.md)

## Il telefono non apre l'indirizzo del ricevitore

- Stesso Wi-Fi? Telefono e computer devono stare nella **stessa rete**. Dati mobili spenti, VPN spenta.
- Ricevitore avviato **con `--lan`**? Senza, si connette solo il computer stesso.
- **Firewall / profilo di rete di Windows:** imposta il Wi-Fi su **Privata** (Impostazioni, Rete, Wi-Fi, *Tipo di profilo di rete*). Con un profilo Pubblico Windows blocca le connessioni in entrata. Consenti Python sulle reti private quando richiesto.
- **Isolamento dei client:** il Wi-Fi ospiti e alcuni router impediscono ai dispositivi di vedersi. Usa la rete principale o disattiva *AP / client isolation*.
- Prova `http://<IP-del-computer>:8780/connect` dal computer per vedere l'IP corretto e un QR code.
- Porta 8780 usata da altro? Avvia con `--port 8790` e usa il nuovo indirizzo.

## L'app si apre ma dice "Nessun ricevitore collegato"

- Probabilmente hai aperto la **demo su GitHub Pages**. Pages è HTTPS e non può raggiungere il tuo ricevitore (i browser bloccano le pagine HTTPS che chiamano dispositivi HTTP locali). Apri invece l'app da `http://<IP-del-computer>:8780/`.
- Controlla **Impostazioni, Avanzate, Indirizzo del ricevitore**: lascialo vuoto quando apri l'app dal ricevitore.
- La finestra del ricevitore è ancora aperta?

## Nessuna TV trovata

- La TV è accesa e nella stessa rete (Wi-Fi o Ethernet).
- La ricerca scansiona la sottorete `/24` locale del ricevitore (per esempio `192.168.1.0-255`). Se la TV è in un'altra sottorete, aggiungila a mano con **+** e il suo IP.
- Android TV Remote usa la porta **6466**. Prova dal computer: `Test-NetConnection <IP-TV> -Port 6466` (PowerShell su Windows) oppure `nc -vz <IP-TV> 6466` (macOS / Linux).
- Una TV Samsung, LG o Roku viene riconosciuta ma segnata "non ancora supportata": vedi [03-tv-compatibili.md](03-tv-compatibili.md).

## L'abbinamento fallisce o il codice non compare

- Controlla che nessun altro dispositivo stia abbinando la TV in quel momento.
- Scrivi il codice in **maiuscolo**, esattamente come appare (6 caratteri, lettere A-F e cifre).
- Elimina `receiver/bridge-data/`, riavvia il ricevitore e abbina di nuovo.
- Sulla TV, se hai abbinato molti telecomandi, rimuovi i vecchi in *Impostazioni, Telecomandi e accessori*.

## I comandi hanno ritardo o smettono di funzionare dopo un po'

- La TV può essere andata in standby profondo. Tocca il tasto di accensione nell'app oppure accendila una volta con il telecomando vero.
- Il risparmio energetico del Wi-Fi sulla TV o sul router può ritardare i pacchetti. Meglio Ethernet sulla TV, oppure attiva *Wi-Fi sempre attivo* / *Standby di rete*.
- Riavvia il ricevitore. Controlla che ce ne sia una sola copia in esecuzione.

## La TV non si accende dallo standby

Non tutte le TV lo supportano. Attiva *Wake on LAN / Wake on Wi-Fi / Standby di rete* nelle impostazioni della TV. Altrimenti accendila una volta con il suo telecomando, poi usa l'app.

## L'app sembra vecchia dopo un aggiornamento

Chiudila e riaprila. Se persiste, elimina l'icona dalla Home e aggiungila di nuovo. Lato sviluppo: aumenta `VERSION` in `docs/service-worker.js` e `?v=N` in `docs/index.html`.

## Specifiche per iPhone

- La vibrazione non funziona nelle web app dell'iPhone (limite di iOS).
- Su HTTP semplice Safari non registra il service worker per l'uso offline. L'app si apre comunque; la cache offline vale solo su HTTPS.
- La dettatura usa il microfono della tastiera di iOS, non è una funzione di GlassRemote.

## Siri / Comandi Rapidi non fa nulla

- Il comando deve usare **Ottieni contenuti dell'URL** con l'indirizzo completo mostrato in Impostazioni.
- Funziona solo sul tuo Wi-Fi di casa e con il ricevitore acceso.

## Ancora bloccato?

Apri una issue indicando: modello e sistema del telefono, sistema del computer, marchio/modello della TV, cosa stampa la finestra del ricevitore e cosa vedi nell'app. **Rimuovi indirizzi IP e dati personali da screenshot e log** prima di pubblicarli.
