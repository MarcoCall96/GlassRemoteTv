"""GlassRemote receiver: connects the web app (WebSocket) to Android TV / Google TV sets.

Usage (from the receiver folder):
    python bridge.py --lan
Then, from the phone on the same Wi-Fi, open the address printed here (http://<computer-IP>:8780/).
The app lives in ../docs. The receiver stays on your home network: never open router ports.
"""
import argparse
import asyncio
import ipaddress
import json
import logging
import re
import socket
import time
from pathlib import Path

import aiohttp
from aiohttp import WSMsgType, web
from androidtvremote2 import AndroidTVRemote, CannotConnect, ConnectionClosed, InvalidAuth

BASE = Path(__file__).resolve().parent
DATA = BASE / "bridge-data"
APP_DIR = BASE.parent / "docs"
log = logging.getLogger("glassremote")

KEY_ALIASES = {"EXIT": "ESCAPE"}


class Tv:
    def __init__(self, host: str):
        self.host = host
        self.remote = AndroidTVRemote("GlassRemote", str(DATA / "cert.pem"), str(DATA / "key.pem"), host)
        self.enabled = False
        self.callbacks_added = False
        self.sleep_task: asyncio.Task | None = None
        self.sleep_at: float | None = None
        self.volume_task: asyncio.Task | None = None
        self.connected = False
        self.needs_pairing = False
        self.error = ""
        self.clients: set[web.WebSocketResponse] = set()
        self.lock = asyncio.Lock()
        self.task: asyncio.Task | None = None

    def state(self) -> dict:
        return {
            "type": "state",
            "host": self.host,
            "enabled": self.enabled,
            "tv_connected": self.connected,
            "needs_pairing": self.needs_pairing,
            "is_on": self.remote.is_on if self.connected else None,
            "current_app": self.remote.current_app if self.connected else None,
            "volume": self.remote.volume_info if self.connected else None,
            "sleep_at": self.sleep_at,
            "error": self.error,
        }

    async def broadcast(self, msg: dict | None = None):
        msg = msg or self.state()
        for ws in list(self.clients):
            try:
                await ws.send_json(msg)
            except ConnectionError:
                self.clients.discard(ws)

    def notify(self, *_):
        asyncio.get_running_loop().create_task(self.broadcast())

    async def connect_once(self):
        async with self.lock:
            if not self.enabled or self.connected:
                return
            try:
                await self.remote.async_connect()
            except InvalidAuth:
                self.connected = False
                self.error = ""
                if not self.needs_pairing:
                    await self.remote.async_start_pairing()
                    self.needs_pairing = True
                    log.info("%s: pairing started, read the code on the TV", self.host)
            except (CannotConnect, ConnectionClosed, OSError, asyncio.TimeoutError):
                self.connected = False
                self.error = "unreachable"
            else:
                self.connected = True
                self.needs_pairing = False
                self.error = ""
                if not self.callbacks_added:
                    self.remote.add_is_available_updated_callback(self.notify)
                    self.remote.add_is_on_updated_callback(self.notify)
                    self.remote.add_current_app_updated_callback(self.notify)
                    self.remote.add_volume_info_updated_callback(self.notify)
                    self.callbacks_added = True
                self.remote.keep_reconnecting(self.on_invalid_auth)
                log.info("%s: connected", self.host)
        await self.broadcast()

    def on_invalid_auth(self):
        self.connected = False
        self.needs_pairing = False
        self.notify()

    async def set_enabled(self, enabled: bool):
        if enabled == self.enabled:
            await self.broadcast()
            return
        self.enabled = enabled
        if enabled:
            await self.connect_once()
        else:
            self.remote.disconnect()
            self.connected = False
            self.needs_pairing = False
            self.error = ""
            log.info("%s: disconnected on request", self.host)
            await self.broadcast()

    async def supervise(self):
        await self.remote.async_generate_cert_if_missing()
        while True:
            if self.enabled and not self.connected and not self.needs_pairing:
                await self.connect_once()
            await asyncio.sleep(5)

    async def pair(self, code: str):
        async with self.lock:
            try:
                await self.remote.async_finish_pairing(code)
            except InvalidAuth:
                self.error = "wrong_code"
                await self.remote.async_start_pairing()
                await self.broadcast()
                return
            except (CannotConnect, ConnectionClosed, OSError, asyncio.TimeoutError):
                self.needs_pairing = False
                self.error = "pairing_expired"
                await self.broadcast()
                return
            self.needs_pairing = False
            self.error = ""
        await self.connect_once()

    async def set_volume(self, target: int):
        """Step the volume to the given level one key press at a time, stopping if the TV stops answering."""
        stalled = 0
        for _ in range(80):
            info = self.remote.volume_info
            if not self.connected or not info:
                return
            level = info["level"]
            target = max(0, min(int(info["max"]), target))
            if level == target:
                return
            self.remote.send_key_command("VOLUME_UP" if level < target else "VOLUME_DOWN")
            await asyncio.sleep(0.25)
            stalled = stalled + 1 if self.remote.volume_info and self.remote.volume_info["level"] == level else 0
            if stalled >= 3:
                return

    async def sleep_timer(self, minutes: int):
        """Put the TV in standby after N minutes; 0 cancels the timer."""
        if self.sleep_task:
            self.sleep_task.cancel()
            self.sleep_task = None
        self.sleep_at = None
        if minutes > 0:
            self.sleep_at = time.time() + minutes * 60
            self.sleep_task = asyncio.get_running_loop().create_task(self._sleep_after(minutes * 60))
            log.info("%s: sleep timer in %s min", self.host, minutes)
        await self.broadcast()

    async def _sleep_after(self, seconds: float):
        try:
            await asyncio.sleep(seconds)
        except asyncio.CancelledError:
            return
        self.sleep_at = None
        self.sleep_task = None
        if self.connected and self.remote.is_on:
            self.remote.send_key_command("POWER")
            log.info("%s: turned off by the timer", self.host)
        await self.broadcast()

    async def wait_connected(self, seconds: float = 8) -> bool:
        for _ in range(int(seconds * 4)):
            if self.connected:
                return True
            await asyncio.sleep(0.25)
        return self.connected

    async def wake(self) -> str:
        """Wake the TV: Wake-on-LAN packet (if the TV supports it), then the POWER key."""
        await self.set_enabled(True)
        if not self.connected:
            mac = (await mac_and_name(self.host))[1]
            if mac:
                send_magic_packet(mac)
            if not await self.wait_connected(10):
                return "TV unreachable: it may not support wake from the network"
        if self.remote.is_on is False:
            self.remote.send_key_command("POWER")
            return "Power on sent"
        return "The TV is already on"

    async def power_off(self) -> str:
        await self.set_enabled(True)
        if not await self.wait_connected(8):
            return "TV unreachable"
        if self.remote.is_on:
            self.remote.send_key_command("POWER")
            return "Power off sent"
        return "The TV is already off"

    async def run_scene(self, scene: dict) -> str:
        await self.set_enabled(True)
        if not await self.wait_connected(8):
            return "TV unreachable"
        if self.remote.is_on is False:
            self.remote.send_key_command("POWER")
            await asyncio.sleep(3)
        if scene.get("app"):
            self.remote.send_launch_app_command(str(scene["app"]))
            await asyncio.sleep(1.5)
        if scene.get("volume") is not None:
            await self.set_volume(int(scene["volume"]))
        if scene.get("timer"):
            await self.sleep_timer(int(scene["timer"]))
        return f"Scene {scene.get('name', '')} started"

    def handle(self, msg: dict):
        kind = msg.get("type")
        if kind == "key":
            name = str(msg.get("key", ""))
            self.remote.send_key_command(KEY_ALIASES.get(name, name))
        elif kind == "text":
            self.remote.send_text(str(msg.get("text", "")))
        elif kind == "launch":
            self.remote.send_launch_app_command(str(msg.get("package", "")))


