/**
 * Enterprise EV Platform - Vehicle Database & Garage Manager
 * Supports 2-Wheelers (scooters, commuter bikes, performance bikes) and 4-Wheelers (cars).
 */

const VEHICLE_TEMPLATES = [
  // --- 2-WHEELERS: SCOOTERS & BIKES ---
  {
    id: "tpl_ather_450x",
    category: "2w_scooter",
    make: "Ather Energy",
    model: "450X Gen 3 (3.7 kWh)",
    year: 2024,
    batteryCapacityKwh: 3.7,
    usableCapacityKwh: 3.24,
    batteryType: "NMC (Nickel Manganese Cobalt)",
    nominalVoltage: 51.1,
    ratedRangeKm: 150,
    baseEfficiencyWhPerKm: 34,
    supportedConnectors: ["Ather Grid Fast", "15A 3-Pin AC (Ather Dot)"],
    supportedChargingTypes: ["DC Fast (1.5 km/min)", "AC Home Slow (3.3 kW)"],
    maxChargingPowerKw: 3.3,
    maxDcFastPowerKw: 6.0,
    curbWeightKg: 111.6,
    nominalTyrePsi: { front: 30, rear: 32 },
    ridingModes: [
      { name: "Eco", factor: 0.85, topSpeedKmH: 50 },
      { name: "Ride", factor: 1.0, topSpeedKmH: 65 },
      { name: "Sport", factor: 1.25, topSpeedKmH: 80 },
      { name: "Warp", factor: 1.55, topSpeedKmH: 90 }
    ],
    defaultMode: "Ride",
    image: "assets/ather_450x.png"
  },
  {
    id: "tpl_ola_s1_pro",
    category: "2w_scooter",
    make: "Ola Electric",
    model: "S1 Pro Gen 2",
    year: 2024,
    batteryCapacityKwh: 4.0,
    usableCapacityKwh: 3.7,
    batteryType: "NMC",
    nominalVoltage: 58.8,
    ratedRangeKm: 195,
    baseEfficiencyWhPerKm: 32,
    supportedConnectors: ["Ola Hypercharger", "15A 3-Pin AC"],
    supportedChargingTypes: ["DC Fast Hypercharge", "AC Home Portable"],
    maxChargingPowerKw: 2.2,
    maxDcFastPowerKw: 8.0,
    curbWeightKg: 116,
    nominalTyrePsi: { front: 33, rear: 36 },
    ridingModes: [
      { name: "Eco", factor: 0.82, topSpeedKmH: 45 },
      { name: "Normal", factor: 1.0, topSpeedKmH: 80 },
      { name: "Sport", factor: 1.28, topSpeedKmH: 100 },
      { name: "Hyper", factor: 1.62, topSpeedKmH: 120 }
    ],
    defaultMode: "Normal",
    image: "assets/ola_s1_pro.png"
  },
  {
    id: "tpl_revolt_rv400",
    category: "2w_bike",
    make: "Revolt Motors",
    model: "RV400 BRZ",
    year: 2024,
    batteryCapacityKwh: 3.24,
    usableCapacityKwh: 3.0,
    batteryType: "Lithium-Ion Removable",
    nominalVoltage: 72,
    ratedRangeKm: 150,
    baseEfficiencyWhPerKm: 30,
    supportedConnectors: ["15A 3-Pin AC", "Removable Pack Fast Dock", "Battery Swap"],
    supportedChargingTypes: ["AC Standard 3.3 kW", "Direct Pack Swapping"],
    maxChargingPowerKw: 2.5,
    maxDcFastPowerKw: 4.0,
    curbWeightKg: 108,
    nominalTyrePsi: { front: 29, rear: 33 },
    ridingModes: [
      { name: "Eco", factor: 0.85, topSpeedKmH: 45 },
      { name: "Normal", factor: 1.0, topSpeedKmH: 65 },
      { name: "Sports", factor: 1.35, topSpeedKmH: 85 }
    ],
    defaultMode: "Normal",
    image: "assets/revolt_rv400.png"
  },
  {
    id: "tpl_uv_f77",
    category: "2w_bike",
    make: "Ultraviolette Automotive",
    model: "F77 Mach 2 Recon",
    year: 2024,
    batteryCapacityKwh: 10.3,
    usableCapacityKwh: 9.8,
    batteryType: "NMC Advanced Liquid Cooled",
    nominalVoltage: 108,
    ratedRangeKm: 323,
    baseEfficiencyWhPerKm: 42,
    supportedConnectors: ["Type 2 AC", "CCS2 DC", "UV Boost Charger"],
    supportedChargingTypes: ["Type 2 3.3 kW", "Fast Boost 6.6 kW", "DC Fast 12 kW"],
    maxChargingPowerKw: 6.6,
    maxDcFastPowerKw: 12.0,
    curbWeightKg: 207,
    nominalTyrePsi: { front: 32, rear: 36 },
    ridingModes: [
      { name: "Glide", factor: 0.86, topSpeedKmH: 80 },
      { name: "Combat", factor: 1.05, topSpeedKmH: 120 },
      { name: "Ballistic", factor: 1.58, topSpeedKmH: 155 }
    ],
    defaultMode: "Combat",
    image: "assets/uv_f77.png"
  },
  {
    id: "tpl_hero_vida_v1",
    category: "2w_scooter",
    make: "Hero MotoCorp",
    model: "Vida V1 Pro",
    year: 2024,
    batteryCapacityKwh: 3.94,
    usableCapacityKwh: 3.44,
    batteryType: "Removable Dual Lithium Pack",
    nominalVoltage: 51.2,
    ratedRangeKm: 165,
    baseEfficiencyWhPerKm: 33,
    supportedConnectors: ["Bharat AC001", "15A 3-Pin AC", "Removable Pack Dock"],
    supportedChargingTypes: ["AC Fast Public", "Portable Home Charger", "Pack Swapping"],
    maxChargingPowerKw: 3.3,
    maxDcFastPowerKw: 5.0,
    curbWeightKg: 125,
    nominalTyrePsi: { front: 29, rear: 32 },
    ridingModes: [
      { name: "Eco", factor: 0.84, topSpeedKmH: 40 },
      { name: "Ride", factor: 1.0, topSpeedKmH: 60 },
      { name: "Sport", factor: 1.25, topSpeedKmH: 80 },
      { name: "Custom", factor: 1.1, topSpeedKmH: 70 }
    ],
    defaultMode: "Ride",
    image: "assets/vida_v1.png"
  },
  {
    id: "tpl_tvs_iqube",
    category: "2w_scooter",
    make: "TVS Motor",
    model: "iQube ST (5.1 kWh)",
    year: 2024,
    batteryCapacityKwh: 5.1,
    usableCapacityKwh: 4.56,
    batteryType: "NMC IP67 Protected",
    nominalVoltage: 52,
    ratedRangeKm: 150,
    baseEfficiencyWhPerKm: 36,
    supportedConnectors: ["Bharat AC001", "15A 3-Pin AC"],
    supportedChargingTypes: ["AC 950W Fast Plug", "AC 650W Portable"],
    maxChargingPowerKw: 2.5,
    maxDcFastPowerKw: 3.3,
    curbWeightKg: 128,
    nominalTyrePsi: { front: 28, rear: 32 },
    ridingModes: [
      { name: "Eco", factor: 0.88, topSpeedKmH: 50 },
      { name: "Power", factor: 1.18, topSpeedKmH: 82 }
    ],
    defaultMode: "Eco",
    image: "assets/tvs_iqube.png"
  },
  {
    id: "tpl_gogoro_supersport",
    category: "2w_scooter",
    make: "Gogoro",
    model: "SuperSport ACE",
    year: 2024,
    batteryCapacityKwh: 3.4,
    usableCapacityKwh: 3.1,
    batteryType: "Gogoro Network Swappable Dual 21700",
    nominalVoltage: 48,
    ratedRangeKm: 170,
    baseEfficiencyWhPerKm: 31,
    supportedConnectors: ["Gogoro GoStation Swappable", "15A 3-Pin AC"],
    supportedChargingTypes: ["Instant Battery Swap (<60s)", "AC Home Dock"],
    maxChargingPowerKw: 2.0,
    maxDcFastPowerKw: 10.0,
    curbWeightKg: 104,
    nominalTyrePsi: { front: 30, rear: 32 },
    ridingModes: [
      { name: "Super Eco", factor: 0.80, topSpeedKmH: 45 },
      { name: "Smart Urban", factor: 1.0, topSpeedKmH: 75 },
      { name: "Sport Boost", factor: 1.32, topSpeedKmH: 96 }
    ],
    defaultMode: "Smart Urban",
    image: "assets/gogoro.png"
  },
  {
    id: "tpl_zero_srf",
    category: "2w_bike",
    make: "Zero Motorcycles",
    model: "SR/F Premium",
    year: 2024,
    batteryCapacityKwh: 17.3,
    usableCapacityKwh: 15.2,
    batteryType: "Z-Force Li-Ion High Output",
    nominalVoltage: 102,
    ratedRangeKm: 272,
    baseEfficiencyWhPerKm: 65,
    supportedConnectors: ["Type 2 AC", "CCS2 DC", "J1772"],
    supportedChargingTypes: ["Level 2 AC 6.0 kW", "Rapid Charge 12 kW"],
    maxChargingPowerKw: 6.0,
    maxDcFastPowerKw: 12.0,
    curbWeightKg: 227,
    nominalTyrePsi: { front: 36, rear: 40 },
    ridingModes: [
      { name: "Eco", factor: 0.85, topSpeedKmH: 90 },
      { name: "Rain", factor: 0.90, topSpeedKmH: 90 },
      { name: "Standard", factor: 1.05, topSpeedKmH: 140 },
      { name: "Sport", factor: 1.45, topSpeedKmH: 200 }
    ],
    defaultMode: "Standard",
    image: "assets/zero_srf.png"
  },

  // --- 4-WHEELERS: EXTENSIBLE CARS / COMMERCIAL FLEET ---
  {
    id: "tpl_tata_nexon_ev",
    category: "4w_car",
    make: "Tata Motors",
    model: "Nexon.ev Empowered 45",
    year: 2024,
    batteryCapacityKwh: 45.0,
    usableCapacityKwh: 43.0,
    batteryType: "LFP (Lithium Iron Phosphate)",
    nominalVoltage: 380,
    ratedRangeKm: 489,
    baseEfficiencyWhPerKm: 120,
    supportedConnectors: ["CCS2 DC", "Type 2 AC", "15A 3-Pin AC"],
    supportedChargingTypes: ["DC Fast 60 kW", "AC 7.2 kW Wallbox", "Portable 3.3 kW"],
    maxChargingPowerKw: 7.2,
    maxDcFastPowerKw: 60.0,
    curbWeightKg: 1450,
    nominalTyrePsi: { front: 34, rear: 34 },
    ridingModes: [
      { name: "Eco", factor: 0.88, topSpeedKmH: 100 },
      { name: "City", factor: 1.0, topSpeedKmH: 120 },
      { name: "Sport", factor: 1.25, topSpeedKmH: 150 }
    ],
    defaultMode: "City",
    image: "assets/tata_nexon.png"
  },
  {
    id: "tpl_tesla_model3",
    category: "4w_car",
    make: "Tesla",
    model: "Model 3 Long Range AWD",
    year: 2024,
    batteryCapacityKwh: 78.1,
    usableCapacityKwh: 75.0,
    batteryType: "NMC 2170 Cylindrical",
    nominalVoltage: 355,
    ratedRangeKm: 629,
    baseEfficiencyWhPerKm: 140,
    supportedConnectors: ["Tesla Supercharger", "CCS2 DC", "Type 2 AC"],
    supportedChargingTypes: ["Supercharging V3/V4 250 kW", "Destination AC 11 kW"],
    maxChargingPowerKw: 11.0,
    maxDcFastPowerKw: 250.0,
    curbWeightKg: 1828,
    nominalTyrePsi: { front: 42, rear: 42 },
    ridingModes: [
      { name: "Chill", factor: 0.88, topSpeedKmH: 140 },
      { name: "Standard", factor: 1.0, topSpeedKmH: 201 }
    ],
    defaultMode: "Standard",
    image: "assets/tesla_model3.png"
  }
];

