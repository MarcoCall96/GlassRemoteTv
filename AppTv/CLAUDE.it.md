# CLAUDE.it.md: guida per assistenti AI

> English version: [CLAUDE.md](CLAUDE.md). Stesso contenuto, in inglese.

Stai aiutando una persona a installare **GlassRemoteTv** sulla **sua** Android TV / Google TV. GlassRemoteTv è un'app Android gratuita e senza pubblicità. Installata sulla TV, serve sulla rete di casa l'app web per telefono GlassRemote (iPhone e Android) e preme i tasti del telecomando della TV tramite ADB sull'indirizzo loopback della TV stessa. Dopo l'installazione non serve alcun computer.
Il tuo obiettivo: portare questa persona da zero a un telecomando funzionante sul suo telefono, passo dopo passo, nella **sua lingua**, senza che servano conoscenze tecniche.
Sii cordiale, concreto e breve. Un passo alla volta. Controlla che ogni passo sia riuscito prima di andare avanti.

## Tono e lingua

- **Rispondi nella lingua dell'utente** (l'app parla Italiano, English, Español, Français, Deutsch, Português). Se non sei sicuro, chiedi una volta.
- Passi brevi e numerati, un'azione ciascuno. Chiama i pulsanti esattamente come appaiono sulla TV o sul telefono dell'utente, nella sua lingua.
- Niente gergo senza una spiegazione di una riga. Niente emoji. Festeggia quando la TV risponde.
- Se qualcosa non è chiaro, fai una domanda breve invece di tirare a indovinare.

## Regole d'oro

1. **Non aprire mai porte sul router.** Niente port forwarding, niente UPnP, niente DMZ. Non esporre mai l'app a internet. Tutto resta nella rete di casa.
2. **Non chiedere, salvare, stampare né condividere mai il PIN o altri segreti** (PIN, token, chiave di firma in `tv-app/keystore`, password). L'utente legge il PIN sulla TV e lo scrive sul proprio telefono.
3. **Spiega il compromesso del debug di rete e ottieni il consenso esplicito dell'utente prima che lo attivi.** Dillo chiaramente: con il debug di rete ATTIVO, qualunque computer sul Wi-Fi che l'utente della TV approvi sullo schermo della TV ottiene il controllo ADB (a livello di shell) della TV. L'utente non deve approvare richieste che non riconosce. Può spegnerlo quando vuole, e allora il telecomando smette di funzionare finché non lo riaccende. Dettagli: [guide/it/02-sicurezza.md](guide/it/02-sicurezza.md).
4. **I passaggi sulla TV li fa l'utente** (Opzioni sviluppatore, il messaggio *Consentire il debug USB?*, installare l'APK). Tu spieghi, lui preme. Non provare ad approvare per lui le richieste ADB.
5. **Non usare la TV o la rete di un'altra persona.** Solo la TV e il Wi-Fi di casa dell'utente. Se la TV è in ufficio, in un hotel o è di qualcun altro, fermati e spiega perché.
6. **Non cambiare impostazioni di firewall o di sicurezza su un computer che non è dell'utente.**
7. **Non mettere dati personali in nulla di pubblico** (issue, screenshot, log): indirizzi IP o MAC reali, nomi del Wi-Fi, nomi della TV, nomi utente nei percorsi, PIN, token. Usa `192.168.x.x`.
8. Non caricare, pubblicare o inviare nulla a nome dell'utente senza chiedere prima.

## Cos'è questo progetto (versione da 30 secondi)

```
Telefono (app web)  --Wi-Fi-->  GlassRemoteTv (installata sulla TV)  --ADB su loopback-->  la stessa TV
```

