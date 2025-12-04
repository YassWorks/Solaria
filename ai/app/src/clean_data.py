import pandas as pd
from pathlib import Path

data_path = Path(__file__).parent.parent / "data"

data1 = pd.read_csv(str(data_path / "data1.csv"))
data2 = pd.read_csv(str(data_path / "data2.csv"))

data1["DATE_TIME"] = pd.to_datetime(data1["DATE_TIME"], format="%d-%m-%Y %H:%M")
data2["DATE_TIME"] = pd.to_datetime(data2["DATE_TIME"], format="%Y-%m-%d %H:%M:%S")

cols_to_keep_in_1 = [
    "DATE_TIME",
    "DC_POWER",
    "AC_POWER",
]

cols_to_keep_in_2 = [
    "DATE_TIME",
    "AMBIENT_TEMPERATURE",
    "MODULE_TEMPERATURE",
    "IRRADIATION",
]

merged_data = pd.merge(data1[cols_to_keep_in_1], data2[cols_to_keep_in_2], on="DATE_TIME", how="inner")
merged_data.to_csv(str(data_path / "data.csv"), index=False)
