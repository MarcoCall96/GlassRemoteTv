# 5. Salute e manutenzione della TV

> English: [../05-health-and-maintenance.md](../05-health-and-maintenance.md) · Torna al [README](../../README.it.md)

Novità dell'app TV 0.5.0 (app web 0.8.1). Questa guida spiega come aprire un link sulla TV, leggere il **Cruscotto TV**, pulire la cache e impostare un riavvio automatico.

Queste funzioni esistono **solo nell'app TV**. Con il ricevitore per computer la schermata non compare. La demo pubblica mostra dati simulati con l'etichetta **Dati demo**.

## Tasti più veloci

Non devi fare nulla. L'app TV avvia un piccolo aiutante quando un telefono si collega, e i tasti arrivano alla TV in circa 10 ms invece di circa 1 secondo. Il primo tasto dopo una lunga pausa (10 minuti senza tasti) può richiedere circa 1 secondo, mentre l'aiutante riparte. Se l'aiutante non riesce ad avviarsi, il telecomando continua a funzionare con il vecchio metodo. Dettagli: [02-sicurezza.md](02-sicurezza.md) e [03-problemi-comuni.md](03-problemi-comuni.md).

## Apri un link sulla TV

Nella schermata **App** dell'app sul telefono c'è la scheda **Apri un link sulla TV**.

1. Incolla o scrivi un link di YouTube o del web. Un link senza `http(s)://` ma con un punto, come `youtu.be/abc`, riceve da solo `https://`. Il pulsante facoltativo **Incolla** legge gli appunti (iOS può chiederti il permesso di incollare).
2. Tocca **Apri sulla TV** (oppure premi Invio). Gli ultimi 3 link compaiono come etichette sotto il campo, così puoi inviarli di nuovo.
3. La TV si sveglia da sola dallo standby (circa 2,5 secondi) e apre il link nell'app che lo gestisce. Un link di YouTube apre l'app YouTube, se è installata sulla TV. Provato su una TV vera: dalla schermata Home il link ha aperto l'app YouTube per TV.

Da sapere:

- Sono accettati solo link `http`/`https` con un host (niente `file:`, `content:`, `intent:`, `market:`, `javascript:`). Altrimenti l'app dice "Questo non è un link web".
- **Apre link**. Non fa il "cast" di foto o video dal telefono, e non puoi inviare file.
- I link di Netflix, Prime Video o Disney+ si aprono solo se l'app della TV gestisce quel link web.
- La scheda compare solo con l'app TV, non con il ricevitore per computer. La demo pubblica la simula.
- Tecnico: `POST /api/open-link` con `{"url":"..."}`, dietro il token. Risponde 200 `{"ok":true}`, 400 `invalid_link`, 405 se la richiesta non è POST, 401 senza token e 503 se la TV non è raggiungibile.

Se il link non apre nulla, vedi [03-problemi-comuni.md](03-problemi-comuni.md).

## Il Cruscotto TV

Apri l'app sul telefono, poi **Impostazioni > Cruscotto TV**. Se non lo vedi, l'app TV è troppo vecchia oppure stai usando il ricevitore per computer (vedi [03-problemi-comuni.md](03-problemi-comuni.md)).

Finché la schermata è aperta (e la pagina è visibile) il telefono chiede alla TV dati freschi ogni 3 secondi. Quando la chiudi, le richieste si fermano.

### Scheda Prestazioni

- **Un giudizio in parole semplici** in alto: *Tutto a posto*, *Da tenere d'occhio* o *La TV è in difficoltà*, con un breve motivo.
- **CPU:** un grafico degli ultimi 6 minuti, una barra per ogni core, e frequenza e temperatura quando la TV li fornisce.
- **Memoria:** un grafico di RAM e swap degli ultimi 6 minuti, con usata, disponibile e cache.
- **Tocca la scheda CPU o Memoria** per vedere **cosa** la sta usando. Prima le app (i processi di una stessa app sono raggruppati e hanno nomi leggibili), poi **Sistema Android**. Tocca un'app per vederne i processi. Le righe inattive sono nascoste; usa l'interruttore per mostrarle.

### Scheda Processi

Un elenco di processi che puoi ordinare (nome, PID, CPU, memoria, utente) e cercare.

### Come viene deciso il giudizio

| Giudizio | Quando |
|---|---|
| La TV è in difficoltà | CPU sopra il 70%, oppure RAM disponibile sotto 150 MB, oppure swap sopra l'85% |
| Da tenere d'occhio | CPU sopra il 40%, oppure swap sopra il 55%, oppure RAM disponibile sotto 300 MB, oppure TV accesa da più di 14 giorni |
| Tutto a posto | nessuna delle precedenti |

