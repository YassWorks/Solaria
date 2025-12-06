import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
from pathlib import Path
import os

DATA_PATH = Path(__file__).parent.parent / "data"
MODELS_PATH = Path(__file__).parent.parent / "models"
FEATURE_NAMES = [
    "IRRADIATION",
    "AMBIENT_TEMPERATURE",
    "MODULE_TEMPERATURE",
    "HOUR",
    "TEMP_DIFF",
    "AC_POWER",
]
KAGGLE_DATASET = "anikannal/solar-power-generation-data"


def download_data():
    """Download dataset from Kaggle. Requires KAGGLE_USERNAME and KAGGLE_KEY env vars or ~/.kaggle/kaggle.json"""
    required_files = [
        "Plant_1_Generation_Data.csv",
        "Plant_1_Weather_Sensor_Data.csv",
        "Plant_2_Generation_Data.csv",
        "Plant_2_Weather_Sensor_Data.csv",
    ]

    if all((DATA_PATH / f).exists() for f in required_files):
        print("Data already exists, skipping download.")
        return

    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
    except ImportError:
        raise ImportError("Install kaggle: pip install kaggle")

    DATA_PATH.mkdir(parents=True, exist_ok=True)

    api = KaggleApi()
    api.authenticate()

    print(f"Downloading {KAGGLE_DATASET}...")
    api.dataset_download_files(KAGGLE_DATASET, path=DATA_PATH, unzip=True)
    print("Download complete.")


def load_data():
    """Load and merge generation + weather data from both plants."""
    gen1 = pd.read_csv(DATA_PATH / "Plant_1_Generation_Data.csv")
    gen2 = pd.read_csv(DATA_PATH / "Plant_2_Generation_Data.csv")
    weather1 = pd.read_csv(DATA_PATH / "Plant_1_Weather_Sensor_Data.csv")
    weather2 = pd.read_csv(DATA_PATH / "Plant_2_Weather_Sensor_Data.csv")

    gen1["DATE_TIME"] = pd.to_datetime(gen1["DATE_TIME"], format="%d-%m-%Y %H:%M")
    gen2["DATE_TIME"] = pd.to_datetime(gen2["DATE_TIME"], format="%Y-%m-%d %H:%M:%S")
    weather1["DATE_TIME"] = pd.to_datetime(weather1["DATE_TIME"])
    weather2["DATE_TIME"] = pd.to_datetime(weather2["DATE_TIME"])

    gen = pd.concat([gen1, gen2], ignore_index=True)
    weather = pd.concat([weather1, weather2], ignore_index=True)

    df = gen.merge(
        weather[
            [
                "DATE_TIME",
                "PLANT_ID",
                "AMBIENT_TEMPERATURE",
                "MODULE_TEMPERATURE",
                "IRRADIATION",
            ]
        ],
        on=["DATE_TIME", "PLANT_ID"],
        how="inner",
    )
    return df


def clean_and_engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Filter daylight hours and create features."""
    df_day = df[df["IRRADIATION"] > 0].copy()
    df_day["HOUR"] = df_day["DATE_TIME"].dt.hour
    df_day["TEMP_DIFF"] = df_day["MODULE_TEMPERATURE"] - df_day["AMBIENT_TEMPERATURE"]
    df_day["EFFICIENCY"] = df_day["AC_POWER"] / df_day["IRRADIATION"]
    return df_day


def create_labels(df: pd.DataFrame) -> pd.DataFrame:
    """Label underperforming panels based on efficiency deviation."""
    df["IRR_BIN"] = pd.cut(df["IRRADIATION"], bins=10, labels=False)
    median_eff = df.groupby("IRR_BIN")["EFFICIENCY"].transform("median")
    std_eff = df.groupby("IRR_BIN")["EFFICIENCY"].transform("std")
    df["UNDERPERFORMING"] = (
        (df["EFFICIENCY"] < (median_eff - 1.5 * std_eff)) | (df["EFFICIENCY"] == 0)
    ).astype(int)
    return df


def train_model(df: pd.DataFrame):
    """Train RandomForest and return model, scaler, and metrics."""
    X = df[FEATURE_NAMES].copy()
    y = df["UNDERPERFORMING"].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=100, max_depth=10, min_samples_leaf=10, random_state=42, n_jobs=-1
    )
    model.fit(X_train_scaled, y_train)

    train_acc = accuracy_score(y_train, model.predict(X_train_scaled))
    test_acc = accuracy_score(y_test, model.predict(X_test_scaled))

    return model, scaler, {"train_accuracy": train_acc, "test_accuracy": test_acc}


def save_model(model, scaler):
    """Save model and scaler to disk."""
    MODELS_PATH.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODELS_PATH / "underperformance_model.joblib")
    joblib.dump(scaler, MODELS_PATH / "scaler.joblib")


def setup():
    """Full pipeline: download data, clean, engineer features, train, and save model."""
    
    print("Creating ~/.kaggle/kaggle.json")
    path = Path.home() / ".kaggle"
    path.mkdir(parents=True, exist_ok=True)
    kaggle_json_path = path / "kaggle.json"
    with open(kaggle_json_path, "w") as f:
        f.write(os.getenv("KAGGLEJSON"))
    os.chmod(kaggle_json_path, 0o600)

    print("Checking/downloading data...")
    download_data()

    print("Loading data...")
    df = load_data()
    print(f"Loaded {len(df)} records")

    print("Cleaning and engineering features...")
    df = clean_and_engineer_features(df)
    print(f"Daylight records: {len(df)}")

    print("Creating labels...")
    df = create_labels(df)
    print(f"Underperforming rate: {df['UNDERPERFORMING'].mean()*100:.2f}%")

    print("Training model...")
    model, scaler, metrics = train_model(df)
    print(f"Train accuracy: {metrics['train_accuracy']:.4f}")
    print(f"Test accuracy: {metrics['test_accuracy']:.4f}")

    print("Saving model...")
    save_model(model, scaler)
    print("Setup complete!")

    return metrics
