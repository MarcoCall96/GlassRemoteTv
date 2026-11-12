# 3. Compatible TVs

> Italiano: [it/03-tv-compatibili.md](it/03-tv-compatibili.md)

## Works today

Any TV or box running **Android TV** or **Google TV** that exposes the **Android TV Remote service** (the same one used by the official Google TV phone app). The receiver detects it by looking for **TCP port 6466** on the TV.

Typical brands and models:

| Brand | Notes |
|---|---|
| Sony Bravia (Google TV / Android TV) | Works |
| Philips / TP Vision (Android TV, Google TV) | Works. Not the Titan OS or Saphi models. |
| TCL, Hisense (Google TV / Android TV models) | Works. Not Roku TV, VIDAA, or Fire TV models. |
| Xiaomi / Mi TV, Redmi TV (Android TV / Google TV) | Works |
| Panasonic (Android TV models) | Works. Not My Home Screen / Firefox OS / Fire TV models. |
| Sharp, Toshiba, JVC, Hitachi, Telefunken, and other Android TV sets | Works when running Android TV or Google TV |
| NVIDIA Shield TV | Works |
| Chromecast with Google TV | Works |
| Google TV Streamer, Xiaomi TV Box, Mecool and other Android TV boxes | Works |

**Rule of thumb:** if the official **Google TV** app on your phone can control the TV, GlassRemote can too. If the TV's Settings show *Android TV* or *Google TV*, it is almost certainly fine.

## Not supported yet

| Platform | Brands | Why / how to help |
|---|---|---|
| Tizen | Samsung | Uses a different WebSocket API (port 8001/8002). Pull requests welcome. |
| webOS | LG | Uses the SSAP WebSocket API (port 3000/3001). Pull requests welcome. |
| Roku OS | Roku, TCL/Hisense Roku TV | HTTP "ECP" API on port 8060: simple to add. |
| Fire OS | Amazon Fire TV, Fire TV Edition TVs | Uses ADB. |
| Apple tvOS | Apple TV | Different protocol (Companion / MRP). |

The receiver already recognises Samsung, LG and Roku during discovery and labels them as **not supported yet**, so users see a clear message instead of a mystery error.

## What the TV must allow

- It must be **on the same network** as the receiver. Standby with Wi-Fi/network wake enabled is best.
- The remote service must be reachable: on a few TVs it is called *Remote control by mobile device*, *Google Cast* or *Network standby* and can be switched in Settings. The pairing screen is shown by the TV itself.
- **Waking from standby** depends on the TV: some wake with a network magic packet (Wake-on-LAN), some with the power key, some only turn on from the physical remote. If yours does not wake, enable *Network standby / Wake on Wi-Fi / Wake on LAN* in the TV's settings.

## Tested

The project was developed and tested on a Panasonic Android TV set (Android 10). **Please test yours and open an issue** with brand, model, Android TV version and what worked: wake, volume, app launch, keyboard, voice dictation. That list will grow here. For the TV app, see [Tested TVs](../AppTv/guide/06-tested-tvs.md).
