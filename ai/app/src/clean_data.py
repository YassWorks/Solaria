import pandas as pd
from pathlib import Path


data_path = Path(__file__).parent.parent / "data"
df = pd.read_csv(str(data_path / "data.csv"))

old_count = df.shape[0]

# remove any rows where AC_POWER or DC_POWER or IRRADIATION is 0
df = df[(df['AC_POWER'] != 0) & (df['DC_POWER'] != 0) & (df['IRRADIATION'] != 0)]

new_count = df.shape[0]

print(f"Removed {old_count - new_count} rows.")

df.to_csv(str(data_path / "cleaned_data.csv"), index=False)
