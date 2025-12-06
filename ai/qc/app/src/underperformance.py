import joblib
import pandas as pd
from pathlib import Path
from pydantic import BaseModel

MODELS_PATH = Path(__file__).parent.parent / "models"
FEATURE_NAMES = [
    "IRRADIATION",
    "AMBIENT_TEMPERATURE",
    "MODULE_TEMPERATURE",
    "HOUR",
    "TEMP_DIFF",
    "AC_POWER",
]

MODEL = None
SCALER = None


def load_models():
    global MODEL, SCALER
    MODEL = joblib.load(MODELS_PATH / "underperformance_model.joblib")
    SCALER = joblib.load(MODELS_PATH / "scaler.joblib")


class PanelData(BaseModel):
    irradiation: float
    ambient_temperature: float
    module_temperature: float
    hour: int
    ac_power: float


def check_underperformance(data: PanelData) -> int:
    """Returns 1 if panel is underperforming, 0 if normal."""
    global MODEL, SCALER
    if MODEL is None or SCALER is None:
        load_models()
    temp_diff = data.module_temperature - data.ambient_temperature
    features = pd.DataFrame(
        [
            [
                data.irradiation,
                data.ambient_temperature,
                data.module_temperature,
                data.hour,
                temp_diff,
                data.ac_power,
            ]
        ],
        columns=FEATURE_NAMES,
    )
    features_scaled = SCALER.transform(features)
    return int(MODEL.predict(features_scaled)[0])
