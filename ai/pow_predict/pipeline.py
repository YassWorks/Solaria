import numpy as np
import pandas as pd
import pickle
import logging
from pathlib import Path
from typing import Dict, Optional
import warnings

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor

warnings.filterwarnings("ignore")


class Config:
    BASE_DIR = Path(__file__).resolve().parent
    RAW_DATA = BASE_DIR / "data" / "dataset.csv"
    MODELS_DIR = BASE_DIR / "models"
    LOGS_DIR = BASE_DIR / "logs"
    MODEL_PATH = MODELS_DIR / "best_model.pkl"
    ENCODERS_PATH = MODELS_DIR / "encoders.pkl"
    CATEGORICAL_COLS = ["energy_type", "energy_subtype"]
    TARGET_COL = "kwh_per_share_per_month"
    TEST_SIZE = 0.2
    RANDOM_STATE = 42

    def __init__(self):
        for directory in [self.MODELS_DIR, self.LOGS_DIR]:
            directory.mkdir(parents=True, exist_ok=True)
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(self.LOGS_DIR / "pipeline.log", encoding="utf-8"),
                logging.StreamHandler(),
            ],
        )
        self.logger = logging.getLogger(__name__)


def run_training_pipeline(data_path: Optional[str] = None):
    config = Config()
    config.logger.info("Starting simplified training pipeline (RandomForest)")

    try:
        # 1. Load Data
        path = Path(data_path) if data_path else config.RAW_DATA
        if not path.exists():
            raise FileNotFoundError(f"Dataset not found at {path}")

        df = pd.read_csv(path)

        # 2. Preprocessing
        if "project_id" in df.columns:
            df = df.drop(columns=["project_id"])

        if "historical_production_kwh" in df.columns:
            import ast

            df["historical_production_kwh"] = df["historical_production_kwh"].apply(
                lambda x: ast.literal_eval(x) if isinstance(x, str) else x
            )
            hist_df = pd.DataFrame(
                df["historical_production_kwh"].to_list(),
                columns=[f"hist_month_{i+1}" for i in range(12)],
            )
            df = pd.concat(
                [df.drop(columns=["historical_production_kwh"]), hist_df], axis=1
            )

        X = df.drop(columns=[config.TARGET_COL])
        y = df[config.TARGET_COL]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=config.TEST_SIZE, random_state=config.RANDOM_STATE
        )

        # 3. Encoding
        encoders = {}
        X_train_processed = X_train.copy()
        X_test_processed = X_test.copy()

        for col in config.CATEGORICAL_COLS:
            le = LabelEncoder()
            # Fit on training data
            X_train_processed[f"{col}_encoded"] = le.fit_transform(
                X_train_processed[col]
            )
            # Transform test data (handle unknown labels if necessary, but keep simple here)
            # Note: In production, you might want to handle unseen labels more gracefully
            try:
                X_test_processed[f"{col}_encoded"] = le.transform(X_test_processed[col])
            except ValueError:
                # Fallback for splitting edge cases
                X_test_processed[f"{col}_encoded"] = 0

            encoders[col] = le

        # Select Features: Numeric columns + Encoded columns (Exclude raw strings)
        numeric_cols = [c for c in X_train.columns if c not in config.CATEGORICAL_COLS]
        encoded_cols = [f"{c}_encoded" for c in config.CATEGORICAL_COLS]
        feature_order = numeric_cols + encoded_cols

        X_train_final = X_train_processed[feature_order]
        X_test_final = X_test_processed[feature_order]

        # 4. Train Single Model (RandomForest)
        config.logger.info("Training RandomForestRegressor...")
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=12,
            random_state=config.RANDOM_STATE,
            n_jobs=-1,  # Use all CPU cores
        )
        model.fit(X_train_final, y_train)

        # 5. Evaluate
        y_pred = model.predict(X_test_final)
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))

        config.logger.info(f"Model Performance - R2: {r2:.4f}, RMSE: {rmse:.4f}")

        # 6. Save Artifacts
        with open(config.MODEL_PATH, "wb") as f:
            pickle.dump(model, f)

        # Save encoders AND the exact feature order expected by the model
        artifact_data = {"encoders": encoders, "feature_order": feature_order}
        with open(config.ENCODERS_PATH, "wb") as f:
            pickle.dump(artifact_data, f)

        return {"success": True, "model": "RandomForest", "r2_score": r2}

    except Exception as e:
        config.logger.error(f"Pipeline error: {e}")
        return {"success": False, "error": str(e)}


def make_prediction(input_data: Dict) -> Dict:
    config = Config()
    try:
        # Load Model
        with open(config.MODEL_PATH, "rb") as f:
            model = pickle.load(f)

        # Load Encoders and Feature Order
        with open(config.ENCODERS_PATH, "rb") as f:
            artifacts = pickle.load(f)
            encoders = artifacts["encoders"]
            feature_order = artifacts["feature_order"]

        # Preprocess Input
        df = pd.DataFrame([input_data])

        # Rename historical columns to match training
        for i in range(1, 13):
            old_name = f"historical_production_kwh_{i}"
            new_name = f"hist_month_{i}"
            if old_name in df.columns:
                df.rename(columns={old_name: new_name}, inplace=True)

        # Apply Encoders
        for col, encoder in encoders.items():
            if col in df.columns:
                try:
                    df[col] = df[col].astype(str)
                    df[f"{col}_encoded"] = encoder.transform(df[col])
                except Exception:
                    # Fallback for unseen labels (e.g. "Geothermal" if not in training)
                    df[f"{col}_encoded"] = 0

        # Ensure all expected columns exist (fill 0 for missing numeric)
        for feat in feature_order:
            if feat not in df.columns:
                df[feat] = 0

        # Select columns in exact order used for training
        df_final = df[feature_order]

        # Predict
        prediction = model.predict(df_final)[0]
        return {"prediction": float(prediction), "status": "success"}

    except Exception as e:
        return {"error": str(e), "status": "error"}


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--data", help="Path to training data")
    args = parser.parse_args()
    run_training_pipeline(args.data)
