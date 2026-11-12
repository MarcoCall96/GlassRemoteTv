# 3. Problemi comuni

> English: [../03-troubleshooting.md](../03-troubleshooting.md) · Torna al [README](../../README.it.md)

Ogni voce dice: **sintomo**, poi **causa**, poi **soluzione**.

## Lo schermo della TV dice di attivare il debug di rete

- **Causa:** ADB via rete è spento sulla TV.
- **Soluzione:** Impostazioni, Preferenze dispositivo, Opzioni sviluppatore: attiva **Debug USB** e **Debug di rete** (i nomi cambiano da marca a marca). Se non vedi le Opzioni sviluppatore, tocca sette volte **Build** in Impostazioni, Preferenze dispositivo, Informazioni. Vedi [01-installare-sulla-tua-tv.md](01-installare-sulla-tua-tv.md).

## Lo schermo della TV dice di consentire la connessione

- **Causa:** la TV mostra, o ha mostrato, il messaggio **Consentire il debug USB?** e nessuno ha premuto *Consenti*.
- **Soluzione:** spunta **Consenti sempre da questo computer** e premi **Consenti** con il telecomando della TV. Il messaggio sparisce dopo circa un minuto; l'app lo richiede da sola. Se non compare mai, spegni e riaccendi il Debug di rete, poi riapri GlassRemoteTv.

## L'app sul telefono chiede il PIN

- **Causa:** questo telefono (o questa app in Home) non è ancora collegato, oppure il PIN è cambiato.
- **Soluzione:** inquadra il codice QR sullo schermo della TV, oppure scrivi le 6 cifre mostrate sulla TV. Su iPhone la scheda di Safari e l'icona in Home sono separate, quindi ognuna vuole il PIN una volta.

## "Bloccato" o "troppi tentativi"

- **Causa:** 5 tentativi di PIN sbagliati bloccano quell'indirizzo per 1 minuto. Il blocco raddoppia a ogni giro, fino a 15 minuti. È bloccato solo il tuo dispositivo, non gli altri.
- **Soluzione:** aspetta, poi scrivi il PIN mostrato sulla TV oppure inquadra il QR. Dopo 30 tentativi sbagliati in totale l'app sceglie un nuovo PIN da sola: leggi il nuovo sullo schermo della TV.

## Il telefono non apre l'indirizzo

- **Causa:** rete diversa, VPN o dati mobili di mezzo, Wi-Fi ospiti con isolamento dei client, oppure l'indirizzo o la porta della TV sono cambiati.
- **Soluzione:** telefono sullo stesso Wi-Fi della TV, VPN spenta. Usa la rete principale, non quella ospiti, oppure disattiva l'*isolamento AP / client* sul router. Leggi indirizzo e porta attuali sullo schermo della TV e inquadra di nuovo il QR. Se la pagina non si carica, controlla che GlassRemoteTv sia aperta o attiva sulla TV (aprila una volta).

## Ha smesso di funzionare dopo il riavvio della TV

- **Causa:** il router ha dato alla TV un nuovo indirizzo, oppure la TV ha azzerato il debug di rete.
- **Soluzione:** inquadra di nuovo il QR sullo schermo della TV. Assegna alla TV un indirizzo fisso dal router. Controlla che il **Debug di rete** sia ancora attivo. La porta resta la stessa dopo un riavvio, ma l'indirizzo può cambiare.

## Il telecomando non fa nulla, ma l'app si apre

