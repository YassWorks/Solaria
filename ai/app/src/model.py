import pandas as pd
from pathlib import Path

data_path = Path(__file__).parent.parent / "data"
data = pd.read_csv(str(data_path / "data.csv"))

