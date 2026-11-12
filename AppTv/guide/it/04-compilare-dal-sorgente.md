# 4. Compilare dal sorgente

> English: [../04-build-from-source.md](../04-build-from-source.md) · Torna al [README](../../README.it.md)

L'app è Java semplice. Non c'è Gradle e non si scarica nulla: lo script di compilazione usa gli strumenti da riga di comando dell'Android SDK. Funziona su Windows con PowerShell.

## Cosa ti serve

- Un **JDK 17 o successivo**.
- L'**Android SDK** con `build-tools;34...` e `platforms;android-34` (vanno bene anche versioni più nuove).
- Le variabili d'ambiente:
  - `JAVA_HOME`: la cartella del JDK.
  - `ANDROID_HOME`: la cartella dell'Android SDK.

```powershell
$env:JAVA_HOME = "C:\percorso\jdk-17"
$env:ANDROID_HOME = "C:\percorso\android-sdk"
```

## Compilare

Dalla cartella `tv-app` del repository (trova l'app web in `..\docs`):

```powershell
cd tv-app
powershell -File build.ps1
```

L'APK è `build\GlassRemoteTv.apk`.

Per compilare e installarlo sulla TV via rete (il debug di rete deve essere attivo, vedi [01-installare-sulla-tua-tv.md](01-installare-sulla-tua-tv.md)):

```powershell
powershell -File build.ps1 -Install 192.168.x.x:5555
```

Lo script include nell'APK l'app web per telefono da `docs/`, compila i sorgenti Java, firma l'APK e, con `-Install`, lo installa con adb.

## La tua chiave di firma

- La prima compilazione crea la tua chiave di firma in `tv-app/keystore` (con una password casuale accanto). È nel `.gitignore`. **Conservala, e non condividerla né pubblicarla mai.** Fanne una copia: un'app si aggiorna solo con un APK firmato con la stessa chiave.
- Il tuo APK è firmato con la **tua** chiave, quindi la sua impronta è diversa da quella della release in [AppTv/release/](../../release/). È normale.
- Un APK firmato con un'altra chiave non si installa sopra un'app già presente sulla TV. Disinstalla prima la vecchia GlassRemoteTv, installa la tua, poi rifai l'approvazione ADB una tantum sullo schermo della TV. Avrai un nuovo PIN e una nuova porta.
- Per vedere l'impronta di un APK: `apksigner verify --print-certs GlassRemoteTv.apk` (nelle build-tools di Android). La release ufficiale ha il soggetto del certificato `CN=GlassRemoteTv` e SHA-256 `62:38:B1:A8:AB:67:23:29:2A:25:60:C9:23:48:8C:82:05:B6:98:1E:61:5F:77:4C:2B:65:44:92:DF:6D:57:07`.

## Limiti che puoi cambiare

Per impostazione predefinita l'app sulla TV ricorda fino a **30 telefoni**. Ogni scheda del browser e ogni icona in Home conta come uno. Quando ne entra un 31º, il più vecchio viene dimenticato e deve scrivere di nuovo il PIN. Tiene inoltre fino a **24 connessioni aperte nello stesso momento**, con al massimo **6 connessioni da un solo dispositivo**. Per una famiglia è più che sufficiente.

Se ti serve di più, cambia queste costanti e ricompila:

| Costante | File | Cosa limita |
|---|---|---|
| `MAX_TOKENS` | `tv-app/src/app/glassremote/tv/Auth.java` | Telefoni ricordati |
| `MAX_CONNECTIONS` | `tv-app/src/app/glassremote/tv/Server.java` | Connessioni aperte nello stesso momento, in totale |
| `MAX_PER_PEER` | `tv-app/src/app/glassremote/tv/Server.java` | Connessioni da un solo dispositivo |

Poi compila l'APK e installalo di nuovo sulla TV:

```powershell
powershell -File build.ps1 -Install 192.168.x.x:5555
```

L'approvazione ADB una tantum e i telefoni salvati restano, perché la chiave di firma e i dati dell'app non cambiano.

Più connessioni contemporanee usano più memoria della TV. Alza i numeri solo quanto serve.

## Test

I test coprono la logica del PIN (`Auth.java`): PIN giusto e sbagliato, il blocco per indirizzo, il nuovo PIN dopo troppi tentativi, la porta salvata. Girano su un JDK normale, con due piccoli sostituti di prova al posto delle classi di Android.

In `tv-app/tests`:

```powershell
cd tv-app\tests
New-Item -ItemType Directory ..\build\authtest -Force | Out-Null
javac -d ..\build\authtest stubs\android\content\Context.java stubs\android\util\Base64.java ..\src\app\glassremote\tv\Auth.java AuthTest.java
java -cp ..\build\authtest app.glassremote.tv.AuthTest
```

Ogni riga dell'output deve iniziare con `PASS`. Se una riga inizia con altro, qualcosa non va.

## Mappa del sorgente

Tutti i file Java sono in `tv-app/src/app/glassremote/tv/`.

| File | Cosa fa |
|---|---|
| `MainActivity.java` | La schermata della TV: codice QR, indirizzo, PIN e stato |
| `Qr.java` | Piccolo generatore di codici QR (modalità byte, livello M) |
| `Server.java` | Server HTTP e WebSocket sulla porta casuale salvata; serve l'app web e gestisce i comandi del telefono |
| `Auth.java` | Il PIN, i token, la porta salvata e il blocco anti tentativi |
| `TvLink.java` | Parla con la TV: tasti, volume, app, stato |
| `Adb.java`, `Identity.java` | Client ADB minimale e la sua identità RSA |
| `ReceiverService.java`, `BootReceiver.java` | Tengono l'app attiva in background e la avviano all'accensione della TV |

Altri posti:

| Percorso | Contenuto |
|---|---|
| `docs/` | L'app web per telefono (HTML, CSS, JavaScript semplici) inclusa nell'APK |
| `tv-app/res/` | Icona e banner della TV |
| `tv-app/AndroidManifest.xml` | Permessi, voce nel launcher, servizio, ricevitore di avvio (`BootReceiver`) |
| `tv-app/build.ps1` | Lo script di compilazione |
| `tv-app/tests/` | `AuthTest.java` e i sostituti di prova |
| `tv-app/tools/hold-key/` | `Hold.java`, un helper che tiene premuto un tasto sulla TV (usato dalle istruzioni per l'assistente AI) |

## Regola quando modifichi l'app web

L'app web sta in `docs/` del repository e il ricevitore per computer in `receiver/`. La compilazione include `docs/` nell'APK. Ogni modifica all'app web richiede:

1. una nuova versione in `docs/version.js` (`APP_VERSION`);
2. il corrispondente aumento di `?v=N` in `docs/index.html` per i file che hai cambiato;
3. una nuova compilazione dell'APK (`powershell -File build.ps1`), così porta la nuova app web.

Senza l'aumento di versione i telefoni tengono i vecchi file in cache.

## Controllo privacy prima di pubblicare

Cerca nei tuoi file indirizzi IP, nomi del Wi-Fi, nomi della TV, nomi utente nei percorsi, `keystore`, `*.jks`, `password.txt`, PIN e token. Nessuno deve esserci. Usa `192.168.x.x` come segnaposto.
