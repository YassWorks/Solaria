# Solaria — AI Service

Small FastAPI service to detect underperforming solar panels. This service trains an internal model using Kaggle solar power datasets and exposes a single endpoint to check whether a panel is underperforming.

Quick features

-   `/check-panel` POST endpoint: accepts panel data and returns JSON `{ "status": 0 }` (normal) or `{ "status": 1 }` (underperforming).
-   Training and model artifacts are saved to `app/models/` by `setup()`.

Quick start (local)

1. Create a Python environment and install dependencies:

```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Provide Kaggle credentials either via `KAGGLEJSON` env var or by creating `~/.kaggle/kaggle.json` as described in `app/src/setup.py`.
3. Start the API:

```
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

4. Example usage:

```
curl -X POST http://localhost:8000/check-panel \
	-H "Content-Type: application/json" \
	-d '{"irradiation":400, "ambient_temperature":25, "module_temperature":40, "hour":14, "ac_power":1.4}'
```

Docker

-   Use `docker compose -f compose.yml up` to run the service in a container (requires Docker).

Notes

-   The first request to `/check-panel` triggers `setup()` which may download the Kaggle dataset and train the model. This can take a while.
-   `app/src/setup.py` writes `KAGGLEJSON` env var contents to `~/.kaggle/kaggle.json` for Kaggle authentication.
-   Model files are stored in `app/models/` (`underperformance_model.joblib`, `scaler.joblib`).
