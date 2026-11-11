# 6. Roadmap: l'app Android TV (senza computer)

> English: [../06-android-tv-app-roadmap.md](../06-android-tv-app-roadmap.md)

## L'idea

Oggi serve un computer che esegue il ricevitore. L'obiettivo è **mettere il ricevitore dentro la TV**: una piccola app Android TV che

1. esegue sulla TV un piccolo server HTTP + WebSocket (per esempio `http://<IP-TV>:8780`) e serve la stessa PWA di `docs/`;
2. parla con il **servizio Android TV Remote** della TV stessa (oppure con il sistema tramite un servizio di accessibilità);
3. parte da sola all'accensione della TV, così il telefono funziona sempre senza computer.

Il telefono apre `http://<IP-TV>:8780`, tocca *Aggiungi alla schermata Home* e la configurazione finisce qui.

**Stato: non ancora costruita. I contributi sono benvenuti.** Il ricevitore Python è l'implementazione di riferimento: porta lo stesso comportamento.

## Cosa serve all'app

| Parte | Approccio suggerito |
|---|---|
| Linguaggio / strumenti | Kotlin, Android Studio (o JDK 17 + Android SDK 34 da riga di comando), `minSdk 23`, un'attività launcher Leanback perché compaia sulla TV |
| Server HTTP + WebSocket | [Ktor](https://ktor.io/) (motore CIO) oppure NanoHTTPD + NanoWSD |
| Servire la PWA | Includi `docs/` negli `assets/` dell'APK e servilo |
| Invio dei tasti | Opzione A: connessione a `127.0.0.1:6466` con il protocollo Android TV Remote v2 (un port Kotlin di `androidtvremote2`). Opzione B: un **AccessibilityService** che invia eventi tasto. Opzione C: `InputManager` con permesso privilegiato (non disponibile alle app normali) |
| Aprire le app | `PackageManager.getLaunchIntentForPackage(...)` oppure `getLeanbackLaunchIntentForPackage(...)`; il messaggio `launch` porta già il nome del pacchetto |
| Abbinamento | Con l'opzione A si può evitare l'abbinamento verso localhost essendo la TV stessa |
| Avvio all'accensione | Receiver `RECEIVE_BOOT_COMPLETED` + servizio in primo piano con notifica |
| Sicurezza | Ascolta solo sulla LAN, rifiuta i client non privati (stessa regola `lan_only`), niente port forwarding, PIN facoltativo |
| Riaccensione dallo standby | La rete della TV deve poterla svegliare; dal browser non si può inviare Wake-on-LAN, quindi per l'accensione può servire ancora un Comando Rapido o il ricevitore |

## Come installare un APK su una TV (per chi prova)

1. Costruisci l'APK (`./gradlew assembleDebug`).
2. Sulla TV attiva le *Opzioni sviluppatore* (Impostazioni, Info, tocca *Build* sette volte), poi *Debug USB* o *Debug di rete* (alcune TV lo chiamano *Debug ADB*).
3. Da un computer: `adb connect <IP-TV>:5555` poi `adb install app-debug.apk`.
4. Oppure copia l'APK su una chiavetta USB e aprilo con un file manager per TV; consenti *Installa app sconosciute*.

## Lista di controllo

- [ ] L'app TV parte all'accensione e mostra una volta il suo indirizzo a schermo
- [ ] La stessa PWA di `docs/` funziona senza modifiche (stesso protocollo WebSocket, vedi [05-protocollo-e-api.md](05-protocollo-e-api.md))
- [ ] Tasti, testo, apertura app, scene, timer di spegnimento e volume funzionano
- [ ] Rifiuta i client fuori dalla LAN
- [ ] Niente pubblicità, niente analisi dati, niente account
- [ ] Sezione nel README e un APK firmato in release

Se inizi a lavorarci, apri una issue intitolata "Android TV app" per coordinarci.
