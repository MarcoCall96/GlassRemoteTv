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

## Report a vulnerability

Please use a private security advisory on GitHub (Security, Report a vulnerability) instead of a public issue.
