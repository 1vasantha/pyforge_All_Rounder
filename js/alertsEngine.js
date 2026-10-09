/**
 * Enterprise EV Platform - Intelligent Diagnostics & Alerts Engine
 * Monitors vehicle health, battery degradation, tyre pressure, and service intervals.
 */

class AlertsEngine {
  constructor() {
    this.alerts = [];
    this.init();
  }

  init() {
    const stored = localStorage.getItem('aerovolt_alerts');
    if (stored) {
      try {
        this.alerts = JSON.parse(stored);
      } catch (e) {
        this.alerts = [];
      }
    } else {
      this.alerts = [];
    }
  }

  persist() {
    localStorage.setItem('aerovolt_alerts', JSON.stringify(this.alerts));
    window.dispatchEvent(new CustomEvent('alertsUpdated', { detail: this.alerts }));
  }

  getAlerts() {
    return this.alerts;
  }

  getUnreadCount() {
    return this.alerts.filter(a => !a.read).length;
  }

  markAllAsRead() {
    this.alerts.forEach(a => a.read = true);
    this.persist();
  }

  dismissAlert(id) {
    this.alerts = this.alerts.filter(a => a.id !== id);
    this.persist();
  }

  triggerAlert(alertObj) {
    // Check if duplicate alert exists recently
    const existing = this.alerts.find(a => a.type === alertObj.type && (Date.now() - new Date(a.timestamp).getTime()) < 3600000);
    if (!existing) {
      this.alerts.unshift({
        id: alertObj.id || "alt_" + Date.now(),
        type: alertObj.type,
        title: alertObj.title,
        message: alertObj.message,
        severity: alertObj.severity || "info", // info, warning, danger, success
        actionLabel: alertObj.actionLabel || null,
        actionTab: alertObj.actionTab || null,
        timestamp: alertObj.timestamp || new Date().toISOString(),
        read: false
      });
      this.persist();
    }
  }

  /**
   * Diagnostic scan on vehicle state
   */
  evaluateVehicleDiagnostics(vehicle) {
    if (!vehicle) return;

    // 1. Critical Low Battery Check
    if (vehicle.currentSocPercent <= 10) {
      this.triggerAlert({
        type: "battery_critical",
        title: "Critical Low Battery (Under 10%)",
        message: `${vehicle.name} battery is at ${vehicle.currentSocPercent}%. Reserve range is under 6 km. Navigate to nearest charging station immediately!`,
        severity: "danger",
        actionLabel: "Find Nearest Charger",
        actionTab: "map"
      });
    } else if (vehicle.currentSocPercent <= 20) {
      this.triggerAlert({
        type: "battery_low",
        title: "Low Battery Warning (Under 20%)",
        message: `${vehicle.name} battery is at ${vehicle.currentSocPercent}%. Plan your next recharge stop soon.`,
        severity: "warning",
        actionLabel: "View Charging Stations",
        actionTab: "map"
      });
    }

    // 2. Tyre Pressure Diagnostics
    const nomFront = vehicle.tyreFrontNominalPsi || 30;
    const nomRear = vehicle.tyreRearNominalPsi || 32;
    const frontLow = vehicle.tyreFrontPsi < (nomFront - 2.5);
    const rearLow = vehicle.tyreRearPsi < (nomRear - 2.5);

    if (frontLow || rearLow) {
      this.triggerAlert({
        type: "tyre_pressure_low",
        title: "Tyre Pressure Below Nominal",
        message: `Tyre pressure detected at Front: ${vehicle.tyreFrontPsi} PSI (Req: ${nomFront}) | Rear: ${vehicle.tyreRearPsi} PSI (Req: ${nomRear}). Under-inflation reduces range by ~6.8%.`,
        severity: "warning",
        actionLabel: "Tyre Health Guide",
        actionTab: "analytics"
      });
    }

    // 3. Service / Maintenance Interval Check
    if (vehicle.nextServiceOdo && vehicle.odometerKm) {
      const remainingOdo = vehicle.nextServiceOdo - vehicle.odometerKm;
      if (remainingOdo <= 0) {
        this.triggerAlert({
          type: "service_overdue",
          title: "Scheduled Maintenance Overdue",
          message: `${vehicle.name} has exceeded its recommended service interval by ${Math.abs(remainingOdo)} km. Schedule motor & brake inspection.`,
          severity: "danger",
          actionLabel: "Find EV Service Center",
          actionTab: "ecosystem"
        });
      } else if (remainingOdo <= 500) {
        this.triggerAlert({
          type: "service_due_soon",
          title: "Service Interval Due Soon",
          message: `Scheduled service recommended in ${remainingOdo} km. Book a technician inspection slot.`,
          severity: "info",
          actionLabel: "Book Service",
          actionTab: "ecosystem"
        });
      }
    }

    // 4. State of Health (SOH) Degradation Warning
    if (vehicle.batteryHealthSohPercent && vehicle.batteryHealthSohPercent < 85.0) {
      this.triggerAlert({
        type: "battery_soh_degraded",
        title: "Battery SOH Degradation Alert",
        message: `State of Health has dropped to ${vehicle.batteryHealthSohPercent}%. Cell balancing or BMS calibration recommended at authorized EV center.`,
        severity: "warning",
        actionLabel: "Battery Diagnostics",
        actionTab: "analytics"
      });
    }

    // 5. Insurance Expiry Warning
    if (vehicle.insuranceExpiry) {
      const expiryDate = new Date(vehicle.insuranceExpiry);
      const diffDays = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 3600 * 24));
      if (diffDays <= 30 && diffDays > 0) {
        this.triggerAlert({
          type: "insurance_expiring",
          title: "Vehicle Insurance Expiring Soon",
          message: `Policy for ${vehicle.regNumber} expires in ${diffDays} days (${vehicle.insuranceExpiry}). Renew now to stay protected.`,
          severity: "info",
          actionLabel: "View Document Locker",
          actionTab: "ecosystem"
        });
      }
    }
  }
}

window.alertsEngine = new AlertsEngine();
