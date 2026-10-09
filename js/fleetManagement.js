/**
 * Enterprise EV Platform - Commercial Fleet Management Portal
 * Supports logistics, delivery fleets, vehicle assignment, predictive maintenance & reporting.
 */

const SEED_FLEET_VEHICLES = [
  {
    id: "flt_01",
    regNumber: "KA-01-FL-1001",
    model: "Ather 450X Gen 3 Cargo",
    category: "2w_scooter",
    driverName: "Rajesh Kumar",
    driverPhone: "+91 98860 12345",
    driverRating: 4.9,
    status: "En Route", // En Route, Charging, Idle, Maintenance
    currentSocPercent: 74,
    sohPercent: 97.2,
    odometerKm: 12450,
    whPerKm: 34.2,
    targetWhPerKm: 35.0,
    isEfficient: true,
    lastKnownLocation: "Indiranagar Hub, Sector 2",
    batteryCapacityKwh: 3.7,
    connector: "Ather Grid Fast",
    nextMaintenanceKm: 15000,
    alertCount: 0
  },
  {
    id: "flt_02",
    regNumber: "KA-01-FL-1002",
    model: "Bounce Infinity E1+ Swap",
    category: "2w_scooter",
    driverName: "Mohammed Farhan",
    driverPhone: "+91 98860 23456",
    driverRating: 4.7,
    status: "Charging",
    currentSocPercent: 32,
    sohPercent: 95.8,
    odometerKm: 18900,
    whPerKm: 31.8,
    targetWhPerKm: 32.0,
    isEfficient: true,
    lastKnownLocation: "HSR Layout Gogoro Station",
    batteryCapacityKwh: 2.0,
    connector: "Swappable Dual Pack",
    nextMaintenanceKm: 20000,
    alertCount: 0
  },
  {
    id: "flt_03",
    regNumber: "KA-01-FL-1003",
    model: "Ola S1 Pro Gen 2",
    category: "2w_scooter",
    driverName: "Sunil Verma",
    driverPhone: "+91 98860 34567",
    driverRating: 4.2,
    status: "En Route",
    currentSocPercent: 41,
    sohPercent: 94.1,
    odometerKm: 24100,
    whPerKm: 42.5, // High consumption! Inefficient driver throttle usage
    targetWhPerKm: 33.0,
    isEfficient: false,
    inefficiencyReason: "Excessive aggressive acceleration & tyre pressure low (26 PSI)",
    lastKnownLocation: "Outer Ring Road, Bellandur",
    batteryCapacityKwh: 4.0,
    connector: "Ola Hypercharger",
    nextMaintenanceKm: 25000,
    alertCount: 1
  },
  {
    id: "flt_04",
    regNumber: "KA-01-FL-1004",
    model: "Hero Vida V1 Pro",
    category: "2w_scooter",
    driverName: "Ananya Gowda",
    driverPhone: "+91 98860 45678",
    driverRating: 4.95,
    status: "Idle",
    currentSocPercent: 88,
    sohPercent: 98.4,
    odometerKm: 8900,
    whPerKm: 32.1,
    targetWhPerKm: 33.5,
    isEfficient: true,
    lastKnownLocation: "Koramangala Depot",
    batteryCapacityKwh: 3.94,
    connector: "Bharat AC001",
    nextMaintenanceKm: 10000,
    alertCount: 0
  },
  {
    id: "flt_05",
    regNumber: "KA-01-FL-1005",
    model: "Revolt RV400 Commuter",
    category: "2w_bike",
    driverName: "Kishore Rao",
    driverPhone: "+91 98860 56789",
    driverRating: 4.5,
    status: "Maintenance",
    currentSocPercent: 18,
    sohPercent: 91.0,
    odometerKm: 31200,
    whPerKm: 36.4,
    targetWhPerKm: 32.0,
    isEfficient: false,
    inefficiencyReason: "Brake pad dragging & scheduled hub service overdue",
    lastKnownLocation: "Central Service Center, Peenya",
    batteryCapacityKwh: 3.24,
    connector: "15A 3-Pin AC",
    nextMaintenanceKm: 30000,
    alertCount: 2
  },
  {
    id: "flt_06",
    regNumber: "KA-01-FL-1006",
    model: "Ultraviolette F77 Recon (Express Dispatch)",
    category: "2w_bike",
    driverName: "Arjun Reddy",
    driverPhone: "+91 98860 67890",
    driverRating: 4.85,
    status: "En Route",
    currentSocPercent: 68,
    sohPercent: 99.0,
    odometerKm: 14200,
    whPerKm: 43.8,
    targetWhPerKm: 44.0,
    isEfficient: true,
    lastKnownLocation: "Airport Highway Express",
    batteryCapacityKwh: 10.3,
    connector: "Type 2 AC / CCS2",
    nextMaintenanceKm: 20000,
    alertCount: 0
  }
];

