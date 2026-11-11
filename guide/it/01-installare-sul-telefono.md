# 1. Installare l'app sul telefono

> English: [../01-install-on-your-phone.md](../01-install-on-your-phone.md)

Non servono App Store né Google Play. GlassRemote è una web app (PWA) che aggiungi alla schermata Home.

> **Prima di iniziare:** l'app comanda una TV vera solo se la apri **dal tuo ricevitore** (vedi [02-avviare-il-ricevitore.md](02-avviare-il-ricevitore.md)).
> Aprendola da GitHub Pages vedi una demo con una TV finta. L'installazione è identica.

Ti serve l'indirizzo del ricevitore. Avviandolo con `python bridge.py --lan` stampa:

```
GlassRemote ready.  From your phone (same Wi-Fi) open:  http://192.168.x.x:8780/
```

Il telefono deve stare sullo **stesso Wi-Fi** del computer che esegue il ricevitore. Puoi anche aprire `http://<IP-del-computer>:8780/connect` sul computer: mostra un **QR code** da inquadrare con la fotocamera.

## iPhone (Safari)

1. Apri l'indirizzo in **Safari** (deve essere Safari: gli altri browser su iPhone non installano le web app allo stesso modo).
2. Tocca **Condividi** (il quadrato con la freccia).
3. Scorri e tocca **Aggiungi alla schermata Home**.
4. Tocca **Aggiungi**. L'icona di GlassRemote compare nella Home.
5. Apri l'app dall'icona: va a schermo intero come un'app vera.

Note per iPhone:
- Su `http://` semplice nella rete di casa, Safari non salva l'app per l'uso offline. L'interfaccia si apre comunque subito, ma il ricevitore deve essere acceso per comandare la TV.
- La vibrazione non è disponibile nelle web app dell'iPhone (limite di iOS).
- Se dopo un aggiornamento vedi il layout vecchio: elimina l'icona dalla Home e aggiungila di nuovo.

## Android (Chrome)

1. Apri l'indirizzo in **Chrome**.
2. Tocca il menu dei **tre puntini**.
3. Tocca **Installa app** oppure **Aggiungi a schermata Home**.
4. Conferma. L'icona compare nella Home.

Note per Android:
- Su un indirizzo `http://` semplice Chrome crea una scorciatoia che si apre a schermo intero. L'uso offline completo richiede HTTPS: è facoltativo e non serve per comandare la TV.

## Prima volta nell'app

Scegli la lingua: **Impostazioni, Lingua** (automatica di default, oppure Italiano, English, Español, Français, Deutsch, Português).

### Aggiungere e abbinare la TV

1. Accendi la TV.
2. Nella scheda **TV** tocca **Cerca TV sulla rete**, oppure **+** e scrivi l'indirizzo IP della TV (lo trovi in Impostazioni TV, Rete).
3. Scegli la tua TV. Lo stato dice **Da abbinare**.
4. La TV mostra un **codice di 6 caratteri**. Scrivilo nell'app e tocca **Abbina**.
5. Lo stato diventa **Collegata**. L'abbinamento si fa una volta sola.

### Usarla

- **Scheda Telecomando:** frecce, touchpad, tastierino numerico, tastiera QWERTY (con dettatura e incolla).
- **Scheda App:** tocca un'icona per aprire l'app. Con *Modifica* aggiungi o togli app.
- **Scene:** un tocco imposta app, volume e timer di spegnimento.
- **Timer di spegnimento:** spegne la TV dopo da 15 minuti a 2 ore.

### Siri e Comandi Rapidi (iPhone)

In **Impostazioni**, *Siri e Comandi Rapidi* mostra indirizzi già pronti. Nell'app **Comandi Rapidi** crea un comando con l'azione **Ottieni contenuti dell'URL**, incolla l'indirizzo e dai al comando il nome che vuoi dire ("Ehi Siri, accendi la TV"). Funziona solo sul tuo Wi-Fi di casa.

## Aggiornare

Aggiorna il repository sul computer che esegue il ricevitore, riavvia il ricevitore, poi chiudi e riapri l'app sul telefono. Se vedi ancora la versione vecchia, elimina l'icona e aggiungila di nuovo.

Qualcosa non va? Vedi [04-problemi-comuni.md](04-problemi-comuni.md).
