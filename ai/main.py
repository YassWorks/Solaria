from fastapi import FastAPI
from app.src.underperformance import PanelData, check_underperformance

app = FastAPI()


@app.post("/check-panel")
def check_panel(data: PanelData):
    """Check if a solar panel is underperforming.
    Returns: {"status": 0} if normal, {"status": 1} if underperforming.
    """
    status = check_underperformance(data)
    return {"status": status}
