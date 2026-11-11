# 2. Avviare il ricevitore

> English: [../02-run-the-receiver.md](../02-run-the-receiver.md)

Il ricevitore (`receiver/bridge.py`) è un piccolo programma Python. Fa due cose:

1. Parla con la tua TV con il protocollo **Android TV Remote v2** (TLS sulle porte TCP **6466** per i comandi e **6467** per l'abbinamento).
2. Serve l'app (`docs/`) al telefono sul Wi-Fi di casa e inoltra i comandi con un WebSocket.

Serve un computer che resti acceso mentre usi il telecomando: PC, Mac, mini PC, Linux o Raspberry Pi. Deve stare nella **stessa rete** di TV e telefono. (Una futura app Android per la TV eliminerà questo requisito, vedi [06-app-android-tv-roadmap.md](06-app-android-tv-roadmap.md).)

## Requisiti

- Python **3.10 o successivo** ([python.org/downloads](https://www.python.org/downloads/)). Su Windows spunta *Add Python to PATH* durante l'installazione.
- Una Android TV / Google TV nella stessa rete ([03-tv-compatibili.md](03-tv-compatibili.md)).
- Circa 50 MB di spazio. Il ricevitore pesa poco su CPU e memoria.

## Modo più semplice

- **Windows:** doppio clic su `receiver/start.bat`.
- **macOS / Linux:** esegui `./start.sh` nella cartella `receiver` (la prima volta: `chmod +x start.sh`).

Al primo avvio crea un ambiente virtuale e installa le tre dipendenze. Gli avvii successivi sono immediati.

## Modo manuale

```bash
cd receiver
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
python bridge.py --lan
```

Su macOS / Linux usa `python3` al posto di `python` se serve.

## Opzioni

| Opzione | Significato |
|---|---|
| `--lan` | Accetta connessioni da altri dispositivi della rete di casa (serve al telefono). **Senza, il ricevitore risponde solo sul computer stesso.** |
| `--port 8780` | Porta da usare (predefinita 8780). Cambiala se è occupata. |
| `--host IP` | IP della TV predefinita, facoltativo. L'app trova le TV da sola. |

## Cosa viene salvato

Al primo avvio nasce `receiver/bridge-data/`:

- `cert.pem` e `key.pem`: l'identità di cui la TV si fida dopo l'abbinamento. **Chi ha questi file può comandare la tua TV. Non condividerli e non committarli** (sono nel `.gitignore`).
- `scenes.json`: le tue scene.

Per abbinare da zero (per esempio dopo un ripristino della TV) elimina `bridge-data/` e riavvia.

## Firewall e rete

- La prima volta Windows può chiedere di consentire Python in rete. Consenti **solo le reti private**.
- Windows deve vedere il Wi-Fi come rete **Privata**. Una rete **Pubblica** blocca le connessioni in entrata e il telefono non raggiunge il ricevitore.
- Su un computer aziendale o scolastico potresti non avere il permesso di cambiarlo. Usa il tuo computer.
- Telefono e computer devono stare sullo stesso Wi-Fi. Le reti "ospiti" e alcune impostazioni dei router isolano i dispositivi (*client isolation / AP isolation*): disattivale.

## Tenerlo acceso

- Avvialo quando vuoi usare il telecomando e chiudi la finestra quando hai finito.
- Per l'avvio automatico: Utilità di pianificazione di Windows (*All'accesso*, esegui `start.bat`) oppure un servizio systemd su Linux / Raspberry Pi.

## Verificare che funzioni

Sul computer apri `http://localhost:8780/` (vedi l'app). Apri `http://localhost:8780/api/discover` per vedere in JSON le TV trovate nella rete.
