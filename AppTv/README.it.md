# AppTv: GlassRemoteTv per la tua Android TV

**Un telecomando gratuito e senza pubblicità per la tua Android TV / Google TV. Gira sulla TV stessa, quindi non serve un computer.**

[English](README.md) · [Guida all'installazione](guide/it/01-installare-sulla-tua-tv.md) · [Sicurezza](guide/it/02-sicurezza.md) · [Problemi comuni](guide/it/03-problemi-comuni.md) · [Compilare dal sorgente](guide/it/04-compilare-dal-sorgente.md)

![license](https://img.shields.io/badge/license-MIT-blue) ![ads](https://img.shields.io/badge/ads-none-brightgreen) ![account](https://img.shields.io/badge/account-none-brightgreen)

---

## Che cos'è

GlassRemoteTv è una piccola app Android che installi sulla **tua** Android TV o Google TV. Fa due cose:

1. Serve sulla tua rete di casa l'app per telefono **GlassRemote** (iPhone e Android, design Liquid Glass).
2. Preme per te i tasti del telecomando della TV, tramite ADB sull'indirizzo loopback della TV stessa. La TV parla con sé stessa.

Per questo non ti serve un computer, un hub o un secondo dispositivo da tenere acceso.

## Perché

- Niente pubblicità.
- Niente account.
- Niente tracciamento. Nessun dato esce dalla tua rete di casa: non c'è un server e non ci sono statistiche.
- Nessun computer da lasciare acceso.
- Java semplice, senza librerie. Tutto il sorgente è in questo repository, in [tv-app/](../tv-app/).

## Installa in 5 minuti

Ti servono una Android TV / Google TV e un iPhone o un telefono Android, entrambi sullo stesso Wi-Fi di casa.

1. **Scarica** `GlassRemoteTv-0.4.0.apk` dalla [pagina Releases](https://github.com/MarcoCall96/GlassRemoteTv/releases). Lo stesso file è anche nel repository come [release/GlassRemoteTv-0.4.0.apk](release/GlassRemoteTv-0.4.0.apk), con la sua [somma di controllo](release/SHA256SUMS.txt). (Con l'app Downloader ora non scarichi nulla: è la TV a scaricare il file da sola al passo 2.)
2. **Installalo sulla TV.** Il modo più facile: l'app *Downloader* sulla TV e il link diretto all'APK. Gli altri modi (chiavetta USB, adb) sono nella [guida all'installazione](guide/it/01-installare-sulla-tua-tv.md).
3. **Attiva il debug di rete** sulla TV: Impostazioni > Preferenze dispositivo > Informazioni > tocca sette volte *Build* > indietro > Opzioni sviluppatore, poi *Debug USB* e *Debug di rete*.
4. **Apri GlassRemoteTv** dalle app della TV. Quando la TV chiede *Consentire il debug USB?*, spunta *Consenti sempre da questo computer*, poi premi *Consenti*. Lo fai una volta sola. Tieni l'app aperta sulla TV: il PIN di 6 cifre è mostrato lì.
5. **Inquadra il codice QR** sullo schermo della TV con la fotocamera del telefono (su iPhone tocca il banner/link giallo che la Fotocamera mostra in alto). L'app si apre e ti fa entrare da sola. Se scrivi l'indirizzo a mano, scrivi una volta il PIN mostrato sulla TV.
6. **Aggiungila alla schermata Home.** iPhone: Safari, Condividi, *Aggiungi alla schermata Home* (scrivi il PIN ancora una volta nell'app installata). Android: menu di Chrome, *Installa app*.

Se la primissima volta su iPhone il layout sembra troppo corto, chiudi l'app dal selettore delle app e riaprila.

Per impostazione predefinita la TV ricorda fino a 30 telefoni e ne tiene collegati fino a 24 alla volta, più che sufficiente per una famiglia. Per cambiare questi limiti vedi [Limiti che puoi cambiare](guide/it/04-compilare-dal-sorgente.md#limiti-che-puoi-cambiare).

Facoltativo: puoi mettere l'app anche nella riga dei preferiti della Home della TV, vedi [guide/it/01-installare-sulla-tua-tv.md](guide/it/01-installare-sulla-tua-tv.md#metti-lapp-nella-home-della-tv-facoltativo).

Tutti i passi, con un controllo dopo ognuno: [guide/it/01-installare-sulla-tua-tv.md](guide/it/01-installare-sulla-tua-tv.md).

## La sicurezza in breve

Leggi una volta [guide/it/02-sicurezza.md](guide/it/02-sicurezza.md). In breve:

- **Il debug di rete deve essere ATTIVO.** È l'unico modo in cui una normale app può premere i tasti del telecomando. Con il debug acceso, qualunque computer sul tuo Wi-Fi che approvi sullo schermo della TV ottiene un controllo profondo (a livello di shell) della TV. Non approvare richieste che non riconosci.
- **Un PIN e una porta casuale proteggono l'app.** Ogni installazione sceglie la sua porta. Ogni telefono entra una volta con il PIN e conserva un lungo token casuale. 5 tentativi sbagliati bloccano quell'indirizzo per un minuto (di più a ogni giro, fino a 15 minuti).
- **Si collega solo la tua rete di casa.** I dispositivi con indirizzi pubblici vengono rifiutati.
- **Il traffico è HTTP semplice, non cifrato.** Non usarla su un Wi-Fi di cui non ti fidi. Un ospite può usare la TV solo se vede il PIN o il QR sullo schermo della TV.
- **Non aprire mai una porta sul router.**
- **Puoi spegnere tutto quando vuoi:** disattiva Debug di rete e Debug USB. Il telecomando smette di funzionare finché non li riattivi.

## Quali TV funzionano

Android TV e Google TV, Android 5 o successivo (provata su Android 10). Non supportate: Samsung (Tizen), LG (webOS), Roku, Fire TV, Apple TV.

L'app parla Italiano, English, Español, Français, Deutsch e Português.

## Verifica il download

L'APK è firmato con la chiave del responsabile del progetto (soggetto del certificato `CN=GlassRemoteTv`). Controlla la somma di controllo con [release/SHA256SUMS.txt](release/SHA256SUMS.txt):

```powershell
Get-FileHash -Algorithm SHA256 GlassRemoteTv-0.4.0.apk
```

```bash
shasum -a 256 GlassRemoteTv-0.4.0.apk
```

SHA-256 atteso dell'APK 0.4.0:

```
e1425c164a22f62f366f44c15b9afe9dbfb29e4530ee5c070bca1d50a5457963
```

Se hai le build-tools di Android, puoi controllare anche la firma:

```
apksigner verify --print-certs GlassRemoteTv-0.4.0.apk
```

Lo SHA-256 del certificato di firma deve essere:

```
62:38:B1:A8:AB:67:23:29:2A:25:60:C9:23:48:8C:82:05:B6:98:1E:61:5F:77:4C:2B:65:44:92:DF:6D:57:07
```

Se compili tu l'app, il tuo APK è firmato con la tua chiave, quindi l'impronta è diversa. Vedi [guide/it/04-compilare-dal-sorgente.md](guide/it/04-compilare-dal-sorgente.md).

## Cosa c'è in questo repository

GlassRemoteTv è un unico repository. Questa cartella `AppTv/` contiene la release della TV pronta da installare e le sue guide. Il resto del repository contiene l'app web per telefono (`docs/`), il ricevitore facoltativo per computer (`receiver/`) e il sorgente dell'app TV (`tv-app/`).

| Cartella o file | Contenuto |
|---|---|
| [release/](release/) | L'APK firmato e `SHA256SUMS.txt` |
| [guide/](guide/it/01-installare-sulla-tua-tv.md) | Guide passo passo (inglese) e `guide/it/` (italiano) |
| `CLAUDE.md`, `AGENTS.md` | Istruzioni per un assistente AI di programmazione che ti aiuta a installarla |
| [../tv-app/](../tv-app/) | L'app Java, lo script di compilazione e i test. Include nell'APK l'app web per telefono presa da `docs/` |
| [../docs/](../docs/) | L'app web per telefono (fonte di verità) e la sua demo |
| [../receiver/](../receiver/) | Il ricevitore facoltativo per computer |
| [../SECURITY-AUDIT.md](../SECURITY-AUDIT.md) | Riepilogo dell'audit di sicurezza e di cosa è stato corretto |

## Fatti aiutare da un assistente AI

Apri la cartella `AppTv/` con un assistente AI di programmazione (Claude, Copilot, Codex) e scrivi: **"Aiutami a installare GlassRemoteTv sulla mia TV."** Segue [CLAUDE.it.md](CLAUDE.it.md), ti fa qualche domanda e ti guida passo passo, nella tua lingua. I passaggi sulla TV li fai sempre tu.

## Contribuire e segnalare problemi

Segnalazioni di bug e pull request sono benvenute. Per segnalare un problema di sicurezza apri un **security advisory privato** su GitHub (*Security*, *Report a vulnerability*), non una issue pubblica. Prima di incollare log o screenshot, togli gli indirizzi IP e ogni dato personale.

## Crediti e marchi

Fatta con Java semplice e gli strumenti da riga di comando dell'Android SDK. L'app web usa i loghi dei marchi di Simple Icons. Tutti i nomi di prodotto, i loghi e le icone delle app sono marchi dei rispettivi proprietari e servono solo a riconoscere le app sulla tua TV. Questo progetto non è affiliato né approvato da alcuna marca di TV o di streaming.

## Licenza

[MIT](../LICENSE)
