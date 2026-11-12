# 2. Run the receiver

> Italiano: [it/02-avviare-il-ricevitore.md](it/02-avviare-il-ricevitore.md)

The receiver (`receiver/bridge.py`) is a small Python program. It does two things:

1. Talks to your TV with the **Android TV Remote v2** protocol (TLS on TCP ports **6466** for commands and **6467** for pairing).
2. Serves the app (`docs/`) to your phone over your home Wi-Fi and relays commands through a WebSocket.

You need a computer that stays on while you use the remote: a PC, a Mac, a mini PC, a Linux box or a Raspberry Pi. It must be on the **same network** as the TV and the phone. (If you have an Android TV, you do not need a computer: see [08-install-tv-app.md](08-install-tv-app.md).)

## Requirements

- Python **3.10 or newer** ([python.org/downloads](https://www.python.org/downloads/)). On Windows, tick *Add Python to PATH* when installing.
- An Android TV / Google TV on the same network ([03-compatible-tvs.md](03-compatible-tvs.md)).
- About 50 MB of disk space. The receiver is light on CPU and memory.

## Easiest way

- **Windows:** double-click `receiver/start.bat`.
- **macOS / Linux:** run `./start.sh` in the `receiver` folder (first time: `chmod +x start.sh`).

The first start creates a virtual environment and installs the three dependencies. Later starts are instant.

## Manual way

```bash
cd receiver
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
python bridge.py --lan
```

Use `python3` instead of `python` on macOS / Linux if needed.

## Options

| Option | Meaning |
|---|---|
| `--lan` | Accept connections from other devices on your home network (needed for the phone). **Without it the receiver only answers on the computer itself.** |
| `--port <n>` | Force a specific port. Without it the receiver picks a random port the first time and remembers it in `receiver/bridge-data/port.txt`. |
| `--host IP` | Default TV address, optional. The app finds TVs by itself. |

## What gets stored

`receiver/bridge-data/` is created on first start:

- `cert.pem` and `key.pem`: the identity the TV trusts after pairing. **Anyone who has these files can control your TV. Never share or commit them** (they are in `.gitignore`).
- `port.txt`: the port the receiver chose for this installation.
- `scenes.json`: your scenes.

To pair again from scratch (for example after a factory reset of the TV), delete `bridge-data/` and restart.

## Firewall and network

- The first time, Windows may ask to allow Python on the network. Allow **private networks only**.
- Windows must see your Wi-Fi as a **Private** network. A network marked **Public** blocks incoming connections, and the phone cannot reach the receiver.
- On a corporate or school computer, you may not have permission to change this. Use your own computer.
- The phone and the computer must be on the same Wi-Fi. "Guest" networks and some mesh settings isolate devices (*client isolation / AP isolation*): turn that off.

## Keep it running

- Start it when you want to use the remote, and close the window when done.
- To start it automatically: Windows Task Scheduler (*At log on*, run `start.bat`) or a systemd service on Linux / a Raspberry Pi.

## Check it works

On the computer open `http://localhost:<port>/` (you see the app; use the port printed by the receiver). Open `http://localhost:<port>/api/discover` to see the TVs it finds on your network as JSON.
