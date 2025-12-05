# Energy Token Oracle

Oracle simulator for recording solar production data to the Energy Token smart contract.

## Setup

1. Install dependencies:

```bash
cd oracle
npm install
```

2. Configure environment variables in `../.env`:

```env
CONTRACT_ADDRESS=0xYourContractAddress
ORACLE_PRIVATE_KEY=your_oracle_private_key
DIONE_RPC_URL=https://testnet-rpc.dioneprotocol.com
TOKEN_ID=1
```

## Usage

### Automatic Mode

Record production data automatically at regular intervals:

```bash
npm start           # Default: every 60 minutes
node index.js auto 30    # Every 30 minutes
```

### Record Once

Record production for the current hour:

```bash
node index.js once
```

### Simulate Full Day

Record a full day's production at once (for testing):

```bash
node index.js day        # 500 kW installation
node index.js day 1000   # 1000 kW installation
```

### View Statistics

Display project production statistics:

```bash
node index.js stats
```

## Production Model

The oracle simulates realistic solar production using:

- **Peak hours**: 6 AM - 6 PM
- **Peak production**: Solar noon (12 PM)
- **Capacity factor**: ~80% of installation size
- **Weather variability**: ±15% randomness
- **Bell curve distribution**: Gaussian profile for realistic daylight production

### Example Hourly Production (500 kW installation)

```
06:00 - 45 kWh
07:00 - 156 kWh
08:00 - 285 kWh
09:00 - 365 kWh
10:00 - 402 kWh
11:00 - 425 kWh
12:00 - 440 kWh (peak)
13:00 - 425 kWh
14:00 - 385 kWh
15:00 - 312 kWh
16:00 - 245 kWh
17:00 - 142 kWh
18:00 - 38 kWh
```

Total: ~3,665 kWh/day (typical clear day)

## Development

Run with auto-restart on file changes:

```bash
npm run dev
```

## Integration

In production, replace the simulation logic with real data sources:

- Enphase Enlighten API
- SolarEdge Monitoring API
- Tesla Powerwall API
- Weather-adjusted forecasting models
