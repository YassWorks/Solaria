import joblib
import pandas as pd
from pathlib import Path
from pydantic import BaseModel

MODELS_PATH = Path(__file__).parent.parent / "models"
FEATURE_NAMES = ['IRRADIATION', 'AMBIENT_TEMPERATURE', 'MODULE_TEMPERATURE', 'HOUR', 'TEMP_DIFF', 'AC_POWER']

model = joblib.load(MODELS_PATH / "underperformance_model.joblib")
scaler = joblib.load(MODELS_PATH / "scaler.joblib")

class PanelData(BaseModel):
    irradiation: float
    ambient_temperature: float
    module_temperature: float
    hour: int
    ac_power: float

def check_underperformance(data: PanelData) -> int:
    """Returns 1 if panel is underperforming, 0 if normal."""
    temp_diff = data.module_temperature - data.ambient_temperature
    features = pd.DataFrame([[
        data.irradiation,
        data.ambient_temperature,
        data.module_temperature,
        data.hour,
        temp_diff,
        data.ac_power
    ]], columns=FEATURE_NAMES)
    features_scaled = scaler.transform(features)
    return int(model.predict(features_scaled)[0])
