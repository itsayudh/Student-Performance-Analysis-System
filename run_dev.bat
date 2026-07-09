@echo off
REM ── SPAS dev runner: starts backend + frontend in two windows ──

REM Window 1: backend (activate venv, then uvicorn with auto-reload)
start "SPAS Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\activate && uvicorn app.main:app --reload"

REM Window 2: frontend (Vite dev server)
start "SPAS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Both servers starting in separate windows...