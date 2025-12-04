import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib

data_path = Path(__file__).parent.parent / "data"
df = pd.read_csv(str(data_path / "cleaned_data.csv"))

# X = Inputs (Sunlight, Heat), y = Output (Power)
X = df[['IRRADIATION', 'MODULE_TEMPERATURE']]
y = df['AC_POWER']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100)
model.fit(X_train, y_train)

score = model.score(X_test, y_test)
print(f"Model Accuracy (R^2): {score:.2f}")

# save the model
model_path = Path(__file__).parent.parent / "models"
model_path.mkdir(parents=True, exist_ok=True)

joblib.dump(model, str(model_path / 'solar_qc_model.pkl'))
