import os
import resend
import schedule
import requests
from dotenv import load_dotenv
from app.utils.utils import QC_POLL_URL, NUMBER_OF_SOLAR_PANELS, get_solar_panel_data
import time


load_dotenv()


RESEND_API_KEY = os.getenv("RESEND_API_KEY")


def check():
    """Check the solar panel system and determine whether an emergency exists."""
    n_fails = 0

    for panel_id in range(1, NUMBER_OF_SOLAR_PANELS + 1):
        data = get_solar_panel_data()
        response = requests.post(QC_POLL_URL, json=data)
        result = response.json()

        if result.get("status") == 1:
            n_fails += 1
            print(f"Panel {panel_id} failed QC check.")

    efficiency = (NUMBER_OF_SOLAR_PANELS - n_fails) / NUMBER_OF_SOLAR_PANELS * 100
    print(f"QC Check Complete: {n_fails} panels failed. Efficiency: {efficiency:.2f}%")
    if efficiency < 80.0:
        send_alert_email(n_fails, efficiency)


def send_alert_email(n_fails: int, efficiency: float):
    """Send an alert email."""

    params: resend.Emails.SendParams = {
        "from": "Solaria alert@solaria.com",
        "to": ["communication@steg.com.tn"],
        "subject": "Alert: Solar Panel System Efficiency Drop",
        "html": f"<strong>{n_fails} panels failed QC check. Efficiency: {efficiency:.2f}%</strong>",
    }

    email = resend.Emails.send(params)
    print(email)


if __name__ == "__main__":
    resend.api_key = RESEND_API_KEY

    # schedule the check function to run every day at 5 AM
    schedule.every().day.at("05:00").do(check)

    while True:
        schedule.run_pending()
        time.sleep(1)
