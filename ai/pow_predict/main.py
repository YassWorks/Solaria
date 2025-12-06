from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any, Optional
import uvicorn
from pipeline import make_prediction
from data_lookup import smart_lookup
from pipeline import run_training_pipeline

_SETUP_TRAINING = False

app = FastAPI(title="MLOps Energy API", version="1.0.0")


class PredictionRequest(BaseModel):
    energy_type: str
    energy_subtype: str
    month: int
    investment_per_share_eur: float
    total_shares: int
    installation_size_kw: Optional[float] = None
    location_latitude: Optional[float] = None
    location_longitude: Optional[float] = None
    panel_age_months: Optional[int] = None


class PredictionResponse(BaseModel):
    status: str
    timestamp: str
    prediction: Dict[str, Any]


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    global _SETUP_TRAINING

    if not _SETUP_TRAINING:
        run_training_pipeline()
        _SETUP_TRAINING = True

    try:
        req_data = request.model_dump()

        # 1. Fill missing data using data_lookup
        complete_data = smart_lookup.get_complete_data(
            energy_type=req_data["energy_type"],
            energy_subtype=req_data["energy_subtype"],
            month=req_data["month"],
            investment_per_share_eur=req_data["investment_per_share_eur"],
            total_shares=req_data["total_shares"],
        )

        # Overwrite lookup values if user provided specific ones
        for k, v in req_data.items():
            if v is not None:
                complete_data[k] = v

        # 2. Run prediction via pipeline
        result = make_prediction(complete_data)

        if result["status"] == "error":
            raise Exception(result["error"])

        prediction_val = result["prediction"]

        return PredictionResponse(
            status="success",
            timestamp=datetime.now().isoformat(),
            prediction={
                "kwh_per_share_per_month": round(prediction_val, 4),
                "total_kwh_per_month": round(
                    prediction_val * req_data["total_shares"], 2
                ),
                "units": "kWh",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
