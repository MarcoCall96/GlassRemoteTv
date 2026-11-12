# 3. TV compatibili

> English: [../03-compatible-tvs.md](../03-compatible-tvs.md)

## Funzionano oggi

Qualsiasi TV o box con **Android TV** o **Google TV** che espone il **servizio Android TV Remote** (lo stesso usato dall'app ufficiale Google TV sul telefono). Il ricevitore la riconosce cercando la **porta TCP 6466** sulla TV.

Marchi e modelli tipici:

| Marchio | Note |
|---|---|
| Sony Bravia (Google TV / Android TV) | Funziona |
| Philips / TP Vision (Android TV, Google TV) | Funziona. Non i modelli con Titan OS o Saphi. |
| TCL, Hisense (modelli Google TV / Android TV) | Funziona. Non i modelli Roku TV, VIDAA o Fire TV. |
| Xiaomi / Mi TV, Redmi TV (Android TV / Google TV) | Funziona |
| Panasonic (modelli Android TV) | Funziona. Non i modelli My Home Screen / Firefox OS / Fire TV. |
| Sharp, Toshiba, JVC, Hitachi, Telefunken e altre TV Android TV | Funziona se hanno Android TV o Google TV |
| NVIDIA Shield TV | Funziona |
| Chromecast con Google TV | Funziona |
| Google TV Streamer, Xiaomi TV Box, Mecool e altri box Android TV | Funziona |

**Regola pratica:** se l'app ufficiale **Google TV** sul telefono comanda la TV, la comanda anche GlassRemote. Se nelle Impostazioni della TV leggi *Android TV* o *Google TV*, quasi certamente va bene.

## Non ancora supportate

| Piattaforma | Marchi | Perché / come aiutare |
|---|---|---|
| Tizen | Samsung | Usa un'altra API WebSocket (porta 8001/8002). Le pull request sono benvenute. |
| webOS | LG | Usa l'API WebSocket SSAP (porta 3000/3001). Le pull request sono benvenute. |
| Roku OS | Roku, TV Roku di TCL/Hisense | API HTTP "ECP" sulla porta 8060: semplice da aggiungere. |
| Fire OS | Amazon Fire TV, TV Fire TV Edition | Usa ADB. |
| Apple tvOS | Apple TV | Protocollo diverso (Companion / MRP). |

Il ricevitore riconosce già Samsung, LG e Roku durante la ricerca e le segnala come **non ancora supportate**, così l'utente vede un messaggio chiaro invece di un errore misterioso.

## Cosa deve permettere la TV

- Deve stare **nella stessa rete** del ricevitore. Meglio se in standby con la rete attiva.
- Il servizio remoto deve essere raggiungibile: su alcune TV si chiama *Controllo remoto da dispositivo mobile*, *Google Cast* o *Standby di rete* e si attiva nelle Impostazioni. La schermata di abbinamento la mostra la TV stessa.
- **Riaccensione dallo standby:** dipende dalla TV. Alcune si riaccendono con un pacchetto di rete (Wake-on-LAN), altre con il tasto di accensione, altre solo dal telecomando fisico. Se la tua non si riaccende, attiva *Standby di rete / Wake on Wi-Fi / Wake on LAN* nelle impostazioni della TV.

## Provate

Il progetto è stato sviluppato e provato su una TV Panasonic con Android TV (Android 10). **Prova la tua e apri una issue** con marchio, modello, versione di Android TV e cosa ha funzionato: accensione, volume, apertura app, tastiera, dettatura. L'elenco crescerà qui. Per l'app TV vedi [TV testate](../../AppTv/guide/it/06-tv-testate.md).
