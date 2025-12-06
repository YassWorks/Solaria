from fastapi import FastAPI
from app.src.setup import setup
from app.src.underperformance import PanelData, check_underperformance

_SETUP_DONE = False
app = FastAPI()


@app.post("/check-panel")
def check_panel(data: PanelData):
    """Check if a solar panel is underperforming.
    Returns: {"status": 0} if normal, {"status": 1} if underperforming.
    """
    global _SETUP_DONE
    if not _SETUP_DONE:
        setup()
        _SETUP_DONE = True

    status = check_underperformance(data)
    return {"status": status}
