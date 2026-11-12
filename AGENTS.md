# AGENTS.md

Instructions for AI coding assistants (Claude, Copilot, Codex, Cursor...) working with this repository.

The full guide is in **[CLAUDE.md](CLAUDE.md)** (English) and **[CLAUDE.it.md](CLAUDE.it.md)** (Italiano). Read it first. It covers how to set GlassRemote up for a user, what you must never do, the code map and the rules for editing.

Short version:

- Reply in the user's language. One step at a time.
- To set up the TV app on a user's TV, follow AppTv/CLAUDE.md (Italian: AppTv/CLAUDE.it.md).
- Never publish, push or open ports without asking. Never touch security settings on computers the user does not own.
- Never expose personal data (IP, MAC, Wi-Fi/TV names, `receiver/bridge-data/`).
- App code is in `docs/` (plain HTML/CSS/JS, translations in `docs/lang/`), receiver in `receiver/bridge.py`.
- After changing `docs/`, bump `APP_VERSION` in `docs/version.js` and `?v=N` in `docs/index.html` (and rebuild the TV app APK so it carries the new web app). Every new string needs a key in all `docs/lang/*.js`.