const DEFAULT_USER_VEHICLES = [
  {
    id: "veh_user_1",
    templateId: "tpl_ather_450x",
    name: "Ather 450X Cyber Black",
    nickname: "Daily Stealth",
    category: "2w_scooter",
    make: "Ather Energy",
    model: "450X Gen 3",
    year: 2024,
    regNumber: "KA-01-EV-4509",
    batteryCapacityKwh: 3.7,
    usableCapacityKwh: 3.24,
    batteryType: "NMC",
    nominalVoltage: 51.1,
    ratedRangeKm: 150,
    baseEfficiencyWhPerKm: 34,
    currentSocPercent: 78,
    batteryHealthSohPercent: 96.5,
    batteryCycles: 142,
    odometerKm: 4890,
    currentRidingMode: "Ride",
    avgHistoricalEfficiencyWhPerKm: 35.8,
    riderPayloadKg: 78,
    tyreFrontPsi: 29.5,
    tyreRearPsi: 31.8,
    tyreFrontNominalPsi: 30,
    tyreRearNominalPsi: 32,
    tyreCondition: "Good",
    serviceStatus: "OK",
    lastServiceDate: "2024-06-15",
    nextServiceOdo: 7500,
    insuranceExpiry: "2025-11-20",
    pucExpiry: "2025-12-10",
    supportedConnectors: ["Ather Grid Fast", "15A 3-Pin AC (Ather Dot)"],
    maxChargingPowerKw: 3.3,
    maxDcFastPowerKw: 6.0,
    isFavorite: true,
    isFleet: false,
    ridingModes: [
      { name: "Eco", factor: 0.85, topSpeedKmH: 50 },
      { name: "Ride", factor: 1.0, topSpeedKmH: 65 },
      { name: "Sport", factor: 1.25, topSpeedKmH: 80 },
      { name: "Warp", factor: 1.55, topSpeedKmH: 90 }
    ],
    recentTrips: [
      { date: "Yesterday", distanceKm: 18.4, whPerKm: 33.2, socUsedPercent: 19, avgSpeed: 38 },
      { date: "2 days ago", distanceKm: 27.6, whPerKm: 37.1, socUsedPercent: 31, avgSpeed: 44 },
      { date: "3 days ago", distanceKm: 12.0, whPerKm: 31.8, socUsedPercent: 12, avgSpeed: 32 }
    ]
  },
  {
    id: "veh_user_2",
    templateId: "tpl_uv_f77",
    name: "Ultraviolette F77 Mach 2 Recon",
    nickname: "Thunder Wing",
    category: "2w_bike",
    make: "Ultraviolette Automotive",
    model: "F77 Mach 2 Recon",
    year: 2024,
    regNumber: "KA-04-EV-7700",
    batteryCapacityKwh: 10.3,
    usableCapacityKwh: 9.8,
    batteryType: "NMC Advanced Liquid Cooled",
    nominalVoltage: 108,
    ratedRangeKm: 323,
    baseEfficiencyWhPerKm: 42,
    currentSocPercent: 62,
    batteryHealthSohPercent: 99.1,
    batteryCycles: 48,
    odometerKm: 1840,
    currentRidingMode: "Combat",
    avgHistoricalEfficiencyWhPerKm: 44.5,
    riderPayloadKg: 85,
    tyreFrontPsi: 32,
    tyreRearPsi: 36,
    tyreFrontNominalPsi: 32,
    tyreRearNominalPsi: 36,
    tyreCondition: "Excellent",
    serviceStatus: "OK",
    lastServiceDate: "2024-08-01",
    nextServiceOdo: 5000,
    insuranceExpiry: "2026-03-15",
    pucExpiry: "2026-03-15",
    supportedConnectors: ["Type 2 AC", "CCS2 DC", "UV Boost Charger"],
    maxChargingPowerKw: 6.6,
    maxDcFastPowerKw: 12.0,
    isFavorite: false,
    isFleet: false,
    ridingModes: [
      { name: "Glide", factor: 0.86, topSpeedKmH: 80 },
      { name: "Combat", factor: 1.05, topSpeedKmH: 120 },
      { name: "Ballistic", factor: 1.58, topSpeedKmH: 155 }
    ],
    recentTrips: [
      { date: "Yesterday", distanceKm: 44.2, whPerKm: 43.1, socUsedPercent: 21, avgSpeed: 58 },
      { date: "Last Weekend", distanceKm: 112.0, whPerKm: 46.8, socUsedPercent: 54, avgSpeed: 72 }
    ]
  },
  {
    id: "veh_user_3",
    templateId: "tpl_tata_nexon_ev",
    name: "Tata Nexon.ev 45 Long Range",
    nickname: "Family Cruiser",
    category: "4w_car",
    make: "Tata Motors",
    model: "Nexon.ev Empowered 45",
    year: 2024,
    regNumber: "KA-03-EV-9922",
    batteryCapacityKwh: 45.0,
    usableCapacityKwh: 43.0,
    batteryType: "LFP",
    nominalVoltage: 380,
    ratedRangeKm: 489,
    baseEfficiencyWhPerKm: 120,
    currentSocPercent: 84,
    batteryHealthSohPercent: 98.2,
    batteryCycles: 89,
    odometerKm: 9420,
    currentRidingMode: "City",
    avgHistoricalEfficiencyWhPerKm: 126,
    riderPayloadKg: 210,
    tyreFrontPsi: 33.5,
    tyreRearPsi: 33.8,
    tyreFrontNominalPsi: 34,
    tyreRearNominalPsi: 34,
    tyreCondition: "Good",
    serviceStatus: "OK",
    lastServiceDate: "2024-05-10",
    nextServiceOdo: 15000,
    insuranceExpiry: "2025-09-01",
    pucExpiry: "2025-09-01",
    supportedConnectors: ["CCS2 DC", "Type 2 AC", "15A 3-Pin AC"],
    maxChargingPowerKw: 7.2,
    maxDcFastPowerKw: 60.0,
    isFavorite: false,
    isFleet: false,
    ridingModes: [
      { name: "Eco", factor: 0.88, topSpeedKmH: 100 },
      { name: "City", factor: 1.0, topSpeedKmH: 120 },
      { name: "Sport", factor: 1.25, topSpeedKmH: 150 }
    ],
    recentTrips: [
      { date: "Yesterday", distanceKm: 32.0, whPerKm: 122, socUsedPercent: 9, avgSpeed: 42 }
    ]
  }
];

