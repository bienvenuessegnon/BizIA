# Backend — BizIA

Dossier des équipes **backend**, **data**, **ML** et **IA**. Stack : Python, FastAPI, Pandas, NumPy, Scikit-learn, LLM.

## Périmètre

- API REST
- Ingestion (CSV, Excel, PDF, documents)
- Nettoyage et structuration
- Analyse, anomalies, prédictions
- Moteur IA / LLM (chat, insights, recommandations)
- Génération de rapports

L’interface utilisateur reste dans `frontend/`.

## Démarrer

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API : [http://localhost:8000](http://localhost:8000)  
Docs OpenAPI : [http://localhost:8000/docs](http://localhost:8000/docs)

## Structure

```
backend/
  app/main.py          point d’entrée FastAPI
  app/api/             routes REST
  app/ingestion/       import de fichiers
  app/analysis/        analyse + ML
  app/ai/              LLM, RAG, insights
```

Contrats d’API : `shared/contrats/`.