TVS: dict[str, Tv] = {}
DEFAULT_HOST = ""

DEFAULT_SCENES = [
    {"id": "cinema", "name": "Cinema", "icon": "film", "color": "red", "app": "com.netflix.ninja", "volume": 30, "timer": 0},
    {"id": "notte", "name": "Night", "icon": "moon", "color": "indigo", "app": "", "volume": 10, "timer": 30},
]

SCENE_COLORS = {"red", "orange", "green", "teal", "indigo", "pink"}


def load_scenes() -> list[dict]:
    try:
        return clean_scenes(json.loads((DATA / "scenes.json").read_text(encoding="utf-8")))
    except (OSError, ValueError):
        return [dict(s) for s in DEFAULT_SCENES]


def clean_scenes(raw) -> list[dict]:
    out = []
    for s in raw if isinstance(raw, list) else []:
        sid = re.sub(r"[^a-z0-9_-]", "", str(s.get("id", "")).lower())[:24]
        if not sid:
            continue
        vol = s.get("volume")
        color = str(s.get("color", "indigo"))
        out.append({
            "id": sid,
            "name": str(s.get("name", sid))[:24],
            "icon": re.sub(r"[^a-z]", "", str(s.get("icon", "spark")))[:16] or "spark",
            "color": color if color in SCENE_COLORS else "indigo",
            "app": re.sub(r"[^\w.:/?=&%#@+-]", "", str(s.get("app", "")))[:200],
            "volume": None if vol in (None, "") else max(0, min(int(vol), 100)),
            "timer": max(0, min(int(s.get("timer") or 0), 360)),
        })
    return out[:8]


