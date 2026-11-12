# 5. TV health and maintenance

> Italiano: [it/05-salute-e-manutenzione.md](it/05-salute-e-manutenzione.md) · Back to the [README](../README.md)

New in TV app 0.5.0 (web app 0.8.1). This guide shows how to open a link on the TV, read the **TV health** screen, clean the cache and set an automatic restart.

These features exist **only in the TV app**. With the computer receiver the screen is not shown. The public demo shows simulated data with a **Demo data** label.

## Faster keys

You do not have to do anything. The TV app starts a small helper when a phone connects, and keys then reach the TV in about 10 ms instead of about 1 second. The first key after a long pause (10 minutes without keys) can take about 1 second while the helper starts again. If the helper cannot start, the remote keeps working the old way. Details: [02-security.md](02-security.md) and [03-troubleshooting.md](03-troubleshooting.md).

## Open a link on the TV

On the **Apps** screen of the phone app there is a card **Open a link on the TV**.

1. Paste or type a YouTube or other web link. A link without `http(s)://` but with a dot, such as `youtu.be/abc`, gets `https://` added by itself. The optional **Paste** button reads the clipboard (iOS may ask your permission to paste).
2. Tap **Open on TV** (or press Enter). The last 3 links appear as chips under the field, so you can send them again.
3. The TV wakes from standby by itself (about 2.5 seconds) and opens the link in the app that handles it. A YouTube link opens the YouTube app, if it is installed on the TV. Tested on a real TV: from the Home screen the link opened the YouTube TV app.

Good to know:

- Only `http`/`https` links with a host are accepted (no `file:`, `content:`, `intent:`, `market:`, `javascript:`). Otherwise the app says "This is not a web link".
- It **opens links**. It does not "cast" photos or videos from the phone, and you cannot send files.
- Netflix, Prime Video or Disney+ links open only if the TV app handles that web link.
- The card appears only with the TV app, not with the computer receiver. The public demo simulates it.
- Technical: `POST /api/open-link` with `{"url":"..."}`, behind the token. It answers 200 `{"ok":true}`, 400 `invalid_link`, 405 for a non-POST request, 401 without a token and 503 when the TV is unreachable.

If the link opens nothing, see [03-troubleshooting.md](03-troubleshooting.md).

## The TV health screen

Open the phone app, then **Settings > TV health**. If you do not see it, the TV app is too old or you are using the computer receiver (see [03-troubleshooting.md](03-troubleshooting.md)).

While the screen is open (and the page is visible) the phone asks the TV for fresh numbers every 3 seconds. When you close it, the asking stops.

### Performance tab

- **A verdict in plain words** at the top: *All good*, *Keep an eye on it* or *The TV is struggling*, with a short reason.
- **CPU:** a chart of the last 6 minutes, one bar per core, and the frequency and temperature when the TV reports them.
- **Memory:** a chart of RAM and swap for the last 6 minutes, with used, available and cache.
- **Tap the CPU or Memory card** to see **what** is using it. Apps come first (the processes of one app are grouped and have readable names), then **Android system**. Tap an app to see its processes. Rows that are idle are hidden; use the toggle to show them.

### Processes tab

A list of processes you can sort (name, PID, CPU, memory, user) and search.

### How the verdict is decided

| Verdict | When |
|---|---|
| The TV is struggling | CPU above 70%, or available RAM under 150 MB, or swap above 85% |
| Keep an eye on it | CPU above 40%, or swap above 55%, or available RAM under 300 MB, or the TV has been on for more than 14 days |
| All good | none of the above |

### What the numbers mean

- **CPU:** the cores show total percent. Processes show percent of **one** core, so a process can read more than 100% on a multi-core TV.
- **Memory:** *used* is what apps hold, *available* is what the TV can still give, *cache* is memory that can be dropped when needed. **Swap** is backup memory on storage: when it fills up the TV gets slow.
- **Shared memory is counted more than once**, so the sum of the apps can exceed the total.
- Android's `top` reports **coarse steps** (about 3%), so small values jump.
- **Taking the measurement adds a little load** while the screen is open, so the TV looks slightly busier than when you do not look.
- A TV that is mostly idle shows very low numbers. Open an app to see it work.

## Clean cache

In the TV health screen, **Maintenance > Clean cache**, then confirm. The TV runs `pm trim-caches`: it removes the **temporary files** of the apps. It never deletes data or logins. Apps may open a little slower the first time afterwards. The screen shows how many MB were freed ("0 MB" or "already clean" is normal). You can do it at most once every 10 seconds.

## Automatic restart

A restart now and then keeps an Android TV quick. It is **off by default**.

In **TV health > Maintenance > Automatic restart** switch it on and choose:

- **Daily**, **Weekly** (Monday to Sunday) or **Monthly** (day 1 to 28);
- the **time**. Times are in the **TV's time zone**. The app shows a hint when your phone is in another one.

The screen shows the last and the next restart.

### The rules (for safety)

- The TV restarts **only when it is in standby** (asleep or dozing). If it is on at that time, it tries again every 30 minutes for up to 6 hours, then skips to the next occurrence. Choose a time when nobody watches, for example the middle of the night.
- Never twice within 12 hours, and not within 10 minutes of boot.
- A wrong or jumping clock cannot trigger a loop of restarts.
- The settings are kept in the app's private files (`maintenance.txt`) and are saved before they are applied.

### After a restart

In the test, the TV came back in about 95 seconds and the TV app started again by itself (through the boot receiver). The TV app, the **Network debugging** setting and the *Always allow* approval survived the restart.

**Some TV models may turn Network debugging off after a restart.** If that happens the remote stops until you switch it on again (Settings, Device Preferences, Developer options). So **after you set a schedule, test the first restart**: choose a time a few minutes ahead with the TV in standby, wait, and check that the remote works. If it does not, switch the schedule off for that TV.

## Safety notes

- Everything here goes through the TV app and needs a signed-in phone (the PIN once). The new commands are read-only (health) or limited (cache, restart schedule); nothing can run arbitrary commands. See [02-security.md](02-security.md).
- The cache button never touches data or logins.
- Do not use the automatic restart on a TV you cannot reach to switch Network debugging on again, unless you tested it.

## Technical notes

The health data come from `GET /api/stats` (read-only; one ADB command that reads `/proc/stat`, `/proc/meminfo`, `loadavg`, `uptime`, `top` and `ps`). The TV reuses a reading younger than 2 seconds. Other endpoints: `POST /api/clean-cache`, `GET`/`PUT /api/maintenance` and `POST /api/open-link`. All are behind the token. See [04-build-from-source.md](04-build-from-source.md) for the source files and the constants.
