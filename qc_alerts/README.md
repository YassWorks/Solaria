# Solaria — QC Alerts

Simple scheduler that polls a QC AI service to check the health of solar panels, simulates sample panel data, and sends an alert email when system efficiency drops below a threshold.
What this does
- Calls `/check-panel` (default: `http://localhost:8000/check-panel`) for each simulated panel.
- If too many panels are reported as underperforming (efficiency < 80%), it sends an email alert via Resend.

Quick start
1. Create a Python environment and install dependencies:
```
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```
2. Provide `RESEND_API_KEY` via environment variable or `.env` file.
3. Ensure the AI service from `ai/` is running locally on `http://localhost:8000` (or change `QC_POLL_URL` in `utils.py`).
4. Run the scheduled checker:
```
python main.py
```

Testing / development
- For testing, call `check()` manually from a Python shell or run `python -c "from main import check; check()"`
- Replace the simulated `get_solar_panel_data()` in `utils.py` with real data fetching logic to integrate with actual sensors.

Notes
- `main.py` is configured to run `check()` every day at 5 AM using `schedule`.
- Keep SMTP or Resend credentials secure; do not commit secret keys to repository.

# Solaria — QC Alerts

Simple scheduler that polls a QC AI service to check the health of solar panels, simulates sample panel data, and sends an alert email when system efficiency drops below a threshold.

What this does

Quick start
1. Create a Python environment and install dependencies:
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
