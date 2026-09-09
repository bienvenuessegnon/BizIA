#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONPATH="$ROOT"
cd "$ROOT/backend"
exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
