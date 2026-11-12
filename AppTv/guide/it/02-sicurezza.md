# 2. Sicurezza e privacy

> English: [../02-security.md](../02-security.md) · Torna al [README](../../README.it.md)

Leggila una volta prima di installare. È breve e onesta.

## Cosa non fa GlassRemoteTv

- Nessun account, nessun accesso, nessuna pubblicità, nessuna statistica, nessun tracciamento, nessun cloud.
- Nessun dato va a un server. L'app, il telefono e la TV parlano tra loro solo dentro la tua rete di casa.

## Il modello di minaccia in parole semplici

GlassRemoteTv è pensata per **una casa, una famiglia, un Wi-Fi di cui ti fidi**. Ti protegge da:

- uno sconosciuto su internet (l'app rifiuta ogni indirizzo che non sia di una rete privata, e tu non apri mai una porta sul router);
- un vicino o un ospite sul tuo Wi-Fi che non vede lo schermo della TV (non conosce il PIN e non lo indovina in fretta).

**Non** ti protegge da:

- chi sta davanti alla TV e può leggere il PIN o il codice QR sullo schermo;
- chi ascolta il traffico del tuo Wi-Fi (l'HTTP semplice non è cifrato);
- un computer sul tuo Wi-Fi che approvi sullo schermo della TV quando la TV chiede *Consentire il debug USB?* (vedi la sezione seguente).

## Che cosa significa "debug di rete"

L'app per TV preme i tasti del telecomando tramite il debug bridge di Android (ADB), collegandosi all'indirizzo loopback della TV stessa. È l'unico modo in cui una normale app può farlo: il servizio ufficiale del telecomando rifiuta le richieste che arrivano dalla TV stessa.

Per questo il **debug di rete** deve essere ATTIVO nelle Opzioni sviluppatore della TV. Il compromesso:

- Un dispositivo che vuole usare ADB sulla TV deve essere approvato sullo schermo della TV. GlassRemoteTv si approva da sola una volta (tu scegli *Consenti sempre*) e poi resta attendibile.
- Con il debug di rete attivo, **qualunque computer sul tuo Wi-Fi che approvi sullo schermo della TV ottiene il controllo ADB della TV**. È un controllo a livello di shell, molto più profondo di un telecomando. **Non approvare richieste che non riconosci.**
- Se spegni il debug di rete, il telecomando smette di funzionare finché non lo riaccendi.

## Come funzionano PIN, token e porta

- **Porta casuale.** Al primo avvio ogni installazione sceglie la sua porta tra 20000 e 59999, la salva e la conserva. Non è un numero fisso e noto. Compare sullo schermo della TV.
- **PIN.** Un PIN di 6 cifre compare sullo schermo della TV e dentro il codice QR. Il QR apre `http://<ip-della-tv>:<porta>/#pin=<PIN>`, quindi inquadrarlo fa entrare il telefono in automatico. Oppure apri l'indirizzo e scrivi il PIN una volta.
- **Token.** Dopo il PIN giusto il telefono riceve un lungo token casuale e lo conserva. Senza un token valido l'app TV ignora ogni comando. L'app TV ricorda fino a 30 telefoni. I token non scadono.
- **Dettaglio iPhone.** La scheda di Safari e l'icona in Home hanno una memoria separata, quindi l'app installata chiede ancora il PIN una volta.
- **Blocco dopo i tentativi sbagliati.** Il blocco è per indirizzo: 5 tentativi sbagliati bloccano quell'indirizzo per 1 minuto, raddoppiando a ogni giro, fino a 15 minuti. Un dispositivo non può bloccare gli altri.
- **Nuovo PIN da sola.** Dopo 30 tentativi sbagliati in totale l'app sceglie un nuovo PIN (lo schermo della TV e il QR si aggiornano).
- **Solo indirizzi privati.** Si possono collegare solo i dispositivi della tua rete di casa (indirizzi privati).
- **Stesso PIN fino al ripristino.** PIN, porta e token restano finché non cancelli i dati dell'app.

## Cosa aggiunge la 0.5.0

- **Aiutante per i tasti.** Per i tasti veloci l'app TV avvia un piccolo aiutante (classe `app.glassremote.tv.Injector`, dentro lo stesso APK) con `app_process` come utente shell di ADB, su una seconda connessione ADB verso l'indirizzo loopback della TV stessa. Legge i codici dei tasti dal suo standard input. **Non apre nessun socket di rete** né nuove porte. Si ferma dopo 10 minuti senza tasti ed esce da solo quando l'app o la connessione si chiude. Se non riesce ad avviarsi, l'app torna a `input keyevent`.
- **Nuovi endpoint, tutti dietro il token.** `GET /api/stats` (dati di salute, sola lettura), `POST /api/clean-cache` (`pm trim-caches`, solo file temporanei, al massimo una volta ogni 10 secondi), `GET`/`PUT /api/maintenance` (il calendario del riavvio) e `POST /api/open-link` (vedi sotto). Come ogni altro comando, ignorano un telefono senza token valido.
- **Riavvio solo in standby.** Il riavvio automatico è spento di default, parte solo se la TV è in sospensione (Asleep/Dozing), mai due volte in 12 ore e mai nei primi 10 minuti dopo l'avvio. Un orologio sbagliato non può innescarlo in ciclo.
- **Link e app.** La scheda **Apri un link sulla TV** manda il link a `POST /api/open-link` (JSON `{"url":"..."}`, dietro il token; risponde 200 `{"ok":true}`, 400 `invalid_link`, 405 se la richiesta non è POST, 401 senza token e 503 se la TV non è raggiungibile). La lista dei consentiti vale per questo endpoint e per l'apertura delle app: sono accettati solo link `http`/`https` con un host (niente `file:`, `content:`, `intent:`, `market:`, `javascript:`), le app devono avere un nome di pacchetto valido, e il link si apre con la categoria `BROWSABLE`. Apre solo link: non può inviare file né fare il cast di foto o video.
- **Gli errori** restituiscono codici fissi, non il testo dell'eccezione.

Cosa può fare un telefono che ha il PIN (e quindi un token): premere tasti, aprire link e app (un link può anche svegliare la TV dallo standby), leggere i dati di salute e l'elenco dei processi, pulire la cache delle app, impostare o spegnere il riavvio automatico. Non può comunque eseguire comandi shell arbitrari. Tieni privati il PIN e il QR, come prima.

Noto e invariato: il server web della TV non controlla `Host`/`Origin` del WebSocket (i blocchi del PIN limitano i tentativi; potrebbe arrivare in una release futura), e il traffico è HTTP semplice sulla rete di casa, il compromesso descritto sopra. Altro in [../../../SECURITY-AUDIT.md](../../../SECURITY-AUDIT.md).

## Cosa fare

1. Tieni il **debug di rete** spento quando non ti serve il telecomando, o almeno sta attento a cosa approvi.
2. Approva le richieste ADB sulla TV solo se le hai avviate tu.
3. Usala solo su un Wi-Fi di casa di cui ti fidi.
4. Se puoi, assegna alla TV un indirizzo fisso dal router.
5. Controlla somma e firma dell'APK prima di installare (vedi il [README](../../README.it.md#verifica-il-download)).
6. Se compili tu l'app, tieni privata la tua chiave di firma.

## Cosa non fare

- **Non aprire mai una porta sul router** verso la TV. Niente port forwarding, niente DMZ. Non esporre mai l'app a internet.
- Non usarla su Wi-Fi pubblici o condivisi (bar, hotel, uffici, reti ospiti con sconosciuti). Il traffico è HTTP semplice, non cifrato.
- Non condividere il PIN né una foto del codice QR.
- Non usarla su una TV o una rete che non è tua.
- Non approvare richieste ADB che non riconosci.

## Come spegnerla

1. **Telecomando spento:** disattiva **Debug di rete** e **Debug USB** nelle Opzioni sviluppatore della TV. L'app non comanda più la TV finché non li riattivi.
2. **Togliere i computer attendibili:** usa **Revoca autorizzazioni debug USB** nelle Opzioni sviluppatore. Al prossimo avvio GlassRemoteTv chiede di nuovo l'approvazione (scegli ancora *Consenti sempre*).
3. **Nuovo PIN, nuova porta, tutti i telefoni disconnessi:** cancella i dati dell'app nelle impostazioni di Android (App, GlassRemoteTv, *Cancella dati*).
4. **Rimuovere l'app:** disinstallala dalle impostazioni di Android.

## Se pubblichi screenshot o log

Togli indirizzi IP e MAC, nomi della TV, nomi del Wi-Fi, nomi utente nei percorsi, e qualsiasi PIN o token prima di pubblicare. Sostituisci gli indirizzi con `192.168.x.x`.

## Segnalare una vulnerabilità

Apri un **security advisory privato** su GitHub (*Security*, *Report a vulnerability*) in questo repository, non una issue pubblica. Descrivi cosa hai trovato e come riprodurlo. Non includere il tuo PIN, i token o gli indirizzi.

Vedi anche: [01-installare-sulla-tua-tv.md](01-installare-sulla-tua-tv.md), [03-problemi-comuni.md](03-problemi-comuni.md), [05-salute-e-manutenzione.md](05-salute-e-manutenzione.md).