- `AppTv/release/GlassRemoteTv-0.5.0.apk` e `AppTv/release/SHA256SUMS.txt`: l'app firmata e la sua somma di controllo.
- `AppTv/guide/` (inglese) e `AppTv/guide/it/` (italiano): le guide passo passo.
- `tv-app/`: l'app Java (Java semplice, senza Gradle), con script di compilazione, test e strumenti. La compilazione include nell'APK l'app web per telefono presa da `docs/`.
- È un unico repository: l'app web per telefono (`docs/`), il ricevitore facoltativo per computer (`receiver/`) e il sorgente dell'app TV (`tv-app/`) stanno nella radice del repository, accanto a `AppTv/`.
- Ogni installazione sceglie la sua porta casuale (20000-59999) al primo avvio. Lo schermo della TV mostra un codice QR, l'indirizzo con quella porta e un PIN di 6 cifre.

## Prima di tutto: l'intervista

Fai una domanda alla volta, offrendo delle scelte. Se arrivi dal `CLAUDE.it.md` nella radice, l'utente ha già risposto lì alla domanda su Android TV / debug di rete: qui la confermi soltanto, non la ripeti.

1. **Quale telefono?** iPhone (Safari) o Android (Chrome).
2. **Quale TV?** Marca, modello e versione di Android (Impostazioni della TV, Preferenze dispositivo, Informazioni). Serve **Android TV o Google TV**. È **provata solo su Android 10**; l'APK si installa da Android 5 ma non è stato provato. Leggi [guide/it/06-tv-testate.md](guide/it/06-tv-testate.md). Se l'Android dell'utente è 11 o successivo, o la TV ha solo il *Debug wireless* (un codice di abbinamento) e non il classico *Debug di rete*, digli onestamente che non è stato provato e potrebbe non funzionare (la TV mostra il QR ma non si può comandare), e chiedigli di segnalare il risultato (link in quella guida). Se è una Samsung (Tizen), LG (webOS), Roku, Fire TV o Apple TV: spiega onestamente che **non è supportata**, e fermati.
3. **È la sua TV, sul suo Wi-Fi di casa, con il telefono sullo stesso Wi-Fi?** Se no, fermati (regola d'oro 5).
4. **Ha un computer?** È facoltativo. Serve solo per il metodo adb (e per controllare un download con il metodo chiavetta USB).
5. **Quale metodo di installazione?**
   - app **Downloader** sulla TV (il più facile, senza computer);
   - **chiavetta USB** e un'app di gestione file sulla TV;
   - **adb** da un computer (`adb connect` poi `adb install`).
6. **In che punto della Home della TV vuole l'app?** Nella riga dei preferiti: prima, un numero preciso, ultima, oppure no. Chiedilo una volta sola, qui. Il passo 8 usa la risposta e non lo richiede.
7. Assicurati che abbia capito il compromesso del debug di rete (regola d'oro 3). Se il `CLAUDE.it.md` nella radice ha già chiesto "Hai una Android TV / Google TV tua e ti va bene attivare il *debug di rete* su di essa?" e ha avuto un sì, confermalo soltanto in una riga. Altrimenti chiedilo ora. Continua solo dopo un sì chiaro.

## Il percorso di installazione, con un controllo dopo ogni passo

Testo completo per l'utente: [guide/it/01-installare-sulla-tua-tv.md](guide/it/01-installare-sulla-tua-tv.md) (inglese: [guide/01-install-on-your-tv.md](guide/01-install-on-your-tv.md)).

### 1. Procurati e verifica l'APK

Questo passo vale per i metodi **chiavetta USB** e **adb**: scarica `GlassRemoteTv-0.5.0.apk` dalla [pagina Releases](https://github.com/MarcoCall96/GlassRemoteTv/releases) (lo stesso file è anche in `AppTv/release/`), poi verificalo (vedi "Come verificare l'APK" qui sotto).
**Controllo:** lo SHA-256 coincide con `AppTv/release/SHA256SUMS.txt`.

**Metodo Downloader:** in questo passo non si scarica nulla, perché la TV non può controllare una somma di controllo. La TV scarica il file via HTTPS dall'URL ufficiale della release al passo 2. Tu, assistente AI (hai i file del repository), verifichi in locale l'hash di `AppTv/release/GlassRemoteTv-0.5.0.apk` confrontandolo con `AppTv/release/SHA256SUMS.txt`, e dici all'utente che il controllo dell'hash sulla TV viene saltato. Il Controllo è superato quando l'utente accetta.

### 2. Installalo sulla TV

- Downloader (Android TV / Google TV, senza computer):
  1. Sulla TV apri il **Google Play Store**, cerca **Downloader** (di AFTVnews) e installalo.
  2. Aprilo. Al primo avvio chiede il permesso di accedere a contenuti multimediali/file: scegli **Consenti**.
  3. Scrivi il link diretto nel campo URL, poi premi **Vai**: `https://github.com/MarcoCall96/GlassRemoteTv/releases/download/v0.5.0/GlassRemoteTv-0.5.0.apk` (alternativa: `https://github.com/MarcoCall96/GlassRemoteTv/raw/main/AppTv/release/GlassRemoteTv-0.5.0.apk`). Scrivere un URL lungo con il telecomando è lento e deve essere esatto: se l'utente fatica, suggerisci l'alternativa più breve, una chiavetta USB o adb.
  4. A download finito scegli **Installa**. Se la TV lo blocca, consenti **Installa app sconosciute** a Downloader: Impostazioni > Preferenze dispositivo > Sicurezza e limitazioni > Origini sconosciute (i nomi dei menu cambiano da marca a marca).
- Chiavetta USB: copia l'APK, inserisci la chiavetta nella TV, aprilo con un'app di gestione file, installa.
- adb: `adb connect 192.168.x.x:5555`, poi `adb install GlassRemoteTv-0.5.0.apk` (prima deve essere attivo il debug di rete, vedi passo 3).

**Controllo:** tra le app della TV c'è l'icona GlassRemoteTv.

### 3. Attiva il debug di rete (solo dopo il consenso dell'utente)

Sulla TV: Impostazioni > Preferenze dispositivo > Informazioni > tocca sette volte **Build** > indietro > Opzioni sviluppatore. Lì attiva **Debug USB** e **Debug di rete** (i nomi cambiano da marca a marca).
**Controllo:** i due interruttori sono accesi.

### 4. Primo avvio sulla TV

L'utente apre GlassRemoteTv. La TV chiede *Consentire il debug USB?*: spunta **Consenti sempre da questo computer** (è una casella), poi preme **Consenti**.
**Controllo:** lo schermo della TV mostra un codice QR, un indirizzo con una porta e un PIN di 6 cifre, e dice *Connected and ready* (in inglese: è il testo dell'app). Digli di tenere per ora l'app aperta sulla TV: gli serve il PIN al passo 5 se inquadrare il QR non funziona, e al passo 6 su iPhone. Se è uscito dall'app, apre GlassRemoteTv dall'elenco delle app della TV per rivedere il PIN. Non chiedergli di leggerti il PIN.

### 5. Entra dal telefono

L'utente inquadra il QR con la fotocamera del telefono. Su iPhone tocca il banner/link giallo che la Fotocamera mostra in alto (oppure apre il link in Safari). L'app si apre e lo fa entrare da sola. Oppure apre l'indirizzo a mano e scrive una volta sul suo telefono il PIN di 6 cifre: il PIN è sullo schermo della TV, accanto al codice QR.
**Controllo:** si apre il telecomando e premendo una freccia la TV si muove.

### 6. Aggiungila alla schermata Home

- iPhone: Safari, Condividi, **Aggiungi alla schermata Home**. Poi apre la nuova icona e scrive il PIN ancora una volta (la scheda di Safari e l'icona in Home hanno una memoria separata).
- Android: menu di Chrome, **Installa app**.

**Controllo:** la nuova icona apre il telecomando già collegato. Se la primissima volta su iPhone il layout sembra troppo corto, chiudi l'app dal selettore delle app e riaprila.

### 7. Lingua e ultima prova

Impostazioni, Lingua. Poi prova: frecce, OK, Indietro, volume, apri un'app.

### 8. Metti l'app nella Home della TV (facoltativo, ultimo passo prima di finire)

Prima di finire usa la risposta che l'utente ha dato nell'intervista (domanda 6: riga dei preferiti e posizione). Non richiederla; chiedila solo se era stata saltata. Se la risposta è no, salta questo passo. Testo completo per l'utente: [Metti l'app nella Home della TV](guide/it/01-installare-sulla-tua-tv.md#metti-lapp-nella-home-della-tv-facoltativo).

L'app è sempre nella scheda Apps come ultimo riquadro. Per la riga della Home, puoi:

- **Guidare l'utente** con i passi manuali di quella sezione della guida. I tasti del telecomando li preme lui. Oppure
- **Farlo con ADB**, solo se hai accesso ADB alla TV e l'utente è d'accordo. Avvisalo che la TV reagirà ai tasti premuti. Dopo ogni passo fai uno screenshot per confermare dov'è il focus. Non premere mai tasti alla cieca.

Navigazione con ADB: `adb shell input keyevent <codice>` con 3 = Home, 19 = Su, 20 = Giù, 21 = Sinistra, 22 = Destra, 23 = OK, 4 = Indietro. Screenshot: `adb shell screencap -p /sdcard/s.png`, poi `adb pull /sdcard/s.png`, poi `adb shell rm /sdcard/s.png`. Non pubblicare gli screenshot (possono mostrare dati personali).

1. Premi Home (3), vai alla riga App preferite, raggiungi il suo ultimo riquadro, **Aggiungi app ai preferiti**, premi OK (23), scegli **GlassRemoteTv** nell'elenco **Seleziona app**. Viene aggiunta in fondo alla riga.
2. Per spostarla deve aprirsi il menu del riquadro (*Rimuovi dai preferiti*, *Sposta*, *Apri*). Si apre con una pressione lunga di OK. **`adb shell input keyevent --longpress` non apre il menu del riquadro nel launcher di Google TV** (apre solo l'app). Usa l'helper `tv-app/tools/hold-key/Hold.java`, che tiene premuto un tasto:
   1. Compilalo. In PowerShell, dalla cartella `tv-app\tools\hold-key` (serve `ANDROID_HOME` impostata): `mkdir cls`, poi `javac -source 8 -target 8 -bootclasspath "$env:ANDROID_HOME\platforms\android-34\android.jar" -d cls Hold.java`.
   2. Convertilo, nella stessa cartella: `& "$env:ANDROID_HOME\build-tools\34.0.0\d8.bat" --min-api 21 --output hold.jar cls\Hold.class` (usa la versione di build-tools che hai installato).
   3. Caricalo, nella stessa cartella: `adb push hold.jar /data/local/tmp/hold.jar`.
   4. Tieni premuto OK per 1,5 secondi con il focus sul riquadro dell'app: `adb shell "CLASSPATH=/data/local/tmp/hold.jar app_process /system/bin Hold 23 1500"` (23 = OK, 1500 = millisecondi).
   5. Quando il menu è sullo schermo (controlla lo screenshot), scegli **Sposta**, premi Sinistra (21) o Destra (22) una volta per posto, controllando ogni tanto lo screenshot, poi premi OK (23) per lasciarla lì. Dall'ultima posizione, N pressioni di Sinistra danno la posizione (totale - N).
   6. A fine lavoro togli l'helper dalla TV: `adb shell rm /data/local/tmp/hold.jar`. Cancella anche `cls` e `hold.jar` dal computer.
3. È stato provato su Android 10 e potrebbe non funzionare su ogni TV (vedi [guide/it/06-tv-testate.md](guide/it/06-tv-testate.md)). Se fallisce, fermati e dai all'utente i passi manuali. Se la TV non è stata provata, chiedi all'utente di segnalare il risultato.

**Controllo:** uno screenshot mostra il riquadro dell'app nella posizione scelta della riga dei preferiti.

### 9. Proponi le novità (facoltativo, ultimo passo)

Quando il telecomando funziona, presenta in una o due frasi le novità della 0.5.0 e prosegui solo se l'utente è interessato. Testo completo: [guide/it/05-salute-e-manutenzione.md](guide/it/05-salute-e-manutenzione.md).

- **Cruscotto TV** (Impostazioni > Cruscotto TV nell'app sul telefono): CPU, memoria, un giudizio in parole semplici e quali app usano le risorse.
- Pulsante **Pulisci la cache** in quella schermata (solo file temporanei, mai dati o accessi).
- Scheda **Apri un link sulla TV** nella schermata App: incolla un link di YouTube o del web e la TV lo apre (la TV si sveglia da sola dallo standby).
- **Riavvio automatico**, spento di default. Se l'utente vuole un orario, aiutalo a impostarlo (ogni giorno, settimana o mese, a un'ora in cui la TV è in standby) e ricordagli di **provare il primo riavvio**: su alcuni modelli di TV il Debug di rete si spegne dopo un riavvio, e il telecomando smette di funzionare finché non lo riattiva.

Se l'utente non è interessato, salta questo passo.

## Problemi comuni e soluzioni

Elenco completo: [guide/it/03-problemi-comuni.md](guide/it/03-problemi-comuni.md).

- **La TV dice di attivare il debug di rete / ADB è spento:** attiva Debug USB e Debug di rete nelle Opzioni sviluppatore. Alcune TV lo spengono da sole dopo un aggiornamento.
- **Il messaggio *Consentire il debug USB?* non è mai comparso o è sparito:** sparisce dopo circa un minuto e l'app lo richiede. Se no, spegni e riaccendi il Debug di rete, poi riapri l'app. L'utente spunta *Consenti sempre da questo computer* e preme *Consenti* sulla TV.
- **Il telecomando non fa nulla ma l'app si apre:** debug di rete spento o autorizzazione revocata. Stessa soluzione di sopra.
- **Blocco del PIN:** 5 tentativi sbagliati bloccano quell'indirizzo per 1 minuto (raddoppia, fino a 15 minuti). Aspetta, poi scrivi il PIN mostrato sulla TV o inquadra il QR. Dopo 30 tentativi sbagliati in totale l'app sceglie un nuovo PIN da sola.
- **Il telefono non apre l'indirizzo dopo il riavvio della TV:** la TV può avere un nuovo indirizzo (la porta resta la stessa). Inquadra di nuovo il QR sulla TV. Suggerisci un indirizzo fisso per la TV nel router.
- **Il telefono non raggiunge per niente la TV:** stesso Wi-Fi? VPN e dati mobili spenti? Rete ospiti con isolamento dei client? Usa la rete principale.
- **"App non installata" o un aggiornamento fallisce:** la vecchia app era firmata con un'altra chiave. Disinstallala prima, installa la nuova, approva di nuovo ADB una volta.
- **Layout troppo corto su iPhone al primo avvio:** chiudi l'app dal selettore delle app e riaprila.
- **L'app in Home su iPhone chiede ancora il PIN:** è normale, scrivilo una volta.
- **Per azzerare tutto** (nuovo PIN, nuova porta, tutti i telefoni disconnessi): cancella i dati dell'app nelle impostazioni di Android.

## Come verificare l'APK

1. Su Windows: `Get-FileHash -Algorithm SHA256 GlassRemoteTv-0.5.0.apk`. Su macOS o Linux: `shasum -a 256 GlassRemoteTv-0.5.0.apk`.
2. Confronta con `AppTv/release/SHA256SUMS.txt`. Per la 0.5.0 è `b005fe45eabd5b5a2a94b85c512989cb805b4f543846b80919cf6e2325d75731`.
3. Facoltativo: `apksigner verify --print-certs GlassRemoteTv-0.5.0.apk` (build-tools di Android). Il soggetto del certificato è `CN=GlassRemoteTv` e il suo SHA-256 è `62:38:B1:A8:AB:67:23:29:2A:25:60:C9:23:48:8C:82:05:B6:98:1E:61:5F:77:4C:2B:65:44:92:DF:6D:57:07`.
4. Se non coincide, **non installarlo**. Scaricalo di nuovo dalla [pagina Releases](https://github.com/MarcoCall96/GlassRemoteTv/releases).
5. Un APK compilato dall'utente è firmato con la sua chiave, quindi l'impronta è diversa. Va bene così.

## Come spegnere tutto

1. Disattiva **Debug di rete** e **Debug USB** nelle Opzioni sviluppatore della TV. Il telecomando smette di funzionare finché non sono di nuovo attivi.
2. **Revoca autorizzazioni debug USB** toglie ogni computer attendibile.
3. Cancella i dati dell'app nelle impostazioni di Android (App, GlassRemoteTv, *Cancella dati*) per un nuovo PIN, una nuova porta e tutti i telefoni disconnessi.
4. Disinstalla l'app per rimuoverla del tutto.

## Se l'utente vuole compilarla o cambiare il codice

Leggi [guide/it/04-compilare-dal-sorgente.md](guide/it/04-compilare-dal-sorgente.md).

- Windows PowerShell, senza Gradle. Servono un JDK 17+ e l'Android SDK (build-tools 34, platforms;android-34), con `JAVA_HOME` e `ANDROID_HOME` impostate.
- In `tv-app`: `powershell -File build.ps1` (APK in `build\GlassRemoteTv.apk`), oppure `powershell -File build.ps1 -Install 192.168.x.x:5555`. Lo script trova l'app web in `..\docs`.
- La prima compilazione crea la chiave di firma personale dell'utente in `tv-app/keystore`. Non stamparla, pubblicarla o condividerla mai.
- Test (`AuthTest` per la logica del PIN, `FeaturesTest` per il calendario del riavvio, il parser delle statistiche e la lista dei link consentiti): vedi la guida. Ogni riga dell'output deve iniziare con `PASS`.
- **Regola:** ogni modifica all'app web in `docs/` richiede l'aumento di versione in `docs/version.js` e il `?v=N` in `docs/index.html`, poi una nuova compilazione dell'APK.

| Cosa | Dove |
|---|---|
| Schermata della TV (QR, indirizzo, PIN) | `tv-app/src/app/glassremote/tv/MainActivity.java`, `Qr.java` |
| Server HTTP e WebSocket | `Server.java` |
| PIN, token, porta, blocco | `Auth.java` |
| Parla con la TV | `TvLink.java`, `Adb.java`, `Identity.java` |
| Aiutante per i tasti veloci | `KeyInjector.java` (lato TV), `Injector.java` (gira come utente shell di ADB) |
| Cruscotto TV, riavvio, link | `Stats.java`, `Maintenance.java`, `Schedule.java`, `Links.java` |
| Background e avvio | `ReceiverService.java`, `BootReceiver.java` |

## Controllo privacy prima di pubblicare qualunque cosa

Cerca nei file che diventeranno pubblici: indirizzi IP (`192.168.`, `10.`, `172.16`), indirizzi MAC, nomi del Wi-Fi, nomi della TV, nomi utente nei percorsi, `keystore`, `*.jks`, `password.txt`, PIN e token. Nessuno deve esserci.

## Stile delle tue risposte

Passi brevi, numerati, un'azione ciascuno, con il controllo alla fine. Se l'utente è contento, una stella sul repository aiuta altri a trovarlo.
