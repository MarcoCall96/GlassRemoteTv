# 1. Installare GlassRemoteTv sulla tua TV

> English: [../01-install-on-your-tv.md](../01-install-on-your-tv.md) · Torna al [README](../../README.it.md)

Questa guida ti porta da zero a un telecomando funzionante sul telefono. Servono circa 5 minuti e nessun computer (il computer è solo uno dei tre modi per installare).

Prima di iniziare leggi una volta [02-sicurezza.md](02-sicurezza.md). L'app ha bisogno del **debug di rete** sulla TV, ed è bene sapere che cosa significa.

**Ti serve:**

- una Android TV o Google TV (Android 5 o successivo) che è tua;
- un iPhone o un telefono Android;
- la TV e il telefono sullo stesso Wi-Fi di casa (VPN del telefono spenta).

Samsung (Tizen), LG (webOS), Roku, Fire TV e Apple TV non sono supportate.

## Passo 1. Procurati l'APK

Questo passo vale per i metodi chiavetta USB e adb (B e C). Con l'app Downloader (metodo A) ora non scarichi nulla: è la TV a scaricare il file da sola al passo 2, via HTTPS, dall'indirizzo ufficiale della release. In quel caso vai al passo 2.

1. Apri la [pagina Releases](https://github.com/MarcoCall96/GlassRemoteTv/releases) e scarica `GlassRemoteTv-0.4.1.apk`. Lo stesso file è anche nel repository: [../../release/GlassRemoteTv-0.4.1.apk](../../release/GlassRemoteTv-0.4.1.apk).
2. Controllalo. Lo SHA-256 deve coincidere con [../../release/SHA256SUMS.txt](../../release/SHA256SUMS.txt):
   - Windows: `Get-FileHash -Algorithm SHA256 GlassRemoteTv-0.4.1.apk`
   - macOS / Linux: `shasum -a 256 GlassRemoteTv-0.4.1.apk`

La TV non può controllare una somma di controllo, quindi con l'app Downloader quel controllo sulla TV viene saltato. Se ti aiuta un assistente AI, può confrontare `release/GlassRemoteTv-0.4.1.apk` con `release/SHA256SUMS.txt` usando i file del repository.

## Passo 2. Installala sulla TV

Scegli un metodo.

### Metodo A: l'app Downloader (il più facile)

1. Sulla TV apri il **Google Play Store**, cerca **Downloader** (di AFTVnews) e installala.
2. Apri Downloader. La prima volta chiede il permesso di accedere a contenuti multimediali e file: scegli **Consenti**.
3. Nel campo URL scrivi il link diretto all'APK, poi premi **Vai**: `https://github.com/MarcoCall96/GlassRemoteTv/releases/download/v0.4.1/GlassRemoteTv-0.4.1.apk`. Se quel link non funziona, usa questo: `https://github.com/MarcoCall96/GlassRemoteTv/raw/main/AppTv/release/GlassRemoteTv-0.4.1.apk`.
4. Quando il download finisce, scegli **Installa**.
5. Se la TV dice che non può installare app sconosciute, consenti **Installa app sconosciute** a Downloader (Impostazioni > Preferenze dispositivo > Sicurezza e limitazioni > Origini sconosciute; i nomi dei menu cambiano da marca a marca) e riprova.

Scrivere un link lungo con il telecomando è lento e deve essere esatto. Se è troppo noioso, usa invece il metodo B (chiavetta USB) o C (adb).

### Metodo B: chiavetta USB

1. Copia `GlassRemoteTv-0.4.1.apk` su una chiavetta USB.
2. Inserisci la chiavetta nella TV e apri un'app di gestione file sulla TV.
3. Seleziona l'APK e scegli **Installa**. Consenti **Installa app sconosciute** alla app di gestione file se richiesto.

### Metodo C: da un computer con adb

1. Installa le platform-tools di Android sul computer (il computer deve stare nella stessa rete della TV).
2. Attiva prima il debug di rete sulla TV (passo 3 qui sotto), poi esegui:

```
adb connect 192.168.x.x:5555
adb install GlassRemoteTv-0.4.1.apk
```

Sostituisci `192.168.x.x` con l'indirizzo della TV (Impostazioni della TV, Rete). La TV ti chiederà di consentire questo computer. Spunta **Consenti sempre da questo computer** solo per un computer tuo, poi premi **Consenti**.

**Controllo:** tra le app della TV compare l'icona **GlassRemoteTv**.

## Passo 3. Attiva il debug di rete

1. Sulla TV apri **Impostazioni > Preferenze dispositivo > Informazioni** e tocca sette volte **Build** (o *Build di Android TV OS*). Un messaggio dice che ora sei uno sviluppatore.
2. Premi indietro, poi apri **Opzioni sviluppatore** (in **Impostazioni > Preferenze dispositivo**).
3. Attiva **Debug USB** e **Debug di rete**. I nomi cambiano da marca a marca: cerca ADB o debug via rete.

**Controllo:** nelle Opzioni sviluppatore i due interruttori sono accesi.

## Passo 4. Primo avvio

1. Apri **GlassRemoteTv** dalle app della TV.
2. La TV chiede **Consentire il debug USB?**. Spunta **Consenti sempre da questo computer**, poi premi **Consenti**. Lo fai una volta sola. Se il messaggio sparisce, l'app lo richiede da sola dopo un minuto.
3. Lo schermo mostra un **codice QR**, un **indirizzo** con la sua porta (per esempio `http://192.168.x.x:<porta>`) e un **PIN di 6 cifre**.

**Controllo:** lo schermo dice *Connected and ready* (in inglese: è il testo dell'app). Per ora tieni l'app aperta sulla TV: al passo 6 ti serve il PIN di 6 cifre mostrato lì (e al passo 5 se inquadrare il QR non funziona). Se sei già uscito dall'app, apri **GlassRemoteTv** dall'elenco delle app della TV per rivedere il PIN. L'app resta attiva in background e riparte all'accensione della TV. La porta resta la stessa dopo un riavvio.

Ogni installazione sceglie la sua porta casuale (tra 20000 e 59999) la prima volta e la conserva.

## Passo 5. Collega il telefono

1. Telefono sullo stesso Wi-Fi. Inquadra con la fotocamera il codice QR sullo schermo della TV. Su iPhone tocca il banner/link giallo che la Fotocamera mostra in alto (oppure apri il link in Safari). L'app si apre e ti fa entrare da sola.
2. Oppure apri l'indirizzo mostrato sulla TV con Safari (iPhone) o Chrome (Android) e scrivi una volta il PIN di 6 cifre. Il PIN è sullo schermo della TV, accanto al codice QR.

**Controllo:** si apre il telecomando. Premi una freccia: la TV risponde.

## Passo 6. Aggiungila alla schermata Home

- **iPhone:** in Safari tocca Condividi, poi **Aggiungi alla schermata Home**. Apri la nuova icona e scrivi ancora una volta il PIN di 6 cifre (mostrato sulla TV). La scheda di Safari e l'icona in Home hanno una memoria separata, quindi l'app installata chiede il PIN per conto suo.
- **Android:** in Chrome apri il menu e scegli **Installa app**.

Se la primissima volta dopo l'aggiunta alla Home su iPhone il layout sembra troppo corto, chiudi l'app dal selettore delle app e riaprila.

Da quel momento l'app si apre già collegata.

## Metti l'app nella Home della TV (facoltativo)

Dopo l'installazione l'app è nella scheda **Apps** ("App installate") della TV, come ultimo riquadro, con il suo banner (GlassRemote, TV receiver). Se la vuoi nella riga dei preferiti della Home, fai così. È stato provato su un launcher Google TV con Android 10 e interfaccia in italiano. I nomi cambiano da marca a marca e da lingua a lingua.

**Prima di iniziare decidi in che posizione la vuoi** (per esempio prima, quinta o ultima). Ti serve al punto 3.

1. Premi **Home** sul telecomando della TV e vai alla riga **App preferite**.
2. Vai all'ultimo riquadro della riga, **Aggiungi app ai preferiti**, e premi **OK**. Nell'elenco **Seleziona app** scegli **GlassRemoteTv**. Viene aggiunta in fondo alla riga.
3. Per spostarla, seleziona il suo riquadro e **tieni premuto OK** finché compare un menu (*Rimuovi dai preferiti*, *Sposta*, *Apri*). Scegli **Sposta**, poi premi **Sinistra** o **Destra** fino alla posizione che vuoi. Ogni pressione la sposta di un posto. Premi **OK** per lasciarla lì.

Spostandola a sinistra di N posti dall'ultima posizione, l'app va nella posizione (totale - N), dove totale è il numero di riquadri della riga. Per esempio, con 8 app nella riga, 3 pressioni di Sinistra la portano in quinta posizione.

**Controllo:** il riquadro dell'app è nella riga, nella posizione che hai scelto.

## Lingua

L'app segue il telefono. Per cambiarla apri **Impostazioni, Lingua**: Italiano, English, Español, Français, Deutsch, Português.

## Se l'indirizzo della TV cambia

Alcuni router assegnano alla TV un nuovo indirizzo dopo un riavvio. Se l'app non trova più la TV, inquadra di nuovo il QR sullo schermo della TV. Meglio ancora: assegna alla TV un indirizzo fisso dal router.

## Aggiornare

Installa il nuovo APK nello stesso modo, sopra il vecchio. PIN, porta e telefoni già collegati restano. Un APK firmato con un'altra chiave non si installa sopra il vecchio: disinstalla prima la vecchia app (vedi [04-compilare-dal-sorgente.md](04-compilare-dal-sorgente.md)).

## Spegnere tutto

1. Sulla TV disattiva **Debug di rete** e **Debug USB** nelle Opzioni sviluppatore. Il telecomando smette di funzionare finché non li riattivi.
2. Per togliere ogni computer attendibile usa **Revoca autorizzazioni debug USB** nelle Opzioni sviluppatore.
3. Per far dimenticare tutto all'app (nuovo PIN, nuova porta, tutti i telefoni disconnessi) cancella i dati dell'app: impostazioni di Android, App, GlassRemoteTv, *Cancella dati*.
4. Per rimuovere l'app, disinstallala dalla stessa schermata.

Qualcosa non va? Vedi [03-problemi-comuni.md](03-problemi-comuni.md).
