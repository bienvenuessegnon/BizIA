# Feature — Structuration

**Responsabilité :** nettoyer et structurer les données ingestées (ventes, stocks, dépenses, clients, fournisseurs, trésorerie, etc.).

## Périmètre

- Normalisation (colonnes, types, dates, devises).
- Déduplication et correction des formats.
- Alignement vers un modèle de données métier.

## Hors périmètre

- Import de fichiers (`ingestion`).
- Détection d’anomalies, tendances, prédictions.

## Entrée / sortie

- Entrée : lots issus de `ingestion`.
- Sortie : jeux de données structurés, consommables par les features d’analyse.