class VehicleManager {
  constructor() {
    this.vehicles = [];
    this.activeVehicleId = null;
    this.init();
  }

  init() {
    const stored = localStorage.getItem('aerovolt_vehicles');
    if (stored) {
      try {
        this.vehicles = JSON.parse(stored);
      } catch (e) {
        this.vehicles = [...DEFAULT_USER_VEHICLES];
      }
    } else {
      this.vehicles = [...DEFAULT_USER_VEHICLES];
      this.persist();
    }

    const storedActive = localStorage.getItem('aerovolt_active_vehicle_id');
    if (storedActive && this.getVehicleById(storedActive)) {
      this.activeVehicleId = storedActive;
    } else if (this.vehicles.length > 0) {
      this.activeVehicleId = this.vehicles[0].id;
      localStorage.setItem('aerovolt_active_vehicle_id', this.activeVehicleId);
    }
  }

  persist() {
    localStorage.setItem('aerovolt_vehicles', JSON.stringify(this.vehicles));
  }

  getActiveVehicle() {
    return this.vehicles.find(v => v.id === this.activeVehicleId) || this.vehicles[0];
  }

  setActiveVehicle(id) {
    if (this.vehicles.some(v => v.id === id)) {
      this.activeVehicleId = id;
      localStorage.setItem('aerovolt_active_vehicle_id', id);
      window.dispatchEvent(new CustomEvent('activeVehicleChanged', { detail: { vehicle: this.getActiveVehicle() } }));
      return true;
    }
    return false;
  }

