from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
from pathlib import Path

app = FastAPI()
models_path = Path(__file__) / "app" / "models"
model = joblib.load(str(models_path / "solar_qc_model.pkl"))


class SolarReading(BaseModel):
    irradiance: float  # Sunlight sensor
    temperature: float  # Panel temp sensor
    actual_power: float  # Inverter reading


# main endpoint that will be hit by several solar panels at regular intervals
# status: 0 = OK, 1 = ALERT
@app.post("/snapshot-check")
def check_quality(reading: SolarReading):

    input_df = pd.DataFrame(
        [[reading.irradiance, reading.temperature]],
        columns=["irradiance", "temperature"],
    )

    predicted_power = model.predict(input_df)[0]

    if predicted_power < 10:
        return {"status": "IDLE", "message": "Irradiance too low to calculate quality."}

    efficiency = reading.actual_power / predicted_power

    THRESHOLD = 0.80

    if efficiency < THRESHOLD:
        # RETURN ALERT
        return {
            "status": 1,
            "metrics": {
                "expected": round(predicted_power, 2),
                "actual": reading.actual_power,
                "p": round(efficiency, 2),
            },
        }
    else:
        # RETURN OK
        return {
            "status": 0,
            "metrics": {
                "expected": round(predicted_power, 2),
                "actual": reading.actual_power,
                "p": round(efficiency, 2),
            },
        }
