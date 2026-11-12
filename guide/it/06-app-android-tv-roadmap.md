# 6. L'app Android TV: come funziona e cosa manca

> English: [../06-android-tv-app-roadmap.md](../06-android-tv-app-roadmap.md)

L'app TV (`tv-app/`) è stata costruita. Questa pagina spiega come è fatta ed elenca le idee aperte per chi vuole contribuire. Per installarla vedi [08-installare-app-tv.md](08-installare-app-tv.md).

## Cosa fa

1. Esegue sulla TV un piccolo server HTTP e WebSocket (la porta è casuale e compare sullo schermo della TV) che serve `docs/` e parla lo **stesso protocollo** di `receiver/bridge.py` ([05-protocollo-e-api.md](05-protocollo-e-api.md)).
2. Preme i tasti della TV tramite **ADB sull'indirizzo interno della TV** (debug di rete acceso).
3. Mostra sullo schermo un codice QR, l'indirizzo e un PIN, e chiede il PIN una volta a ogni telefono.
4. Parte da sola all'accensione della TV.

## Scelte di progetto

| Tema | Scelta |
|---|---|
| Linguaggio / strumenti | Java 8 semplice, senza Gradle e senza librerie. `build.ps1` usa `aapt2`, `javac`, `d8`, `zipalign` e `apksigner`. `minSdk 21`, `targetSdk 29`, un launcher Leanback perché compaia tra le app della TV |
| Invio dei tasti | `input keyevent`, `input text`, `monkey` e `am start` tramite una shell ADB. Il servizio ufficiale Android TV Remote (porta 6466) è stato provato per primo, ma la TV chiude le connessioni che arrivano dalla TV stessa, quindi non può funzionare sul dispositivo |
| Client ADB | `Adb.java` è un client ADB minimale (CNXN, AUTH con la chiave RSA dell'app, flussi shell). La chiave nasce al primo avvio e resta nella memoria privata dell'app |
| Stato | Letto con `dumpsys window`, `dumpsys power` e `media volume`, poi inviato ai telefoni via WebSocket |
| Volume | Volume assoluto con `media volume --stream 3 --set N` (da 0 a 100) |
| Sicurezza | Solo rete locale, PIN più token, con limite ai tentativi. Vedi [07-sicurezza.md](07-sicurezza.md) |
| App web | L'APK contiene una copia di `docs/` negli asset, quindi funziona senza internet |

## Idee aperte

- Una schermata di primo avvio guidata sulla TV che apra le Opzioni sviluppatore.
- Accensione dallo standby provata su più TV e un'opzione "accendi quando apro l'app sul telefono".
- Misurare e ridurre la latenza dei tasti (il raggruppamento già aiuta).
- Versioni per altre marche (Samsung Tizen, LG webOS, Roku, Fire TV), ciascuna come ricevitore con lo stesso protocollo WebSocket.
- HTTPS con un certificato attendibile in locale, così l'app installata sul telefono e l'app TV condividono la stessa origine su iOS.
- Funzionare senza debug di rete, se Android offrirà un modo sicuro per inviare i tasti del telecomando.
