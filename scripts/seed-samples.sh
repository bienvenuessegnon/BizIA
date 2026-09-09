#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API="${API_URL:-http://localhost:8000}"

curl -sS -F "file=@${ROOT}/data/samples/produits.csv" "$API/api/ingestion/files"
echo
curl -sS -F "file=@${ROOT}/data/samples/ventes.csv" "$API/api/ingestion/files"
echo
curl -sS -X POST "$API/api/analysis/run"
echo
