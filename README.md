# AeroVolt EV Enterprise
### Next-Generation Electric Two-Wheeler & Multi-EV Range Intelligence, Charging Discovery & Fleet Ecosystem Platform

[![Version](https://img.shields.io/badge/version-2.4.0--enterprise-10b981.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![PWA](https://img.shields.io/badge/PWA-offline--enabled-06b6d4.svg)]()
[![i18n](https://img.shields.io/badge/languages-12%20Global-8b5cf6.svg)]()

**AeroVolt EV Enterprise** is a comprehensive, production-ready, enterprise-grade EV Charging, Range Intelligence, and Fleet Management platform. While initially optimized for electric two-wheelers (scooters, commuter bikes, high-performance electric motorcycles) with specialized parameters such as rider/cargo payload, tyre deflection, riding modes, and battery swapping, the platform seamlessly scales to electric cars and commercial logistics fleets.

---

## 🌟 Key Capabilities & Architectural Highlights

### 1. Multi-Language Global Support (12 Languages)
- Fully localized with dynamic instant language switching and persistence across:
  - 🇬🇧 **English (en)**
  - 🇪🇸 **Español (es)**
  - 🇮🇳 **हिन्दी (hi)**
  - 🇩🇪 **Deutsch (de)**
  - 🇫🇷 **Français (fr)**
  - 🇨🇳 **中文 简体 (zh)**
  - 🇮🇳 **தமிழ் (ta)**
  - 🇯🇵 **日本語 (ja)**
  - 🇧🇷 **Português (pt)**
  - 🇸🇦 **العربية (ar)** *(with dynamic RTL direction support)*
  - 🇮🇹 **Italiano (it)**
  - 🇳🇱 **Nederlands (nl)**

### 2. Multi-Vehicle Garage & Granular Vehicle Profiling
- **Electric Two-Wheelers Pre-Configured**:
  - **Ather 450X Gen 3 / Apex** (3.7 kWh NMC, Ather Grid Fast / 15A Dot)
  - **Ola S1 Pro Gen 2** (4.0 kWh NMC, Hypercharger)
  - **Revolt RV400 BRZ** (3.24 kWh Swappable, 15A Standard)
  - **Ultraviolette F77 Mach 2 Recon** (10.3 kWh High-Performance Liquid-Cooled, Type 2 / CCS2 / Boost)
  - **Hero Vida V1 Pro** (3.94 kWh Removable Dual Pack, Bharat AC001)
  - **TVS iQube ST** (5.1 kWh NMC IP67)
  - **Gogoro SuperSport ACE** (3.4 kWh Swappable Dual 21700 SmartPacks)
  - **Zero SR/F Premium** (17.3 kWh Z-Force Li-Ion)
- **Extensible 4-Wheelers & Future EVs**:
  - **Tata Nexon.ev 45 Long Range** (45 kWh LFP, CCS2 DC 60 kW)
  - **Tesla Model 3 Long Range** (78.1 kWh NMC, Supercharger / CCS2)
- Multi-vehicle switching, custom specs editing (tyre PSI, payload, odometer), and template-based addition.

### 3. Physics & AI-Powered Real-World Range Engine
Rather than relying on static NEDC/WLTP laboratory estimates, AeroVolt runs a multi-variable physical model:
$$\text{Remaining Range} = \frac{E_{\text{usable\_remaining}}}{\text{Effective } Wh/km}$$

Where Effective consumption incorporates:
- **Arrhenius Lithium-Ion Thermal Factor**: Computes internal impedance changes from $-5^\circ\text{C}$ to $45^\circ\text{C}$ (optimal electrochemical peak at $22^\circ\text{C}$–$27^\circ\text{C}$).
- **Payload Mass Scaling**: Models inertial mass and rolling resistance penalty of rider + passenger + delivery cargo against curb weight.
- **Tyre Pressure Deflection**: Detects under-inflation against nominal front/rear PSI and calculates excess rolling resistance $C_{rr}$.
- **Riding Mode Governor**: Throttle maps and velocity limits (Eco $0.85\times$, Ride $1.0\times$, Sport $1.25\times$, Warp/Hyper $1.55\times$).
- **Terrain Elevation Work**: Gravitational potential energy Work = $m \cdot g \cdot \Delta h$ on hill climbs vs kinetic regenerative energy recapture on descents.
- **Weather Aerodynamics**: Quadratic aerodynamic resistance $(v_{\text{rel}})^2$ under strong headwinds or wet surface friction.
- **Urban Traffic Density**: Inertial loss penalty during repeated stop-and-go congestion vs steady cruising.
- **AI Historical Regression**: Continuous machine-learning bias adaptation based on rider's recorded trip telemetry.

### 4. Charging & Swapping Station Discovery (Google Maps / Leaflet)
- Interactive geo-location map with radar range isochrone boundary.
- Real-time compatibility verification matching vehicle inlet with station connectors.
- Station metadata: Operator (Ather Grid, Tata Power EZ Charge, Ola Hypercharger, Gogoro GoStation, Sun Mobility, ChargePoint, Zeon, Jio-bp pulse), port count, vacancy, pricing per kWh, operating hours, amenities, and community star ratings.
- Search and multi-criteria filter chips (Compatible Only, DC Fast, Battery Swap, Available Now, Favorites).
- 30-minute port reservation engine and direct simulation charging launch.

### 5. Intelligent Trip Planner with Automated Charging Stops
- Plan routes along popular corridors (e.g. Bengaluru to Nandi Hills, Tech Corridor, Mysuru Highway, Mumbai–Lonavala).
- Evaluates total energy demand (corridor distance + elevation climb) against remaining battery SoC.
- If energy needed exceeds safe reserves, the algorithm auto-injects optimal compatible charging stops:
  - Arrival SoC at stop
  - Required charging duration to reach recommended departure SoC (e.g. 80% to avoid slow CV phase)
  - Estimated charging cost and total journey elapsed time.

### 6. Telemetry & CC/CV Charging Simulation
- Circular radial animated battery gauge with live range indicator.
- CC/CV (Constant Current / Constant Voltage) Charging Simulator:
  - Fast constant-current phase ($0\%$ to $80\%$ SoC).
  - Power tapering phase ($80\%$ to $100\%$ SoC) protecting battery cells from dendrite formation.
  - Live delivered kWh, cost accumulator, and auto-notification upon completion.
- Battery SOH degradation retention curve (projection over 1,500 charge cycles).
- Comparative financial economy: Petrol 2W cost ($₹2.45/\text{km}$) vs EV cost ($₹0.34/\text{km}$), net accrued savings, and $CO_2$ carbon offset with tree absorption equivalence.

### 7. Commercial Fleet Management Portal
- Designed for logistics, food delivery fleets, and commercial EV operators:
  - Fleet KPI overview: total fleet, active on-duty, currently charging, in maintenance.
  - Telemetry Table: registration plate, model, assigned driver, status, SoC %, SOH %, Wh/km, location, and reassign driver modal.
  - Inefficient Vehicle Detection: automatically flags vehicles consuming $>15\%$ above target efficiency due to aggressive throttle or under-inflated tyres.
  - 1-Click CSV Telemetry Report Export.

### 8. EV Ecosystem, Community & Assistance
- **AI Driving Coach**: Personalized recommendations on throttle smoothing, regenerative braking, cruising sweet spots, and post-ride thermal charging windows.
- **Instant Battery Swapping**: Reserve 2 fresh battery packs at nearby swapping stations in under 60 seconds with animated OTP token.
- **QR Charger Scanner & Digital Tax Receipt**: Mock scan and digital checkout with official GST tax breakdown and downloadable receipt.
- **Emergency Roadside Assistance (SOS)**: 1-touch dispatch for Mobile EV Powerbank Charging Van with GPS coordinates and live ETA countdown.
- **Digital Vehicle Documents Locker**: Securely stores Insurance, RC Book, and Battery Warranty with expiration alerts.
- **Authorized EV Service Centers**: Curated diagnostic and repair clinics with phone dispatch.

---

## 📁 Repository Directory Structure

```
Vasantha_Tactics/
├── index.html                  # Main responsive single-page application interface
├── manifest.json               # Progressive Web App (PWA) manifest
├── service-worker.js           # Offline service worker caching engine
├── server.rb                   # Lightweight Ruby WEBrick local hosting server
├── README.md                   # Comprehensive platform documentation
├── css/
│   └── styles.css              # Dark/Light responsive design system & animations
├── js/
│   ├── i18n.js                 # 12-Language internationalization engine & dictionaries
│   ├── vehicleDatabase.js      # 2W & 4W EV specs, templates, and garage state manager
│   ├── physicsRangeEngine.js   # Multi-variable physics & AI continuous regression engine
│   ├── stationsDatabase.js     # Charging & swapping network database & compatibility logic
│   ├── tripPlanner.js          # Route optimization with automated charging stop injection
│   ├── telemetryDashboard.js   # CC/CV charging simulator, financial economy & degradation
│   ├── alertsEngine.js         # Real-time vehicle diagnostics & predictive alerts
│   ├── fleetManagement.js      # Enterprise fleet telemetry, driver assignments & CSV export
│   ├── communityAndEcosystem.js# AI Coach, Battery Swapping, QR checkout, SOS & Doc Locker
│   ├── apiClient.js            # REST API client synchronizing with SQLite backend
│   └── app.js                  # Master application controller and DOM event coordinator
├── backend/
│   ├── db.rb                   # SQLite3 database schema, migrations, and seed data
│   ├── physics_engine.rb       # Server-side physics & AI personalized range calculations
│   ├── api.rb                  # REST API controller & WEBrick servlet (/api/...)
│   └── server.rb               # Full-stack server launcher mounting API & frontend
├── aerovolt.db                 # SQLite database file with seeded production tables
├── test_backend.rb             # Automated 18-step backend test suite
└── assets/
    └── icon.svg                # High-resolution vector PWA brand icon
```

---

## ⚡ Working REST API Backend & SQLite Architecture

AeroVolt EV Enterprise includes a fully operational REST API backend running on Ruby & SQLite:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check, database status, and uptime |
| `POST` | `/api/auth/login` | Secure authentication with demo token generation |
| `GET` | `/api/auth/me` | Authenticated user profile |
| `GET` | `/api/vehicles` | List all vehicles registered to the user |
| `POST` | `/api/vehicles` | Register a new EV with full technical specifications |
| `PUT` | `/api/vehicles/:id` | Update vehicle telemetry, tyre PSI, SoC, and payload |
| `DELETE`| `/api/vehicles/:id` | Remove vehicle from garage |
| `POST` | `/api/range/estimate` | Run server-side physics & AI range prediction |
| `GET` | `/api/stations` | Search and filter charging & swapping stations |
| `POST` | `/api/routes/plan` | Server-side trip planner with automated charging stops |
| `GET` | `/api/charging/sessions` | Fetch user charging session history |
| `POST` | `/api/charging/sessions/start` | Start live CC/CV charging session |
| `POST` | `/api/charging/sessions/stop` | Finalize charging session and update SoC in SQLite |
| `GET` | `/api/fleet/summary` | Aggregated enterprise fleet KPIs & $CO_2$ offsets |
| `GET` | `/api/fleet/vehicles` | Live commercial fleet telemetry and inefficiency flags |
| `POST` | `/api/fleet/assign-driver` | Reassign driver to fleet vehicle |
| `GET` | `/api/fleet/export/csv` | Download complete fleet telemetry CSV file |
| `POST` | `/api/ecosystem/swap/reserve` | Reserve 2 fresh battery packs with 6-digit OTP |
| `POST` | `/api/ecosystem/payments/checkout` | Process QR checkout & generate official GST receipt |
| `POST` | `/api/ecosystem/sos/dispatch` | 1-Touch Emergency Roadside Rescue Dispatch |
| `GET` | `/api/ecosystem/documents` | Retrieve digital vehicle documents locker |

---

## 🚀 Getting Started & Execution

The application is built with zero external npm dependencies required to run.

### Option 1: Start Full-Stack Backend & Frontend Server
Run the built-in server from the project root:
```bash
ruby server.rb
```
Output:
```
=================================================================
  🚀 AeroVolt EV Enterprise - Full-Stack Working Backend & Frontend
=================================================================
  Local Application URL : http://localhost:8080
  REST API Base URL     : http://localhost:8080/api
  Health Check Endpoint : http://localhost:8080/api/health
  SQLite Database File  : .../Vasantha_Tactics/aerovolt.db
  Static Assets Root    : .../Vasantha_Tactics
=================================================================
```

### Option 2: Run Automated Backend Test Suite
Verify all 18 backend tests against the database, physics engine, and API servlet:
```bash
ruby test_backend.rb
```
Output:
```
========================================================
  🧪 Running AeroVolt EV Enterprise Backend Test Suite
========================================================
[1] Testing SQLite Database Connection & Seeds...
  [PASS] Seeded users exist (2 found)
  [PASS] Seeded vehicles exist (2 found)
  [PASS] Seeded charging/swapping stations exist (6 found)
  [PASS] Seeded fleet vehicles exist (6 found)
...
========================================================
  🎉 Test Suite Summary: 18 Passed, 0 Failed
========================================================
```

### Option 3: Direct Browser Launch
```bash
open index.html
```

### Option 4: Mobile PWA Installation
1. Open the app in Safari (iOS) or Chrome (Android).
2. Tap **Share** (iOS) or the **Three Dots Menu** (Android).
3. Select **Add to Home Screen**.
4. The application installs as a native-like standalone app with offline support enabled by `service-worker.js`.

---

## 🧪 Interactive Testing Guide

1. **Test Real-Time Range Recalculation**:
   - Go to the **Dashboard**.
   - Move the **Ambient Temperature** slider to $-5^\circ\text{C}$ or $42^\circ\text{C}$ to watch the remaining range adjust dynamically based on thermal efficiency.
   - Adjust **Rider & Cargo Payload** from $78\text{ kg}$ to $180\text{ kg}$ to see the physical weight penalty applied to 2W rolling resistance.
   - Switch **Riding Mode** from *Eco* to *Warp/Hyper* to observe throttle energy scaling.
2. **Test Live CC/CV Charging Simulation**:
   - On the **Dashboard**, click **Start Simulation Charging**.
   - Observe the live wattage output, energy delivered in kWh, and cost accumulating. Notice that as SoC passes 80%, the charger power automatically tapers to simulate battery life preservation.
3. **Test Trip Route Planning with Auto-Stops**:
   - Navigate to **Trip Planner**.
   - Select the pre-configured corridor **Bengaluru City to Nandi Hills (62.5 km)**.
   - Click **Calculate Optimal EV Route & Stops**.
   - The engine evaluates the 550m hill elevation gain and automatically inserts a recommended fast charging stop with exact arrival SoC and recharge time.
4. **Test Fleet Portal & Telemetry Export**:
   - Navigate to **Fleet Portal**.
   - Review the telemetry status of commercial vehicles. Identify the vehicle flagged as *Inefficient* (high Wh/km).
   - Click **📥 Download Fleet CSV Telemetry** to download the CSV export.
5. **Test Ecosystem Features**:
   - Navigate to **Ecosystem & AI**.
   - Click **Reserve 2 Fresh Packs (60s guarantee)** to simulate battery swapping reservation.
   - Click **Scan Station QR & Pay** to generate a digital GST receipt.
   - Click **Dispatch Emergency SOS Rescue** to test roadside assistance dispatch.
6. **Test Language Switching**:
   - Use the language selector in the top-right header to switch between English, Español, हिन्दी, தமிழ், Deutsch, Français, 中文, 日本語, and العربية (which automatically adapts the layout to RTL).

---

## 🛡️ Enterprise Architecture & Security Standards
- **Client-Side Encryption & Offline Resilience**: Critical telemetry, vehicle state, and document metadata are stored with zero third-party leakage in LocalStorage/IndexedDB.
- **REST / Real-Time API Ready**: Structured modular classes (`VehicleManager`, `StationsManager`, `FleetManager`) are designed for drop-in connection to enterprise telemetry backends (MQTT, WebSockets, OCPP 1.6J/2.0.1 for charging station management).
- **Responsive Layout**: Fluid breakpoints catering to smartphones ($320\text{px}$–$480\text{px}$), tablets ($768\text{px}$–$1024\text{px}$), and enterprise desktop monitoring displays ($1200\text{px}+$ with dark/light theme).