def send_magic_packet(mac: str):
    raw = bytes.fromhex(mac.replace(":", "").replace("-", ""))
    packet = b"\xff" * 6 + raw * 16
    prefix = lan_ip().rsplit(".", 1)[0]
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        for addr in (f"{prefix}.255", "255.255.255.255"):
            for port in (9, 7):
                s.sendto(packet, (addr, port))


@web.middleware
async def lan_only(request, handler):
    """Accept only requests from the home network (private or loopback addresses): never from the Internet."""
    try:
        ip = ipaddress.ip_address(request.remote or "")
    except ValueError:
        raise web.HTTPForbidden(text="Solo rete di casa")
    if not (ip.is_private or ip.is_loopback):
        raise web.HTTPForbidden(text="Solo rete di casa")
    return await handler(request)


async def scenes_get(_):
    return web.json_response(load_scenes())


async def scenes_put(request: web.Request):
    scenes = clean_scenes(await request.json())
    (DATA / "scenes.json").write_text(json.dumps(scenes, ensure_ascii=False, indent=1), encoding="utf-8")
    return web.json_response(scenes)


SHORTCUT_KEYS = {"mute": "VOLUME_MUTE", "volume_up": "VOLUME_UP", "volume_down": "VOLUME_DOWN", "home": "HOME", "back": "BACK",
                 "play_pause": "MEDIA_PLAY_PAUSE"}


async def shortcut(request: web.Request) -> web.Response:
    """Endpoint for iOS Shortcuts / Siri, home network only."""
    q = request.query
    tv = get_tv(q.get("host", DEFAULT_HOST))
    action, value = q.get("action", ""), q.get("value", "")
    try:
        if action == "wake":
            msg = await tv.wake()
        elif action == "power_off":
            msg = await tv.power_off()
        elif action == "scene":
            scene = next((s for s in load_scenes() if s["id"] == value), None)
            if not scene:
                return web.json_response({"ok": False, "message": "Unknown scene"}, status=404)
            msg = await tv.run_scene(scene)
        elif action == "volume":
            await tv.set_enabled(True)
            if not await tv.wait_connected(8):
                return web.json_response({"ok": False, "message": "TV unreachable"}, status=503)
            await tv.set_volume(int(value))
            msg = "Volume set"
        elif action == "sleep":
            await tv.set_enabled(True)
            await tv.sleep_timer(int(value))
            msg = "Timer set"
        elif action == "app":
            await tv.set_enabled(True)
            if not await tv.wait_connected(8):
                return web.json_response({"ok": False, "message": "TV unreachable"}, status=503)
            tv.remote.send_launch_app_command(value)
            msg = "App opened"
        elif action in SHORTCUT_KEYS:
            await tv.set_enabled(True)
            if not await tv.wait_connected(8):
                return web.json_response({"ok": False, "message": "TV unreachable"}, status=503)
            tv.remote.send_key_command(SHORTCUT_KEYS[action])
            msg = "Done"
        else:
            return web.json_response({"ok": False, "message": "Unknown action"}, status=400)
    except (ValueError, ConnectionClosed) as exc:
        return web.json_response({"ok": False, "message": str(exc)}, status=400)
    return web.json_response({"ok": True, "message": msg})


def get_tv(host: str) -> Tv:
    tv = TVS.get(host)
    if tv is None:
        tv = TVS[host] = Tv(host)
        tv.task = asyncio.get_running_loop().create_task(tv.supervise())
    return tv


async def ws_handler(request: web.Request) -> web.WebSocketResponse:
    ws = web.WebSocketResponse(heartbeat=20)
    await ws.prepare(request)
    tv = get_tv(request.query.get("host", DEFAULT_HOST))
    tv.clients.add(ws)
    await ws.send_json(tv.state())
    async for raw in ws:
        if raw.type != WSMsgType.TEXT:
            continue
        try:
            msg = json.loads(raw.data)
            if msg.get("type") == "pair":
                await tv.pair(str(msg.get("code", "")).strip().upper())
            elif msg.get("type") == "set_enabled":
                await tv.set_enabled(bool(msg.get("enabled")))
            elif msg.get("type") == "scene":
                scene = next((s for s in load_scenes() if s["id"] == msg.get("id")), None)
                if scene and tv.connected:
                    asyncio.get_running_loop().create_task(tv.run_scene(scene))
            elif msg.get("type") == "wake":
                asyncio.get_running_loop().create_task(tv.wake())
            elif msg.get("type") == "sleep_timer":
                await tv.sleep_timer(max(0, min(int(msg.get("minutes", 0)), 360)))
            elif msg.get("type") == "set_volume" and tv.connected:
                if tv.volume_task and not tv.volume_task.done():
                    tv.volume_task.cancel()
                tv.volume_task = asyncio.get_running_loop().create_task(tv.set_volume(int(msg.get("level", 0))))
            elif tv.connected:
                tv.handle(msg)
        except (ValueError, ConnectionClosed, KeyError) as exc:
            await ws.send_json({"type": "error", "message": str(exc)})
    tv.clients.discard(ws)
    return ws


