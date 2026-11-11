@echo off
rem GlassRemote receiver: double-click to start (Windows).
cd /d "%~dp0"
if not exist venv (
  echo First start: installing, please wait...
  python -m venv venv || (echo Python 3.10+ is required: https://www.python.org/downloads/ & pause & exit /b 1)
  venv\Scripts\python.exe -m pip install -r requirements.txt || (pause & exit /b 1)
)
venv\Scripts\python.exe bridge.py --lan
pause