class FleetManager {
  constructor() {
    this.fleetVehicles = [];
    this.init();
  }

  init() {
    const stored = localStorage.getItem('aerovolt_fleet');
    if (stored) {
      try {
        this.fleetVehicles = JSON.parse(stored);
      } catch (e) {
        this.fleetVehicles = [...SEED_FLEET_VEHICLES];
      }
    } else {
      this.fleetVehicles = [...SEED_FLEET_VEHICLES];
      this.persist();
    }
  }

  persist() {
    localStorage.setItem('aerovolt_fleet', JSON.stringify(this.fleetVehicles));
  }

  getFleetVehicles() {
    return this.fleetVehicles;
  }

  getFleetMetrics() {
    const total = this.fleetVehicles.length;
    const onRoute = this.fleetVehicles.filter(v => v.status === 'En Route').length;
    const charging = this.fleetVehicles.filter(v => v.status === 'Charging').length;
    const idle = this.fleetVehicles.filter(v => v.status === 'Idle').length;
    const maintenance = this.fleetVehicles.filter(v => v.status === 'Maintenance').length;
    const inefficientCount = this.fleetVehicles.filter(v => !v.isEfficient).length;

    const totalOdo = this.fleetVehicles.reduce((acc, v) => acc + v.odometerKm, 0);
    const avgWh = Math.round(this.fleetVehicles.reduce((acc, v) => acc + v.whPerKm, 0) / (total || 1) * 10) / 10;
    const avgSoh = Math.round(this.fleetVehicles.reduce((acc, v) => acc + v.sohPercent, 0) / (total || 1) * 10) / 10;
    
    // Enterprise fuel cost savings vs ICE petrol commercial fleet:
    // ₹2.45/km ICE vs ~₹0.35/km EV -> ₹2.10/km net fleet savings
    const totalFleetSavingsInr = Math.round(totalOdo * 2.10);
    const totalCo2OffsetKg = Math.round(totalOdo * 0.060);

    return {
      totalVehicles: total,
      onRouteCount: onRoute,
      chargingCount: charging,
      idleCount: idle,
      maintenanceCount: maintenance,
      inefficientCount: inefficientCount,
      totalOdoKm: totalOdo,
      avgWhPerKm: avgWh,
      avgSohPercent: avgSoh,
      totalSavingsCurrency: `₹${totalFleetSavingsInr.toLocaleString()}`,
      totalCo2OffsetKg: totalCo2OffsetKg,
      currency: "₹"
    };
  }

  assignDriver(vehicleId, driverName, driverPhone) {
    const vehicle = this.fleetVehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.driverName = driverName;
      vehicle.driverPhone = driverPhone;
      this.persist();
      return true;
    }
    return false;
  }

  updateVehicleStatus(vehicleId, status) {
    const vehicle = this.fleetVehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.status = status;
      this.persist();
      return true;
    }
    return false;
  }

  scheduleMaintenance(vehicleId, notes = "Routine inspection") {
    const vehicle = this.fleetVehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.status = "Maintenance";
      vehicle.maintenanceNotes = notes;
      vehicle.nextMaintenanceKm = vehicle.odometerKm + 5000;
      this.persist();
      return true;
    }
    return false;
  }

  /**
   * Generates and downloads real CSV report of fleet telemetry
   */
  exportCsvReport() {
    const headers = ["Vehicle ID", "Registration", "Model", "Driver Name", "Status", "Battery SoC (%)", "Battery SOH (%)", "Odometer (km)", "Wh/km", "Efficiency Status", "Last Location"];
    const rows = this.fleetVehicles.map(v => [
      v.id,
      v.regNumber,
      `"${v.model}"`,
      `"${v.driverName}"`,
      v.status,
      v.currentSocPercent,
      v.sohPercent,
      v.odometerKm,
      v.whPerKm,
      v.isEfficient ? "Optimal" : "Flagged: Inefficient",
      `"${v.lastKnownLocation}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AeroVolt_Fleet_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.fleetManager = new FleetManager();
