"""
conftest.py
===========
Shared pytest configuration for ML tests.
Ensures models are loaded once for the entire test session.
"""

import pytest
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


@pytest.fixture(scope="session", autouse=True)
def initialize_ml_models():
    """
    Load ML models once at the start of the test session.
    Shared across all ML test modules.
    """
    from app.ml.predictor import initialize_models

    models_dir = os.path.join(
        os.path.dirname(__file__), '..', '..', 'app', 'ml', 'models'
    )
    initialize_models(models_dir=models_dir)
    yield