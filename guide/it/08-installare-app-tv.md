# 8. Installare l'app TV (senza computer)

> English: [../08-install-tv-app.md](../08-install-tv-app.md)

La guida completa, passo passo, per installare l'app GlassRemoteTv sulla tua Android TV / Google TV è in [AppTv/guide/it/01-installare-sulla-tua-tv.md](../../AppTv/guide/it/01-installare-sulla-tua-tv.md). In breve:

1. **Procurati l'APK** (metodi chiavetta USB e adb) dalla [pagina Releases](https://github.com/MarcoCall96/GlassRemoteTv/releases) (o da [AppTv/release/](../../AppTv/release/)) e controlla la somma di controllo. Con l'app Downloader in questo passo non si scarica nulla: la TV scarica il file via HTTPS al passo 2 e il controllo dell'hash sulla TV viene saltato (un assistente AI può confrontare il file nel repository con `SHA256SUMS.txt` al posto tuo).
2. **Installalo sulla TV** con l'app Downloader, una chiavetta USB o adb.
3. **Attiva il debug di rete** nelle Opzioni sviluppatore della TV (leggi prima [AppTv/guide/it/02-sicurezza.md](../../AppTv/guide/it/02-sicurezza.md)).
4. **Apri l'app sulla TV**, spunta *Consenti sempre da questo computer* e premi *Consenti* una volta, poi inquadra il codice QR con il telefono (tieni l'app aperta sulla TV: il PIN è mostrato lì).

Tutto sulla release per la TV (sicurezza, problemi comuni, compilarla da te) è in [AppTv/README.it.md](../../AppTv/README.it.md).

Novità dell'app TV 0.5.0: tasti molto più veloci, una scheda **Apri un link sulla TV**, il Cruscotto TV (CPU, memoria, processi), un pulsante "Pulisci la cache" e un riavvio automatico facoltativo, vedi [AppTv/guide/it/05-salute-e-manutenzione.md](../../AppTv/guide/it/05-salute-e-manutenzione.md).
