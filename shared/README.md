# Contrats d’échange frontend ↔ backend ↔ ML

Source de vérité complémentaire :

- [docs/api/README.md](../docs/api/README.md)
- [docs/api/openapi.yaml](../docs/api/openapi.yaml)
- Types TS : `frontend/src/types/index.ts`
- Schémas Pydantic : `backend/app/schemas/common.py`
- TypedDict ML : `ml/schemas.py`

Le frontend consomme `NEXT_PUBLIC_API_URL` (défaut : `http://localhost:8000`).  
Le backend expose `/health` et `/api/*`.  
Le ML consomme uniquement le **schéma canonique** (produits + ventes), jamais un fichier brut.
