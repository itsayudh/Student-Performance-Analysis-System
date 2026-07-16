<!-- backend/
// pip freeze > requirements.txt
to add dependencies on requirement command

#venv activate
cd backend
source .venv/Scripts/activate

backend/
alembic upgrade head

cd backend
uvicorn app.main:app --reload

#run tests/ml file
cd backend
pytest tests/ml/ -v
#run with coverage
pytest tests/ml/ -v --tb=short
#run single file
pytest tests/ml/test_feature_engineering.py -v
pytest tests/ml/test_ml_predictor.py -v

low risk student id 62f71aa5-d621-4882-a99b-490e52ce7a31
high risk student id da7e6e8e-778b-497b-913b-22d17c3173f5

creating the react environment
npm create vite@latest frontend -- --template react

run frontend
cd frontend
npm run dev

when you have branch conflit use this:
:wq

running the bat file(root dir) works only on cmd
run_dev -->

<!-- amar password and email -->

<!-- amar@gmail.com
h-MIgvq-va8

<!-- teacher ko id password -->

<!-- password- IEt-ZNNnGX0
id: anju@gmail.com -->

# SPAS(Student Performance Analysis System)

> The **Student Performance Analysis System (SPAS)** is a full-stack, AI-powered web application designed to assist educational institutions in comprehensively monitoring, evaluating, and improving student academic outcomes. This system integrates robust data management, real-time analytics, machine learning prediction models, and an automated recommendation engine within a single, unified platform.

> The SPAS is built for three primary user groups: **Administrators**, **Teachers**, and **Students**. Each group interacts with a dedicated portal that provides role-appropriate dashboards, data entry capabilities, analytics views, and ML-generated insights.

## Built With

- FastAPI
- Python
- React Js
- PostgresSQL

## Online live link

[Comming Soon......]()

## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites
- A text editor(preferably Visual Studio Code)

### Install
- Git
- Node
- Python
- React
- Setup FastAPI

### Using it Locally
- Clone the project from GitHub [here](https://github.com/itsayudh/Student-Performance-Analysis-System)
- Run the following commands as listed in your terminal:
### Backend
- `cd backend`
- `source .venv/Scripts/activate`
- `pip install requirement.txt`
- `alembic upgrade head`

### Frontend
- `npm install`
- `npm run dev`

### Run both at once
- `run_dev`



## Visit And Open Files

[Visit Repo](https://github.com/itsayudh/Student-Performance-Analysis-System)

## Authors

👤 **Ayud Pantha**

- GitHub: [@Ayud](https://github.com/itsayudh)
- LinkedIn: [@Ayud](https://www.linkedin.com/in/ayudh-pantha/)

👤 **Roshan Bajgain**

- GitHub: [@roshan-bajgain](https://github.com/roshan-bajgain)
- Twitter: [@RoshanBajgain10](https://twitter.com/RoshanBajgain10)
- LinkedIn: [@Roshan](https://www.linkedin.com/in/roshan-bazgain/)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

Feel free to check the [issues page](https://github.com/itsayudh/Student-Performance-Analysis-System/issues).

## Show your support

Give a ⭐️ if you like this project!

