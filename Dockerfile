# Image de l'API BizIA. Le contexte de build est la racine du dépôt
# (le backend importe le package `ml/` et lit `data/`).
FROM python:3.12-slim

WORKDIR /repo

COPY backend/requirements.txt /repo/backend/requirements.txt
COPY ml/requirements.txt /repo/ml/requirements.txt
RUN pip install --no-cache-dir -r /repo/backend/requirements.txt

COPY backend /repo/backend
COPY ml /repo/ml
COPY data /repo/data

ENV PYTHONPATH=/repo
WORKDIR /repo/backend

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