  getVehicleById(id) {
    return this.vehicles.find(v => v.id === id);
  }

  getAllVehicles() {
    return this.vehicles;
  }

  getTemplates() {
    return VEHICLE_TEMPLATES;
  }

  addVehicleFromTemplate(templateId, customData = {}) {
    const tpl = VEHICLE_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return null;

    const newVehicle = {
      id: "veh_" + Date.now(),
      templateId: tpl.id,
      name: customData.name || `${tpl.make} ${tpl.model}`,
      nickname: customData.nickname || tpl.model,
      category: tpl.category,
      make: tpl.make,
      model: tpl.model,
      year: customData.year || tpl.year,
      regNumber: customData.regNumber || "EV-" + Math.floor(1000 + Math.random() * 9000),
      batteryCapacityKwh: customData.batteryCapacityKwh || tpl.batteryCapacityKwh,
      usableCapacityKwh: tpl.usableCapacityKwh,
      batteryType: customData.batteryType || tpl.batteryType,
      nominalVoltage: tpl.nominalVoltage,
      ratedRangeKm: customData.ratedRangeKm || tpl.ratedRangeKm,
      baseEfficiencyWhPerKm: customData.baseEfficiencyWhPerKm || tpl.baseEfficiencyWhPerKm,
      currentSocPercent: customData.currentSocPercent || 90,
      batteryHealthSohPercent: customData.batteryHealthSohPercent || 98.0,
      batteryCycles: customData.batteryCycles || 15,
      odometerKm: customData.odometerKm || 500,
      currentRidingMode: tpl.defaultMode,
      avgHistoricalEfficiencyWhPerKm: tpl.baseEfficiencyWhPerKm * 1.05,
      riderPayloadKg: customData.riderPayloadKg || 75,
      tyreFrontPsi: tpl.nominalTyrePsi.front,
      tyreRearPsi: tpl.nominalTyrePsi.rear,
      tyreFrontNominalPsi: tpl.nominalTyrePsi.front,
      tyreRearNominalPsi: tpl.nominalTyrePsi.rear,
      tyreCondition: "Good",
      serviceStatus: "OK",
      lastServiceDate: new Date().toISOString().split('T')[0],
      nextServiceOdo: (customData.odometerKm || 500) + 5000,
      insuranceExpiry: "2026-12-31",
      pucExpiry: "2026-12-31",
      supportedConnectors: [...tpl.supportedConnectors],
      maxChargingPowerKw: tpl.maxChargingPowerKw,
      maxDcFastPowerKw: tpl.maxDcFastPowerKw,
      isFavorite: false,
      isFleet: customData.isFleet || false,
      assignedDriver: customData.assignedDriver || null,
      ridingModes: [...tpl.ridingModes],
      recentTrips: []
    };

    this.vehicles.push(newVehicle);
    this.persist();
    window.dispatchEvent(new CustomEvent('vehiclesListUpdated', { detail: { vehicles: this.vehicles } }));
    return newVehicle;
  }