### Cosa significano i numeri

- **CPU:** i core mostrano la percentuale totale. I processi mostrano la percentuale di **un solo** core, quindi un processo può superare il 100% su una TV con più core.
- **Memoria:** *usata* è ciò che tengono le app, *disponibile* è ciò che la TV può ancora dare, *cache* è memoria che si può liberare al bisogno. Lo **swap** è memoria di riserva sull'archiviazione: quando si riempie la TV diventa lenta.
- **La memoria condivisa viene conteggiata più volte**, quindi la somma delle app può superare il totale.
- Il comando `top` di Android dà **valori a scalini grossolani** (circa 3%), quindi i valori piccoli saltano.
- **Fare la misura aggiunge un po' di carico** mentre la schermata è aperta, quindi la TV sembra un po' più impegnata di quando non la guardi.
- Una TV quasi sempre a riposo mostra numeri molto bassi. Apri un'app per vederla al lavoro.

## Pulisci la cache

Nel Cruscotto TV, **Manutenzione > Pulisci la cache**, poi conferma. La TV esegue `pm trim-caches`: elimina i **file temporanei** delle app. Non cancella mai dati o accessi. Dopo, le app possono aprirsi un po' più lentamente la prima volta. La schermata mostra quanti MB sono stati liberati ("0 MB" o "già pulita" è normale). Si può fare al massimo una volta ogni 10 secondi.

## Riavvio automatico

Un riavvio ogni tanto mantiene veloce una Android TV. È **spento di default**.

In **Cruscotto TV > Manutenzione > Riavvio automatico** accendilo e scegli:

- **Ogni giorno**, **Ogni settimana** (da lunedì a domenica) o **Ogni mese** (giorno da 1 a 28);
- l'**ora**. Gli orari sono quelli del **fuso orario della TV**. L'app mostra un avviso se il telefono è in un altro fuso.

La schermata mostra l'ultimo e il prossimo riavvio.

### Le regole (per sicurezza)

- La TV si riavvia **solo quando è in standby** (in sospensione). Se a quell'ora è accesa, riprova ogni 30 minuti per un massimo di 6 ore, poi passa alla scadenza successiva. Scegli un'ora in cui nessuno guarda, per esempio a notte fonda.
- Mai due volte in 12 ore, e non entro 10 minuti dall'avvio.
- Un orologio sbagliato o che salta non può causare una serie di riavvii.
- Le impostazioni sono salvate nei file privati dell'app (`maintenance.txt`) e vengono salvate prima di essere applicate.

### Dopo un riavvio

Nella prova la TV è tornata in circa 95 secondi e l'app TV si è riavviata da sola (tramite il ricevitore di avvio). L'app TV, l'impostazione **Debug di rete** e l'approvazione *Consenti sempre* sono sopravvissute al riavvio.

**Alcuni modelli di TV possono spegnere il Debug di rete dopo un riavvio.** In quel caso il telecomando smette di funzionare finché non lo riaccendi (Impostazioni, Preferenze dispositivo, Opzioni sviluppatore). Quindi **dopo aver impostato un orario, prova il primo riavvio**: scegli un'ora tra pochi minuti con la TV in standby, aspetta e controlla che il telecomando funzioni. Se non funziona, spegni il calendario per quella TV.

## Note di sicurezza

- Tutto passa dall'app TV e richiede un telefono già collegato (il PIN una volta). I nuovi comandi sono di sola lettura (salute) o limitati (cache, calendario del riavvio); nessuno può eseguire comandi arbitrari. Vedi [02-sicurezza.md](02-sicurezza.md).
- Il pulsante cache non tocca mai dati o accessi.
- Non usare il riavvio automatico su una TV che non puoi raggiungere per riaccendere il Debug di rete, a meno che tu non l'abbia provato.

## Note tecniche

I dati di salute arrivano da `GET /api/stats` (sola lettura; un solo comando ADB che legge `/proc/stat`, `/proc/meminfo`, `loadavg`, `uptime`, `top` e `ps`). La TV riusa una lettura più recente di 2 secondi. Gli altri endpoint: `POST /api/clean-cache`, `GET`/`PUT /api/maintenance` e `POST /api/open-link`. Tutti sono dietro il token. Per i file del sorgente e le costanti vedi [04-compilare-dal-sorgente.md](04-compilare-dal-sorgente.md).
