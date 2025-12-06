# Energy Token - Supported Project Types & Subtypes

## 📊 Project Type Classification

The Energy Token platform supports multiple renewable energy project types. Each project must specify both a **type** and **subtype** for proper categorization.

---

## 🌞 Solar Energy

### Type: `"Solar"`

#### Subtypes:

**`"Photovoltaic"`** (PV)

- Traditional solar panels converting sunlight directly to electricity
- Most common type
- Examples: Rooftop installations, ground-mounted solar farms
- Typical lifespan: 25-30 years

**`"Molten Salt"`** (Concentrated Solar Power - CSP)

- Uses mirrors/lenses to concentrate sunlight
- Heat stored in molten salt for continuous generation
- Better for utility-scale projects
- Examples: Solar thermal power plants
- Typical lifespan: 30-40 years

**`"Thin Film"`**

- Lightweight, flexible solar cells
- Lower efficiency but cheaper production
- Good for building-integrated photovoltaics
- Typical lifespan: 20-25 years

**`"Concentrated PV"`**

- Uses lenses/mirrors to concentrate sunlight onto high-efficiency cells
- Higher efficiency than standard PV
- Requires tracking systems
- Typical lifespan: 25-30 years

---

## 💨 Wind Energy

### Type: `"Wind"`

#### Subtypes:

**`"Onshore"`**

- Wind turbines on land
- Most economical wind energy
- Examples: Wind farms, single turbines
- Typical lifespan: 20-25 years

**`"Offshore"`**

- Wind turbines in bodies of water
- Higher wind speeds, higher costs
- More consistent energy production
- Typical lifespan: 25-30 years

**`"Distributed"`**

- Small-scale turbines for local use
- Residential or small commercial
- Lower capacity but flexible placement
- Typical lifespan: 15-20 years

**`"Floating Offshore"`**

- Advanced offshore turbines on floating platforms
- Can be deployed in deeper waters
- Emerging technology
- Typical lifespan: 25-30 years

---

## 💧 Hydroelectric Energy

### Type: `"Hydro"`

#### Subtypes:

**`"Run-of-River"`**

- Uses natural river flow
- Minimal environmental impact
- No large reservoir needed
- Typical lifespan: 50+ years

**`"Reservoir"`**

- Dam-based hydroelectric
- Provides energy storage capability
- Larger scale projects
- Typical lifespan: 50-100 years

**`"Pumped Storage"`**

- Water pumped uphill when electricity is cheap
- Released through turbines when needed
- Acts as grid-scale battery
- Typical lifespan: 50-100 years

**`"Tidal"`**

- Uses ocean tides for generation
- Predictable energy source
- Coastal locations only
- Typical lifespan: 30-40 years

**`"Wave"`**

- Captures energy from ocean waves
- Emerging technology
- Coastal locations
- Typical lifespan: 20-30 years

---

## 🌍 Geothermal Energy

### Type: `"Geothermal"`

#### Subtypes:

**`"Flash Steam"`**

- Uses high-pressure hot water from underground
- Water "flashes" to steam to drive turbines
- Most common geothermal type
- Typical lifespan: 30-50 years

**`"Binary Cycle"`**

- Uses moderate-temperature water
- Heat transferred to secondary fluid
- More locations viable
- Typical lifespan: 30-50 years

**`"Dry Steam"`**

- Direct steam from underground
- Rarest but most efficient
- Limited locations
- Typical lifespan: 30-50 years

**`"Enhanced Geothermal"`** (EGS)

- Engineered reservoir in hot rock
- Expands viable locations
- Emerging technology
- Typical lifespan: 30-50 years

---

## 🔋 Energy Storage (Hybrid Projects)

### Type: `"Storage"`

#### Subtypes:

**`"Battery"`**

- Lithium-ion, flow batteries, etc.
- Grid-scale energy storage
- Pairs with renewable generation
- Typical lifespan: 10-20 years

**`"Hydrogen"`**

- Green hydrogen production and storage
- Long-duration storage
- Can be used for fuel
- Typical lifespan: 20-30 years

**`"Compressed Air"`**

- Stores energy as compressed air in caverns
- Large-scale storage
- Geographic constraints
- Typical lifespan: 30-40 years

