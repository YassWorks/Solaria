# Energy Yield Prediction API

This project implements an MLOps pipeline and REST API to predict the energy yield (kWh per share) for renewable energy projects (Solar, Wind, Hydro, etc.). It uses an ensemble of Gradient Boosting models (CatBoost, XGBoost, LightGBM) to forecast production based on location, installation size, and historical data.

## Features

-   **Automated Pipeline:** Data preprocessing, encoding, model training, and artifact saving.
-   **Smart Data Lookup:** Automatically fills missing technical data (latitude, panel age, historical yields) using dataset averages or realistic simulation.
-   **FastAPI Service:** low-latency inference endpoint.

## Installation

1. Clone the repository.
2. Install dependencies:
    ```bash
    pip install -r requirements.txt

    ```

# Author: Mohamed Amine Zeaibi