@web.middleware
async def no_cache(request, handler):
    resp = await handler(request)
    resp.headers["Cache-Control"] = "no-store"
    return resp


async def probe(host: str, port: int, sem: asyncio.Semaphore) -> bool:
    async with sem:
        try:
            _, w = await asyncio.wait_for(asyncio.open_connection(host, port), 0.5)
        except (OSError, asyncio.TimeoutError):
            return False
        w.close()
        return True


FINGERPRINTS = [  # (port, brand, kind, supported)
    (6466, "androidtv", "Android TV", True),
    (8060, "roku", "Roku", False),
    (8002, "samsung", "Samsung", False),
    (3001, "lg", "LG webOS", False),
]


async def fetch(session: aiohttp.ClientSession, url: str, as_json: bool):
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=3)) as resp:
            return await (resp.json(content_type=None) if as_json else resp.text())
    except Exception:  # noqa: BLE001 - optional data
        return None


INFO_PORTS = [(6466, "Remote control"), (6467, "Pairing"), (8008, "Cast (HTTP)"), (8009, "Cast (TLS)"), (8443, "Cast (setup)")]


async def tv_info(request: web.Request) -> web.Response:
    """Collect everything the TV exposes on the network, without reading any content."""
    host = request.query.get("host", DEFAULT_HOST)
    sem = asyncio.Semaphore(20)
    async with aiohttp.ClientSession(trust_env=False) as session:
        eureka, desc, mac_name, latency, *ports = await asyncio.gather(
            fetch(session, f"http://{host}:8008/setup/eureka_info?options=detail", True),
            fetch(session, f"http://{host}:8008/ssdp/device-desc.xml", False),
            mac_and_name(host),
            tcp_latency(host, 6466),
            *[probe(host, p, sem) for p, _ in INFO_PORTS],
        )
    def xml(tag: str) -> str | None:
        m = re.search(rf"<{tag}>(.*?)</{tag}>", desc or "")
        return m.group(1) if m else None

    eureka = eureka or {}
    tv = TVS.get(host)
    control = None
    if tv:
        r = tv.remote
        control = {"enabled": tv.enabled, "connected": tv.connected, "pairing": tv.needs_pairing}
        if tv.connected:
            control.update({"is_on": r.is_on, "current_app": r.current_app, "volume": r.volume_info, "device": r.device_info})
    uptime = eureka.get("uptime")
    return web.json_response({
        "host": host,
        "name": eureka.get("name") or xml("friendlyName") or mac_name[0],
        "manufacturer": xml("manufacturer"),
        "model": xml("modelName"),
        "cast_version": eureka.get("cast_build_revision"),
        "uptime_seconds": int(uptime) if uptime else None,
        "locale": eureka.get("locale"),
        "connection": None if "ethernet_connected" not in eureka else ("Ethernet" if eureka["ethernet_connected"] else "Wi-Fi"),
        "update_available": eureka.get("has_update"),
        "udn": eureka.get("ssdp_udn"),
        "mac": mac_name[1],
        "latency_ms": latency,
        "ports": [{"port": p, "label": label, "open": bool(o)} for (p, label), o in zip(INFO_PORTS, ports)],
        "control": control,
    })


async def tcp_latency(host: str, port: int) -> int | None:
    started = time.perf_counter()
    try:
        _, w = await asyncio.wait_for(asyncio.open_connection(host, port), 1.5)
    except (OSError, asyncio.TimeoutError):
        return None
    w.close()
    return max(1, round((time.perf_counter() - started) * 1000))


MAC_CACHE: dict[str, tuple] = {}