**`"Flywheel"`**

- Mechanical energy storage
- Short-duration, high-power
- Grid stability applications
- Typical lifespan: 20-30 years

---

## 🌱 Biomass Energy

### Type: `"Biomass"`

#### Subtypes:

**`"Direct Combustion"`**

- Burns organic material for heat/electricity
- Agricultural waste, wood chips
- Widely deployable
- Typical lifespan: 20-30 years

**`"Anaerobic Digestion"`**

- Converts organic waste to biogas
- Agricultural/municipal waste
- Can reduce methane emissions
- Typical lifespan: 20-30 years

**`"Gasification"`**

- Converts biomass to synthetic gas
- More efficient than direct combustion
- Various feedstocks
- Typical lifespan: 20-30 years

**`"Landfill Gas"`**

- Captures methane from landfills
- Waste-to-energy
- Reduces greenhouse gases
- Typical lifespan: 15-25 years

---

## 🔬 Emerging Technologies

### Type: `"Emerging"`

#### Subtypes:

**`"Fusion"`** (Future)

- Nuclear fusion energy
- Still in development
- Potentially unlimited clean energy

**`"Space Solar"`**

- Solar panels in space transmitting energy to Earth
- Experimental phase
- No atmospheric interference

**`"Ocean Thermal"`**

- Uses temperature difference in ocean layers
- Tropical locations
- Baseload power potential

**`"Piezoelectric"`**

- Generates electricity from mechanical stress
- Small-scale applications
- Innovative deployment locations

---

## 📝 Usage Examples

### Creating Projects

```javascript
// Solar Photovoltaic Project
await energyToken.createProject(
  "Desert Sun Solar Farm",
  "Nevada, USA",
  "Solar",
  "Photovoltaic"
  // ... other parameters
);

// Offshore Wind Project
await energyToken.createProject(
  "Atlantic Wind Farm",
  "Coast of Massachusetts",
  "Wind",
  "Offshore"
  // ... other parameters
);

// Hydroelectric Dam
await energyToken.createProject(
  "Mountain River Hydro",
  "Colorado, USA",
  "Hydro",
  "Run-of-River"
  // ... other parameters
);

// Geothermal Plant
await energyToken.createProject(
  "Yellowstone Geothermal",
  "Wyoming, USA",
  "Geothermal",
  "Binary Cycle"
  // ... other parameters
);

// Solar Thermal with Storage
await energyToken.createProject(
  "Mojave Solar Thermal",
  "California, USA",
  "Solar",
  "Molten Salt"
  // ... other parameters
);

// Tidal Energy
await energyToken.createProject(
  "Bay of Fundy Tidal",
  "Nova Scotia, Canada",
  "Hydro",
  "Tidal"
  // ... other parameters
);
```

---

## 🎯 Best Practices

1. **Be Specific**: Use the most accurate subtype for your project
2. **Consistency**: Use the same capitalization (Title Case recommended)
3. **Documentation**: Reference this guide in project documents
4. **Updates**: Technology evolves - new subtypes can be added as strings
5. **Validation**: Backend should validate against known types when possible

---

## 🔄 Custom Types

While the contract accepts any string values, standardizing around these types helps with:

- Frontend filtering and categorization
- Analytics and reporting
- Investor searching for specific technologies
- Portfolio diversification tracking

For new/custom types not listed here:

- Document clearly in project IPFS documents
- Consider proposing addition to this standard list
- Ensure type makes sense for tokenized energy production

---

## 📊 Project Type Statistics (Example Backend Query)

```javascript
// Get all Solar Photovoltaic projects
const pvProjects = allProjects.filter(
  (p) => p.projectType === "Solar" && p.projectSubtype === "Photovoltaic"
);

// Get all offshore projects (Wind or Hydro)
const offshoreProjects = allProjects.filter(
  (p) => p.projectSubtype.includes("Offshore") || p.projectSubtype === "Tidal"
);

// Portfolio diversification
const portfolioByType = portfolio.reduce((acc, inv) => {
  const type = inv.projectType;
  acc[type] = (acc[type] || 0) + Number(inv.shares);
  return acc;
}, {});
```

---

**This classification system makes Energy Token truly multi-energy! 🌍⚡**