  updateVehicle(id, updatedFields) {
    const idx = this.vehicles.findIndex(v => v.id === id);
    if (idx !== -1) {
      this.vehicles[idx] = { ...this.vehicles[idx], ...updatedFields };
      this.persist();
      if (this.activeVehicleId === id) {
        window.dispatchEvent(new CustomEvent('activeVehicleChanged', { detail: { vehicle: this.vehicles[idx] } }));
      }
      window.dispatchEvent(new CustomEvent('vehiclesListUpdated', { detail: { vehicles: this.vehicles } }));
      return this.vehicles[idx];
    }
    return null;
  }

  deleteVehicle(id) {
    if (this.vehicles.length <= 1) {
      alert("At least one vehicle must remain in your garage.");
      return false;
    }
    this.vehicles = this.vehicles.filter(v => v.id !== id);
    if (this.activeVehicleId === id) {
      this.activeVehicleId = this.vehicles[0].id;
      localStorage.setItem('aerovolt_active_vehicle_id', this.activeVehicleId);
    }
    this.persist();
    window.dispatchEvent(new CustomEvent('activeVehicleChanged', { detail: { vehicle: this.getActiveVehicle() } }));
    window.dispatchEvent(new CustomEvent('vehiclesListUpdated', { detail: { vehicles: this.vehicles } }));
    return true;
  }

  resetToDefault() {
    this.vehicles = [...DEFAULT_USER_VEHICLES];
    this.activeVehicleId = this.vehicles[0].id;
    localStorage.setItem('aerovolt_active_vehicle_id', this.activeVehicleId);
    this.persist();
    window.dispatchEvent(new CustomEvent('activeVehicleChanged', { detail: { vehicle: this.getActiveVehicle() } }));
    window.dispatchEvent(new CustomEvent('vehiclesListUpdated', { detail: { vehicles: this.vehicles } }));
  }
}

window.vehicleManager = new VehicleManager();