async def mac_and_name(host: str) -> tuple[str | None, str | None]:
    if host in MAC_CACHE:
        return MAC_CACHE[host]
    try:
        r = AndroidTVRemote("GlassRemote", str(DATA / "cert.pem"), str(DATA / "key.pem"), host)
        await r.async_generate_cert_if_missing()
        result = await asyncio.wait_for(r.async_get_name_and_mac(), 4)
    except Exception as exc:  # noqa: BLE001
        log.info("%s: name/MAC not read (%s)", host, type(exc).__name__)
        return None, None
    MAC_CACHE[host] = result
    return result


async def describe(host: str, kind: str) -> tuple[str, bool]:
    """Return (name, verified): verified = the TV really answers the remote control protocol."""
    if kind != "Android TV":
        return host, False
    try:
        probe_remote = AndroidTVRemote("GlassRemote", str(DATA / "cert.pem"), str(DATA / "key.pem"), host)
        await probe_remote.async_generate_cert_if_missing()
        name, _ = await asyncio.wait_for(probe_remote.async_get_name_and_mac(), 4)
        return name, True
    except Exception:  # noqa: BLE001
        return host, False


async def discover(request: web.Request) -> web.Response:
    prefix = lan_ip().rsplit(".", 1)[0]
    sem = asyncio.Semaphore(500)
    hosts = [f"{prefix}.{i}" for i in range(1, 255)]
    checks = [(h, fp, asyncio.create_task(probe(h, fp[0], sem))) for h in hosts for fp in FINGERPRINTS]
    found: dict[str, tuple] = {}
    for host, fp, task in checks:
        if await task and host not in found:
            found[host] = fp
    out = []
    for host, (_, brand, kind, supported) in found.items():
        name, verified = await describe(host, kind)
        out.append({"host": host, "brand": brand, "kind": kind, "supported": supported,
                    "controllable": supported and verified, "name": name})
    return web.json_response({"tvs": out, "subnet": prefix + ".0/24"})


async def index(_):
    return web.FileResponse(APP_DIR / "index.html")


async def connect_page(request: web.Request) -> web.Response:
    """Page to open on the computer: shows the address for the phone and a QR code to scan with its camera."""
    import segno

    port = request.app["port"]
    url = f"http://{lan_ip()}:{port}/"
    svg = segno.make(url, error="m").svg_inline(scale=8, dark="#000000", light="#ffffff", border=2, omitsize=True)
    html = f"""<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Collega l'iPhone</title>
<style>body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#05060b;color:#f5f7fb;font:16px/1.5 system-ui,sans-serif}}
main{{text-align:center;padding:32px;max-width:420px}}svg{{width:260px;height:260px;display:block;margin:20px auto;background:#fff;padding:14px;border-radius:24px}}
code{{display:inline-block;padding:10px 16px;border-radius:14px;background:#12151f;font-size:22px;letter-spacing:.02em}}p{{color:#9aa3b8;margin:8px 0}}</style>
<main><h1>GlassRemote</h1><p>Scan the code with your phone camera, or type this address in your browser:</p>
{svg}<code>{url}</code><p>Your phone and this computer must be on the same Wi-Fi network.</p></main></html>"""
    return web.Response(text=html, content_type="text/html")


def lan_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("203.0.113.1", 80))
        return s.getsockname()[0]
    except OSError:
        try:
            s.connect(("10.255.255.255", 1))
            return s.getsockname()[0]
        except OSError:
            return "127.0.0.1"
    finally:
        s.close()


def main():
    global DEFAULT_HOST
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default=DEFAULT_HOST, help="default TV IP (optional: the app finds TVs by itself)")
    ap.add_argument("--port", type=int, default=8780)
    ap.add_argument("--lan", action="store_true", help="also listen on the network (needed for the phone); without it, only this computer")
    args = ap.parse_args()
    DEFAULT_HOST = args.host
    DATA.mkdir(exist_ok=True)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

    app = web.Application(middlewares=[lan_only, no_cache])
    app["port"] = args.port
    app.router.add_get("/connect", connect_page)
    app.router.add_get("/ws", ws_handler)
    app.router.add_get("/api/scenes", scenes_get)
    app.router.add_put("/api/scenes", scenes_put)
    app.router.add_get("/api/shortcut", shortcut)
    app.router.add_get("/api/discover", discover)
    app.router.add_get("/api/info", tv_info)
    app.router.add_get("/", index)
    app.router.add_static("/", APP_DIR, show_index=False)
    if args.lan:
        print(f"\nGlassRemote ready.  From your phone (same Wi-Fi) open:  http://{lan_ip()}:{args.port}/\n")
    else:
        print(f"\nGlassRemote ready, this computer only:  http://localhost:{args.port}/   (use --lan to open it to other devices)\n")
    web.run_app(app, host="0.0.0.0" if args.lan else "127.0.0.1", port=args.port, print=None)


if __name__ == "__main__":
    main()
