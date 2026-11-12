# 6. TV testate

> English: [../06-tested-tvs.md](../06-tested-tvs.md) · Torna al [README](../../README.it.md)

Una pagina onesta: su quali TV l'app TV è stata davvero provata, cosa aspettarti sulla tua, come provarla in 5 minuti e come comunicarci il risultato.

## TV testate

Finora è stata verificata una sola TV. Ogni altra riga aspetta una segnalazione: non si dà nulla per scontato.

| TV | Versione di Android | Funzioni controllate | Note |
|---|---|---|---|
| Panasonic 4KTV-JUP (Jupiter, MediaTek), ARMv7, launcher Google TV, interfaccia in italiano | Android 10 (SDK 29) | OK: installazione con adb; codice QR + PIN; accesso dal telefono con un iPhone 16 Pro (Safari e icona in Home); tasti (circa 10 ms con l'aiutante per i tasti); volume; apertura delle app; scene; accensione dallo standby; timer di spegnimento; apri un link sulla TV (si è aperto YouTube); Cruscotto TV; pulizia della cache; riavvio automatico in standby; app fissata nella riga dei preferiti della Home | Dopo il riavvio automatico la TV è tornata in circa 95 secondi, e il Debug di rete e l'app sono tornati da soli |
| La tua TV qui | In attesa di segnalazioni | In attesa di segnalazioni | [Segnala la tua TV](#segnala-la-tua-tv) |
| La tua TV qui | In attesa di segnalazioni | In attesa di segnalazioni | [Segnala la tua TV](#segnala-la-tua-tv) |
| La tua TV qui | In attesa di segnalazioni | In attesa di segnalazioni | [Segnala la tua TV](#segnala-la-tua-tv) |

## Quale versione di Android mi serve?

L'APK si installa da **Android 5.0 (API 21)**. È solo il minimo tecnico e **non è stato provato**. La versione provata è **Android 10**.

Il vero requisito è che la TV offra il **Debug di rete** (ADB via rete, sulla porta 5555) nelle Opzioni sviluppatore. L'app usa il protocollo ADB classico.

| Versione di Android | Cosa aspettarsi |
|---|---|
| 9 e 10 | Probabilmente OK. È la famiglia della TV provata. |
| 7 e 8 | Probabilmente OK per tasti, app e link. L'elenco Processi del Cruscotto TV può essere ridotto (un comando `top` diverso). |
| 11 e successive | **Non provate.** Molte TV recenti offrono solo il **Debug wireless** con un codice di abbinamento, che questa app non supporta: la TV mostra allora il QR ma non si può comandare. Alcuni dispositivi (per esempio Chromecast con Google TV) potrebbero offrire ancora l'opzione classica tramite *Debug USB*: non verificato. |

Se l'aiutante per i tasti non riesce ad avviarsi, l'app passa in silenzio al metodo lento (circa 1 secondo a tasto): il telecomando funziona comunque.

Non supportate affatto: Samsung (Tizen), LG (webOS), Roku, Fire TV e Apple TV.

## Prova la tua TV in 5 minuti

Segui i passi in ordine e confronta ogni risultato con quello atteso. Fermati al primo passo che non va e annotalo per la segnalazione.

1. **Installa** l'APK ([01-installare-sulla-tua-tv.md](01-installare-sulla-tua-tv.md)). Atteso: un'icona GlassRemoteTv tra le app della TV.
2. **Attiva il Debug di rete** nelle Opzioni sviluppatore, apri l'app e, quando la TV chiede *Consentire il debug USB?*, spunta *Consenti sempre da questo computer* e premi *Consenti*. Atteso: nessun errore sulla TV. Se questa impostazione non c'è, o c'è solo il *Debug wireless* con codice di abbinamento, la tua TV non è compatibile: segnalacelo.
3. **Apri l'app sulla TV.** Atteso: lo schermo mostra un codice QR, un indirizzo, un PIN e *Connected and ready*.
4. **Inquadra il codice QR** con la fotocamera del telefono. Atteso: il telecomando si apre e ti fa entrare da solo.
5. **Premi qualche tasto** (frecce, OK, Indietro). Atteso: la TV reagisce subito (circa 10 ms con l'aiutante per i tasti; circa 1 secondo a tasto se passa al metodo lento).
6. **Volume** su e giù. Atteso: il volume della TV cambia.
7. **Apri un'app** dalla scheda App. Atteso: l'app si apre sulla TV.
8. **Accendi la TV dallo standby** con il telecomando sul telefono. Atteso: la TV si accende (dipende dalla TV, vedi [03-problemi-comuni.md](03-problemi-comuni.md)).
9. **Apri un link:** nella schermata App, incolla un link di YouTube in *Apri un link sulla TV* e tocca *Apri sulla TV*. Atteso: la TV apre il link nell'app YouTube, se è installata.
10. **Apri il Cruscotto TV** (Impostazioni > Cruscotto TV). Atteso: compaiono i numeri di CPU e memoria e si aggiornano.
11. *Facoltativo:* tocca **Pulisci** in Manutenzione. Atteso: la schermata mostra i MB liberati (0 è normale).
12. *Facoltativo, avanzato:* imposta un **riavvio automatico** tra 3 minuti (vedi [05-salute-e-manutenzione.md](05-salute-e-manutenzione.md)) e metti la TV in standby. Atteso: la TV si riavvia e torna con l'app e il Debug di rete ancora attivi. Se il Debug di rete si è spento, scrivilo nella segnalazione.

## Segnala la tua TV

Dicci com'è andata, anche se tutto ha funzionato. Apri il modulo di segnalazione: [Segnalazione TV](https://github.com/MarcoCall96/GlassRemoteTv/issues/new?template=tv-report.yml).

Includi:

- **marca e modello** della TV;
- la **versione di Android** (Impostazioni > Preferenze dispositivo > Informazioni);
- il launcher / la schermata Home (per esempio Google TV o Android TV);
- **cosa ha funzionato** e **cosa no** (l'elenco qui sopra aiuta);
- uno **screenshot dello schermo della TV** se l'app mostra un errore.

Non pubblicare indirizzi IP, il PIN o altri dati personali. Le segnalazioni verranno aggiunte alla tabella qui sopra.
