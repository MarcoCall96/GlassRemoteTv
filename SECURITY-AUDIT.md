# Security audit

GlassRemote (the TV app in this folder, the web app and the computer receiver in the GlassRemoteTv repository) was audited with the open-source [security-audit skill by Cloudflare](https://github.com/cloudflare/security-audit-skill): source-only review by independent agents, every candidate re-checked by a separate verifier, results validated against the skill's schema. It is a partial pass (quick profile plus one extra targeted wave); nothing was executed against a real TV during the audit.

## Result

Five confirmed findings, none critical or high, all fixed before this release:

| Severity | Finding | Fix |
|---|---|---|
| Medium | The computer receiver could be driven by any web page open in a browser on the same network (no Origin/Host check, state-changing GET) | The receiver now refuses a Host that is not a home-network IP or localhost, a foreign Origin, and cross-site requests |
| Low | The receiver accepted any `host` value (probing and outbound requests to arbitrary addresses) | Only home-network IP addresses are accepted; limits on TV objects and scans |
| Low | One wrong-PIN counter for everybody: anyone on the network could keep new phones from pairing; the PIN was static | The lock is per address and grows; the PIN changes by itself after 30 wrong tries |
| Low | The TV app did unbounded work before authentication (headers, connections, sockets) | Header, time, frame and connection limits; bounded thread pool; 10 s authentication deadline |
| Low | The web app's debug links (`?m`, `?f`) could click UI elements | Allow-lists |

One candidate was rejected as an accepted, documented trade-off: traffic on the home network is plain HTTP.

Also changed after the audit: every installation uses its own random port (the TV app and the receiver), the QR code carries the PIN in the address fragment, the build script handles the signing password more safely, and releases come with a SHA-256 checksum and the signing certificate fingerprint.

## Not covered

Router and Wi-Fi settings, TV firmware behaviour, GitHub settings and anything that needs running code on a real TV. Possible next steps: HTTPS on the home network, a Content-Security-Policy, hash-pinned receiver dependencies.

## Version 0.5.0 review (TV app 0.5.0, web app 0.8.1)

**Scope.** The code added in 0.5.0: the key helper (`Injector.java`, `KeyInjector.java`), the health reading (`Stats.java`, `GET /api/stats`), cache cleaning (`POST /api/clean-cache`), the automatic restart (`Schedule.java`, `Maintenance.java`, `GET`/`PUT /api/maintenance`), opening a link on the TV (`POST /api/open-link`), the link allowlist (`Links.java`) and the changes in `Adb.java`, `TvLink.java`, `Server.java` and `ReceiverService.java`.

**Method.** A read-only review by an AI review agent over the new code, before release. Nothing was changed by the reviewer; the maintainer fixed the findings. The new logic also has automated checks: `tv-app/tests/FeaturesTest.java` (51 checks: restart schedule maths including daylight saving, config validation, load-figure parser, link allowlist). The behaviour was verified on a real TV. This is not a full audit like the one above.

**Findings fixed before release:**

| Area | Finding | Fix |
|---|---|---|
| Automatic restart | Risk of a restart loop or abuse (repeated restarts, clock jumps) | Minimum gap of 12 hours between restarts, no restart within 10 minutes of boot, protection against clock jumps |
| Automatic restart | A restart could happen while someone is watching | The TV restarts only when it is in standby (Asleep/Dozing); otherwise it retries every 30 minutes for up to 6 hours, then skips to the next occurrence |
| Open a link or app | Links of any kind could be opened | Only `http`/`https` links with a host (no `file:`, `content:`, `intent:`, `market:`, `javascript:`); valid package names only; the intent uses the `BROWSABLE` category. The same allowlist protects `POST /api/open-link` (invalid links get `400 invalid_link`) |
| Key helper | The helper could keep running after the connection to the TV was disabled | The helper is closed when the connection to the TV (the TV link) is disabled; it also stops after 10 idle minutes and exits when the app or connection closes |
| Config | The restart config and its application were not ordered safely | The config is saved first, then applied |
| Errors | Exception text could reach the phone | Fixed error codes instead of exception text |
| Health reading | Each request ran the ADB command again | The TV reuses a reading younger than 2 seconds |

**Known and unchanged:**

- The TV web server has no `Host`/`Origin` check on `/ws`. The per-address PIN lock-outs bound guessing; it should be considered for a later release.
- Traffic on the home network is plain HTTP (the documented trade-off).
- A phone with a valid token can use the new features: read the health figures and process list, open web links and apps on the TV (a link also wakes the TV from standby), clean the apps' cache and set or switch off the automatic restart. It cannot run arbitrary shell commands, and every new endpoint is behind the token.
- The key helper opens no network socket: it reads from its standard input over the app's own ADB connection.

## Report a vulnerability

Please use a private security advisory on GitHub (Security, Report a vulnerability) instead of a public issue.
