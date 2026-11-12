<div align="center">

<img src="docs/assets/icon-192.png" width="120" alt="Icona GlassRemote" />

# GlassRemote

**Il telecomando per la tua Android TV: gratis, senza pubblicità, senza account.**
**Niente limiti, niente blocchi, niente tracciamento.**

[Demo online](https://marcocall96.github.io/GlassRemoteTv/) · [Installa su iPhone / Android](guide/it/01-installare-sul-telefono.md) · [English](README.md)

![license](https://img.shields.io/badge/license-MIT-blue) ![ads](https://img.shields.io/badge/ads-none-brightgreen) ![PWA](https://img.shields.io/badge/PWA-iPhone%20%2B%20Android-black) ![dependencies](https://img.shields.io/badge/frontend%20dependencies-0-orange)

</div>

<p align="center"><img src="docs/assets/screenshots/preview.png" alt="Anteprima di GlassRemote: TV, telecomando e app" width="900" /></p>

---

## Perché

Le app telecomando sono piene di pubblicità, limitazioni e si bloccano sul più bello.
GlassRemote è una web app (PWA) piccola, veloce e open source, in stile **Liquid Glass**, pensata per iPhone 16 Pro e perfetta anche su Android.

- Nessuna pubblicità, nessun account, nessuna analisi dei dati
- Si installa come una vera app (Aggiungi a Home), senza App Store
- Solo HTML, CSS e JavaScript, nessuna libreria esterna

## Funzioni

Frecce, touchpad, tastierino numerico, tastiera con dettatura e incolla, app con icone ufficiali, **scene** (app + volume + timer in un tocco), **timer di spegnimento**, più TV con preferite, ricerca automatica delle TV, **Siri e Comandi Rapidi**, modalità a una mano, interfaccia che si apre anche senza connessione, **6 lingue** (Italiano, English, Español, Français, Deutsch, Português) da scegliere in Impostazioni.

## Come funziona (onestamente)

Una pagina web non può parlare direttamente con la TV. Serve un piccolo **ricevitore** tra telefono e TV, che puoi far girare in due modi:

```
 A) Sulla TV stessa (senza computer)
 [ Telefono: app ]  --Wi-Fi-->  [ GlassRemoteTv, installata sulla TV ]  --ADB locale-->  [ la stessa TV ]
    docs/ (PWA)                  tv-app/ (Android, Java puro)

 B) Su un computer
 [ Telefono: app ]  --Wi-Fi-->  [ Ricevitore ]  --Android TV Remote v2-->  [ TV ]
    docs/ (PWA)                  receiver/ (Python)                          porte 6466 / 6467
```

1. **L'app** (`docs/`): l'interfaccia. Su GitHub Pages funziona solo come **dimostrazione**, con una TV di prova.
2. **GlassRemoteTv** (`tv-app/`): un'app Android da installare sulla TV. Passa l'app al telefono e manda i tasti alla TV. Sullo schermo della TV mostra un **codice QR**: lo inquadri e l'app si apre sul telefono.
3. **Il ricevitore** (`receiver/`): l'alternativa, un piccolo programma Python per un computer di casa.

> La demo online non comanda nessuna TV. Per comandarla apri l'app **dalla TV** (`http://<IP-della-TV>:<porta>`, oppure inquadra il QR sullo schermo della TV) o dal ricevitore.

## Avvio rapido con l'app TV (5 minuti, senza computer)

Servono: una **Android TV / Google TV** sul Wi-Fi di casa e un telefono (iPhone o Android) sullo stesso Wi-Fi.

> La versione pronta da installare sta nella cartella [`AppTv/`](AppTv/README.it.md) di questo repository: l'APK firmata (`AppTv/release/`), la somma di controllo, le guide di installazione passo passo e le istruzioni per un assistente AI. Il resto del repository contiene l'app web, la demo, il ricevitore per computer e i sorgenti dell'app TV.

1. Scarica **GlassRemoteTv-x.y.z.apk** dalla pagina [Releases](https://github.com/MarcoCall96/GlassRemoteTv/releases) (lo stesso file e il suo `SHA256SUMS.txt` sono in [AppTv/release/](AppTv/release/)) e installala sulla TV (per esempio con l'app *Downloader* o con `adb install`). Passo passo: [AppTv/guide/it/01-installare-sulla-tua-tv.md](AppTv/guide/it/01-installare-sulla-tua-tv.md).
2. Sulla TV attiva il **debug di rete**: Impostazioni > Preferenze dispositivo > Informazioni > tocca sette volte **Build** > indietro > Opzioni sviluppatore (passi completi nella guida del punto 1). Apri **GlassRemoteTv** dalle app della TV. Quando la TV chiede *Consentire il debug USB?*, spunta **Consenti sempre da questo computer**, poi premi **Consenti**.
3. La TV mostra un **codice QR** e un **PIN**. Inquadra il codice con la fotocamera del telefono: l'app si apre e si sblocca da sola.
4. **iPhone:** Safari, Condividi, **Aggiungi alla schermata Home** (nell'app installata scrivi il PIN una volta). **Android:** menu di Chrome, **Installa app**.

> Perché il debug di rete? È l'unico modo con cui un'app normale può premere i tasti del telecomando su una Android TV (il servizio ufficiale rifiuta le richieste che arrivano dalla TV stessa). Il PIN impedisce ad altri nella tua Wi-Fi di usarlo. Leggi prima [guide/it/07-sicurezza.md](guide/it/07-sicurezza.md).

## Avvio rapido con un ricevitore su computer (alternativa)

Servono: un computer sul tuo Wi-Fi di casa con [Python 3.10+](https://www.python.org/downloads/) e una **Android TV / Google TV** sulla stessa rete.

```bash
git clone https://github.com/MarcoCall96/GlassRemoteTv.git
cd GlassRemoteTv/receiver
python -m venv venv
# Windows:  venv\Scripts\activate        macOS / Linux:  source venv/bin/activate
pip install -r requirements.txt
python bridge.py --lan
```

Il programma stampa un indirizzo tipo `http://192.168.x.x:<porta>/` (ogni installazione usa una propria porta casuale).

1. Dal telefono (stesso Wi-Fi) apri quell'indirizzo. **iPhone:** Safari, poi Condividi, poi **Aggiungi alla schermata Home**. **Android:** Chrome, poi menu, poi **Installa app / Aggiungi a schermata Home**.
2. Nell'app tocca **+** oppure **Cerca TV sulla rete** e scegli la TV.
3. Sulla TV compare un **codice di 6 caratteri**: scrivilo nell'app (**Abbina**). Fatto, si abbina una volta sola.

> L'app parla **6 lingue** (Italiano, English, Español, Français, Deutsch, Português). Per impostazione predefinita segue il telefono; cambiala in **Impostazioni, Lingua**.

Guide: [installazione sul telefono](guide/it/01-installare-sul-telefono.md) · [ricevitore](guide/it/02-avviare-il-ricevitore.md) · [problemi comuni](guide/it/04-problemi-comuni.md)

## Quali TV funzionano?

Tutte le TV con **Android TV o Google TV** (Sony, Philips, TCL, Hisense, Xiaomi, Panasonic, Sharp, Nvidia Shield, Chromecast con Google TV...).
Samsung (Tizen), LG (webOS), Roku e Fire TV **non sono ancora supportate**. Elenco completo: [guide/it/03-tv-compatibili.md](guide/it/03-tv-compatibili.md).

## Fatti aiutare da un assistente AI

Nel repository ci sono [`CLAUDE.it.md`](CLAUDE.it.md) (e la versione inglese [`CLAUDE.md`](CLAUDE.md)) più [`AGENTS.md`](AGENTS.md): istruzioni complete per un assistente AI (Claude, Copilot, Codex...).
Apri la cartella con il tuo assistente e scrivi: **"Configura GlassRemote per me."** Ti guida passo passo nella tua lingua.

## Sicurezza

Tutto resta nella tua rete di casa. L'app TV e il ricevitore rispondono solo a dispositivi della rete locale, e l'app TV chiede un **PIN** (mostrato sulla TV) una volta per telefono: senza il PIN nessuno può comandare la TV. **Non aprire mai porte sul router per questo** e non esporlo mai a internet. L'app TV richiede il debug di rete: puoi spegnerlo quando vuoi e *Revoca autorizzazioni debug USB* toglie ogni dispositivo autorizzato. Chiave e certificato di abbinamento del ricevitore restano in `receiver/bridge-data/` (escluso da git). Dettagli: [guide/it/07-sicurezza.md](guide/it/07-sicurezza.md).

## Contribuire

Aiuto benvenuto su:

- l'**app TV**: più marche di TV, una schermata di primo avvio più curata, riattivazione dallo standby
- il supporto per **Samsung, LG, Roku, Fire TV**
- nuove **lingue** e traduzioni migliori
- prove su più TV e telefoni

Vedi [CONTRIBUTING.it.md](CONTRIBUTING.it.md). Se ti è utile, **metti una stella** così altri possono trovarlo.

## Crediti e marchi

Costruito su [androidtvremote2](https://github.com/tronikos/androidtvremote2) (Apache-2.0), [aiohttp](https://github.com/aio-libs/aiohttp) e [segno](https://github.com/heuer/segno). I loghi dei marchi vengono da [Simple Icons](https://simpleicons.org/).
Nomi, loghi e icone delle app sono marchi dei rispettivi proprietari, usati solo per riconoscere le app sulla TV. Il progetto non è affiliato a nessun marchio di TV o streaming.

## Licenza

[MIT](LICENSE)
