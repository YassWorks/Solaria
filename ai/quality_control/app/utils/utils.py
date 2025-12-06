import random


QC_POLL_URL = "http://localhost:8000/check-panel"

NUMBER_OF_SOLAR_PANELS = 20


# simulating solar panel data
# this will be replaced with real data fetching logic from the solar panel system
def get_solar_panel_data() -> dict:
    irradiation = random.uniform(0, 1000)  # in W/m^2
    ambient_temperature = random.uniform(-20, 40)  # in °C
    module_temperature = ambient_temperature + random.uniform(0, 30)  # in °C
    hour = random.randint(0, 23)  # hour of the day
    ac_power = (irradiation / 1000) * random.uniform(0, 5)  # in kW

    payload = {
        "irradiation": irradiation,
        "ambient_temperature": ambient_temperature,
        "module_temperature": module_temperature,
        "hour": hour,
        "ac_power": ac_power,
    }

    return payload
