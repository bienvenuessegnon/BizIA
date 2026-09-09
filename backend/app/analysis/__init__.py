"""Adaptateur backend → moteur ML.

Le backend n'importe le moteur qu'ici et dans `services/pipeline.py`.
"""

from ml.pipeline import analyze

__all__ = ["analyze"]