- **Causa:** debug di rete spento, oppure l'autorizzazione è stata revocata.
- **Soluzione:** attiva il Debug di rete, riapri GlassRemoteTv sulla TV, spunta *Consenti sempre da questo computer* e premi *Consenti* quando richiesto. Lo schermo della TV dovrebbe dire *Connected and ready* (in inglese: è il testo dell'app).

## La TV non si accende dallo standby

- **Causa:** una TV in standby profondo può chiudere la rete, e l'app non la raggiunge.
- **Soluzione:** accendi la TV una volta con il suo telecomando. Attiva *Wake on LAN*, *Wake on Wi-Fi* o *Standby di rete* nelle impostazioni della TV, se ci sono. Non tutte le TV lo permettono.

## Non trovo l'app sulla TV

- **Causa:** l'app non va da sola nella Home. Sta nella scheda **Apps** ("App installate"), come ultimo riquadro. La riga dei preferiti della Home della TV è un'altra cosa.
- **Soluzione:** apri la scheda Apps e guarda l'ultimo riquadro. Per aggiungerla alla riga dei preferiti della Home, segui [Metti l'app nella Home della TV](01-installare-sulla-tua-tv.md#metti-lapp-nella-home-della-tv-facoltativo) nella guida 01. Se non c'è nemmeno nella scheda Apps, vedi la voce seguente.

## L'app non è nell'elenco delle app della TV

- **Causa:** l'installazione non è finita, oppure la TV la mostra solo nella riga delle app di sistema.
- **Soluzione:** guarda in Impostazioni, App, Vedi tutte le app. Installa di nuovo (vedi [01-installare-sulla-tua-tv.md](01-installare-sulla-tua-tv.md)). Se la TV dice "App non installata", vedi la voce seguente.

## "App non installata" o un aggiornamento fallisce

- **Causa:** la vecchia copia era firmata con un'altra chiave (per esempio una che hai creato tu) e Android non lascia che un APK firmato con un'altra chiave la sostituisca.
- **Soluzione:** disinstalla la vecchia GlassRemoteTv da Impostazioni, App. Installa il nuovo APK. Aprilo e approva ancora una volta la connessione. Avrai un nuovo PIN e una nuova porta.

## La TV dice che non può installare app sconosciute

- **Causa:** *Installa app sconosciute* è spento per l'app con cui apri l'APK.
- **Soluzione:** consentilo a Downloader (o alla tua app di gestione file) nelle impostazioni della TV (Impostazioni > Preferenze dispositivo > Sicurezza e limitazioni > Origini sconosciute; i nomi dei menu cambiano da marca a marca), poi riprova.

## iPhone: il layout è troppo corto la prima volta

- **Causa:** una stranezza di iOS al primissimo avvio dopo *Aggiungi alla schermata Home*.
- **Soluzione:** chiudi l'app dal selettore delle app e riaprila.

## iPhone: l'app chiede ancora il PIN dopo averla aggiunta alla Home

- **Causa:** la scheda di Safari e l'icona in Home hanno una memoria separata.
- **Soluzione:** scrivi il PIN una volta nell'app installata. Basta una volta sola.

## I tasti sono lenti

- **Causa:** l'aiutante per i tasti non è in esecuzione, quindi ogni tasto passa dal metodo lento `input keyevent` (circa 1 secondo a tasto). L'aiutante parte quando un telefono si collega, quindi il primissimo tasto può essere ancora lento (circa 1 secondo), e si ferma dopo 10 minuti senza tasti: il primo tasto dopo una lunga pausa è di nuovo lento.
- **Soluzione:** controlla che il **Debug di rete** sia attivo (all'aiutante serve la seconda connessione ADB). Se non riesce ad avviarsi, l'app passa da sola al metodo lento, quindi il telecomando continua a funzionare. Premi qualche tasto e dovrebbe diventare veloce. Vedi [05-salute-e-manutenzione.md](05-salute-e-manutenzione.md).

## Non vedo il Cruscotto TV

- **Causa:** la schermata compare solo quando risponde l'app TV. Non c'è con il ricevitore per computer, e una vecchia app TV (prima della 0.5.0) non ce l'ha.
- **Soluzione:** installa GlassRemoteTv 0.5.0 o successiva sulla TV e apri l'app sul telefono dall'indirizzo della TV (o dal QR). Chiudi e riapri l'app sul telefono perché carichi la nuova versione.

## I numeri del Cruscotto sembrano alti

- **Causa:** fare la misura aggiunge un po' di carico finché la schermata è aperta. Inoltre `top` su Android dà valori a scalini grossolani (circa 3%), e i valori dei processi sono percentuali di un solo core, mentre i core mostrano la percentuale totale.
- **Soluzione:** non c'è nessun problema. Chiudi la schermata e il carico sparisce. Guarda il giudizio e l'andamento più che un singolo numero. Vedi [05-salute-e-manutenzione.md](05-salute-e-manutenzione.md).

## Il riavvio automatico non è avvenuto

- **Causa:** una di queste:
  - il calendario è spento o non è stato salvato (l'interruttore è spento di default);
  - la TV era accesa a quell'ora: si riavvia solo in standby, riprova ogni 30 minuti per un massimo di 6 ore, poi passa alla scadenza successiva;
  - l'ora è quella del **fuso orario della TV**, non del telefono;
  - l'ultimo riavvio è di meno di 12 ore fa, oppure la TV si era avviata da meno di 10 minuti;
  - la TV si è riavviata ma ha spento il **Debug di rete**, quindi il telecomando non funziona (alcuni modelli lo fanno).
- **Soluzione:** controlla il calendario e l'orario "Prossimo riavvio" nel Cruscotto TV, e il fuso orario della TV. Se dopo un riavvio il Debug di rete è spento, riaccendilo e valuta di spegnere il calendario per quella TV.

## "Pulisci la cache" libera 0 MB

- **Causa:** la cache era già pulita, oppure le app avevano pochissimi dati temporanei.
- **Soluzione:** non c'è nulla da sistemare. È normale e non significa che sia fallito.

## Il link non apre nulla sulla TV

- **Causa:** la TV non ha un'app che gestisca quel tipo di link. I link di Netflix, Prime Video o Disney+ si aprono solo se l'app della TV gestisce quel link web. Oppure il Debug di rete è spento.
- **Soluzione:** prova un link `youtu.be` o `youtube.com` (l'app YouTube deve essere installata sulla TV). Controlla che il **Debug di rete** sia attivo. Ricorda che apre solo link: non fa il cast di foto o video dal telefono e non può inviare file. Vedi [05-salute-e-manutenzione.md](05-salute-e-manutenzione.md#apri-un-link-sulla-tv).

## "Questo non è un link web"

- **Causa:** sono accettati solo link `http` e `https` (niente `file:`, `content:`, `intent:`, `market:`, `javascript:`).
- **Soluzione:** incolla un normale link web. Un link senza `http(s)://` ma con un punto, come `youtu.be/abc`, riceve da solo `https://`.

## "La TV non è raggiungibile" aprendo un link

- **Causa:** la TV è spenta dalla presa, non è in rete, oppure il Debug di rete è spento.
- **Soluzione:** alimenta la TV (una TV in standby viene svegliata dal link), controlla il Wi-Fi e che il **Debug di rete** sia attivo, poi riprova.

## L'app sembra vecchia dopo un aggiornamento

- **Soluzione:** chiudila e riaprila. Se resta vecchia, elimina l'icona dalla Home e aggiungila di nuovo.

## Ancora bloccato?

Apri una issue e scrivi: modello e sistema del telefono, marca, modello e versione di Android della TV, cosa dice lo schermo della TV, cosa vedi sul telefono. **Togli indirizzi IP, il PIN e ogni dato personale** da screenshot e log prima di pubblicare. Per un problema di sicurezza usa un security advisory privato (vedi [02-sicurezza.md](02-sicurezza.md)).
