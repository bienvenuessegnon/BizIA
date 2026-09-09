"""Moteur d'analyse BizIA — squelette (responsable : Farid).

Point d'entrée unique : `ml.pipeline.analyze(dataset)`.
Le moteur ne connaît que le schéma commun (`ml/schemas.py`), jamais la source.
"""

from ml.pipeline import analyze

__all__ = ["analyze"]
