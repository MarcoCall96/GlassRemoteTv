"""Checks of the receiver's request filtering (Host, Origin, cross-site, TV address).

Run from the receiver folder with the receiver's virtual environment:  python tests/test_hardening.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import bridge  # noqa: E402
from aiohttp import web  # noqa: E402
from aiohttp.test_utils import TestClient, TestServer  # noqa: E402

ok = True


def check(name, cond):
    global ok
    ok &= bool(cond)
    print(("PASS " if cond else "FAIL ") + name)


for good in ["192.168.1.5:41234", "10.0.0.2", "localhost:5000", "127.0.0.1:9", "[::1]:80"]:
    check("host accepted " + good, bridge.host_header_ok(good))
for bad in ["attacker.example:80", "evil.com", "8.8.8.8", "192.168.1.5.evil.com", "", "1.2.3.4:80"]:
    check("host refused " + repr(bad), not bridge.host_header_ok(bad))


def raises_400(v):
    try:
        bridge.clean_host(v)
    except web.HTTPBadRequest:
        return True
    return False


check("clean_host accepts a home address", bridge.clean_host("192.168.1.9") == "192.168.1.9")
for v in ["127.0.0.1:9000/x?", "user@10.0.0.5", "tv.local", "198.51.100.7", "127.0.0.1", "", "10.0.0.5/../x"]:
    check("clean_host refuses " + repr(v), raises_400(v))


async def http_checks():
    app = web.Application(middlewares=[bridge.same_origin])

    async def ok_handler(request):
        return web.Response(text="ok")

    app.router.add_get("/x", ok_handler)
    async with TestClient(TestServer(app)) as c:
        base = {"Host": "192.168.1.5:41234"}
        r = await c.get("/x", headers=base)
        check("plain request allowed", r.status == 200)
        r = await c.get("/x", headers={**base, "Origin": "http://192.168.1.5:41234", "Sec-Fetch-Site": "same-origin"})
        check("same-origin browser request allowed", r.status == 200)
        r = await c.get("/x", headers={**base, "Sec-Fetch-Site": "none"})
        check("address-bar navigation allowed", r.status == 200)
        r = await c.get("/x", headers={**base, "Origin": "http://evil.example"})
        check("foreign Origin refused", r.status == 403)
        r = await c.get("/x", headers={**base, "Sec-Fetch-Site": "cross-site"})
        check("cross-site request refused", r.status == 403)
        r = await c.get("/x", headers={"Host": "attacker.example:80"})
        check("rebinding Host refused", r.status == 403)


asyncio.run(http_checks())
sys.exit(0 if ok else 1)
