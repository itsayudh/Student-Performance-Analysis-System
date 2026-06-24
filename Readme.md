backend/
// pip freeze > requirements.txt
to add dependencies on requirement command

#venv activate
cd backend
source .venv/Scripts/activate

backend/
alembic upgrade head


cd backend
uvicorn app.main:app --reload

#run  tests/ml file
cd backend
pytest tests/ml/ -v
#run with coverage
pytest tests/ml/ -v --tb=short
#run single file
pytest tests/ml/test_feature_engineering.py -v
pytest tests/ml/test_ml_predictor.py -v

low risk student id  62f71aa5-d621-4882-a99b-490e52ce7a31
high risk student id da7e6e8e-778b-497b-913b-22d17c3173f5
