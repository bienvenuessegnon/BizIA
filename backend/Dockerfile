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
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
