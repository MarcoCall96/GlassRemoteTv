#!/usr/bin/env bash
# GlassRemote receiver: run with ./start.sh (macOS / Linux).
cd "$(dirname "$0")" || exit 1
if [ ! -d venv ]; then
  echo "First start: installing, please wait..."
  python3 -m venv venv && venv/bin/pip install -r requirements.txt || exit 1
fi
exec venv/bin/python bridge.py --lan
