# Image unique : le site Next.js exporté est servi par l'API FastAPI.
# Le contexte de build est la racine du dépôt (le backend importe `ml/`).

FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend .
# Même origine que l'API : le client appelle /api/... sans CORS.
ENV NEXT_OUTPUT=export
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM python:3.12-slim
WORKDIR /repo

COPY backend/requirements.txt /repo/backend/requirements.txt
RUN pip install --no-cache-dir -r /repo/backend/requirements.txt

COPY backend /repo/backend
COPY ml /repo/ml
COPY data /repo/data
COPY --from=web /web/out /repo/frontend/out

ENV PYTHONPATH=/repo
WORKDIR /repo/backend

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
