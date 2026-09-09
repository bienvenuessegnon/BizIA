# Feature — Ingestion

**Responsabilité :** permettre à l’utilisateur d’importer des fichiers PDF, Excel, CSV et documents, puis d’en extraire un contenu brut exploitable par la suite.

## Périmètre

- Réception des fichiers (UI frontend + API backend).
- Identification du type (PDF, tableur, CSV, document).
- Extraction de texte / tableaux bruts.
- Traçabilité de la source (nom, date d’import).

## Hors périmètre

- Nettoyage métier et schémas (`structuration`).
- Analyses, graphiques, chatbot.

## Sortie attendue (contrat à préciser dans `shared/contrats/`)

Un lot de documents ingestés, prêts à être structurés.
