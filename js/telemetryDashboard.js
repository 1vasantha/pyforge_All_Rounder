/**
 * Enterprise EV Platform - Telemetry & Charging Analytics Dashboard
 * Features real-time CC/CV charging simulation, degradation trends, and green savings.
 */

class TelemetryDashboard {
  constructor() {
    this.isCharging = false;
    this.chargeInterval = null;
    this.activeChargingSession = null;
    this.chargingHistory = [];
    this.init();
  }

  init() {
    const stored = localStorage.getItem('aerovolt_charge_history');
    if (stored) {
      try {
        this.chargingHistory = JSON.parse(stored);
      } catch (e) {
        this.chargingHistory = this.getSeedChargingHistory();
      }
    } else {
      this.chargingHistory = this.getSeedChargingHistory();
      this.persist();
    }
  }

  persist() {
    localStorage.setItem('aerovolt_charge_history', JSON.stringify(this.chargingHistory));
  }

  getSeedChargingHistory() {
    return [
      {
        id: "chg_101",
        date: "2024-10-07 18:30",
        stationName: "Ather Grid Indiranagar",
        chargerType: "DC Fast 6kW",
        energyKwh: 2.15,
        startSoc: 22,
        endSoc: 80,
        durationMinutes: 28,
        cost: 26.8,
        currency: "₹",
        whPerKmEquivalent: 33.5
      },
      {
        id: "chg_102",
        date: "2024-10-05 21:15",
        stationName: "Home 15A Smart Dot",
        chargerType: "AC Slow 3.3kW",
        energyKwh: 3.1,
        startSoc: 15,
        endSoc: 100,
        durationMinutes: 195,
        cost: 21.7,
        currency: "₹",
        whPerKmEquivalent: 34.0
      },
      {
        id: "chg_103",
        date: "2024-10-02 14:00",
        stationName: "Gogoro GoStation HSR",
        chargerType: "Dual Pack Swap",
        energyKwh: 3.1,
        startSoc: 12,
        endSoc: 100,
        durationMinutes: 2,
        cost: 35.0,
        currency: "₹",
        whPerKmEquivalent: 32.0
      }
    ];
  }

  /**
   * Starts a real-time charging simulation with realistic CC/CV curve
   */
  startChargingSimulation(vehicle, station = null, targetSoc = 100) {
    if (this.isCharging) return;
    if (!vehicle) return;

    const startSoc = vehicle.currentSocPercent || 20;
    if (startSoc >= targetSoc) {
      alert("Battery is already at or above target charge percentage!");
      return;
    }

    const maxChargerKw = station ? station.powerKw : (vehicle.maxChargingPowerKw || 3.3);
    const vehicleMaxKw = station && station.isFastCharger ? (vehicle.maxDcFastPowerKw || 6.0) : (vehicle.maxChargingPowerKw || 3.3);
    const basePowerKw = Math.min(maxChargerKw, vehicleMaxKw);
    const pricePerKwh = station ? station.pricingPerKwh : 7.0; // Home electricity tariff ₹7/kWh

    this.isCharging = true;
    this.activeChargingSession = {
      sessionId: "SIM-" + Date.now(),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      stationName: station ? station.name : "Home Wallbox Charger",
      stationOperator: station ? station.operator : "Residential AC",
      startSoc: startSoc,
      currentSoc: startSoc,
      targetSoc: targetSoc,
      basePowerKw: basePowerKw,
      currentPowerKw: basePowerKw,
      energyDeliveredKwh: 0,
      costAccrued: 0,
      pricePerKwh: pricePerKwh,
      elapsedSeconds: 0,
      startedAt: new Date(),
      currency: station ? (station.currencySymbol || "₹") : "₹",
      isBatterySwap: station ? station.isBatterySwap : false
    };

    window.dispatchEvent(new CustomEvent('chargingStateChanged', { detail: { isCharging: true, session: this.activeChargingSession } }));

    // Instant swap handler
    if (this.activeChargingSession.isBatterySwap) {
      setTimeout(() => {
        this.activeChargingSession.currentSoc = 100;
        this.activeChargingSession.energyDeliveredKwh = vehicle.usableCapacityKwh || 3.2;
        this.activeChargingSession.costAccrued = station.pricingPerKwh || 35.0;
        this.stopChargingSimulation();
      }, 2500);
      return;
    }

    // CC/CV ticker running every 1000ms (1 second represents ~20-30 seconds of real-world charging for brisk demo feedback)
    this.chargeInterval = setInterval(() => {
      if (!this.isCharging || !this.activeChargingSession) {
        clearInterval(this.chargeInterval);
        return;
      }

      this.activeChargingSession.elapsedSeconds += 1;
      const curSoc = this.activeChargingSession.currentSoc;

      // Realistic CC/CV power taper above 80% SoC
      let effectiveKw = this.activeChargingSession.basePowerKw;
      if (curSoc >= 80) {
        // Taper power down linearly from 100% to 20% of base as SoC climbs to 100%
        const taperRatio = Math.max(0.2, 1.0 - ((curSoc - 80) / 20) * 0.8);
        effectiveKw = this.activeChargingSession.basePowerKw * taperRatio;
      }
      this.activeChargingSession.currentPowerKw = Math.round(effectiveKw * 10) / 10;

      // Increment battery SoC
      // For demo speed, +1% SoC every 1-2 seconds
      const deltaSoc = (effectiveKw >= 10) ? 1.5 : (effectiveKw >= 5 ? 1.0 : 0.6);
      const nextSoc = Math.min(this.activeChargingSession.targetSoc, Math.round((curSoc + deltaSoc) * 10) / 10);
      this.activeChargingSession.currentSoc = nextSoc;

      // Calculate incremental energy delivered
      const totalCapacityKwh = vehicle.usableCapacityKwh || 3.2;
      const energyDeltaKwh = (deltaSoc / 100) * totalCapacityKwh;
      this.activeChargingSession.energyDeliveredKwh = Math.round((this.activeChargingSession.energyDeliveredKwh + energyDeltaKwh) * 1000) / 1000;
      this.activeChargingSession.costAccrued = Math.round(this.activeChargingSession.energyDeliveredKwh * this.activeChargingSession.pricePerKwh * 100) / 100;

      // Update vehicle in memory
      window.vehicleManager.updateVehicle(vehicle.id, { currentSocPercent: Math.round(nextSoc) });

      window.dispatchEvent(new CustomEvent('chargingTick', { detail: this.activeChargingSession }));

      if (nextSoc >= this.activeChargingSession.targetSoc) {
        this.stopChargingSimulation();
      }
    }, 1000);
  }

  stopChargingSimulation() {
    if (!this.isCharging || !this.activeChargingSession) return null;

    clearInterval(this.chargeInterval);
    this.isCharging = false;

    const finishedSession = { ...this.activeChargingSession, endedAt: new Date() };

    // Record in charging history
    const record = {
      id: "chg_" + Date.now(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      stationName: finishedSession.stationName,
      chargerType: finishedSession.isBatterySwap ? "Battery Swap Pack" : `${finishedSession.currentPowerKw} kW ${finishedSession.basePowerKw > 5 ? 'Fast' : 'Slow'}`,
      energyKwh: Math.max(0.1, Math.round(finishedSession.energyDeliveredKwh * 100) / 100),
      startSoc: finishedSession.startSoc,
      endSoc: Math.round(finishedSession.currentSoc),
      durationMinutes: Math.max(1, Math.round(finishedSession.elapsedSeconds / 60)),
      cost: Math.round(finishedSession.costAccrued * 100) / 100,
      currency: finishedSession.currency,
      whPerKmEquivalent: 34.0
    };

    this.chargingHistory.unshift(record);
    this.persist();

    // Trigger alert engine for charging completion
    if (window.alertsEngine) {
      window.alertsEngine.triggerAlert({
        id: "alert_chg_done_" + Date.now(),
        type: "charging_complete",
        title: "Charging Completed",
        message: `Your ${finishedSession.vehicleName} reached ${record.endSoc}% SoC (${record.energyKwh} kWh added, ${record.currency}${record.cost}).`,
        severity: "info",
        timestamp: new Date().toISOString()
      });
    }

    this.activeChargingSession = null;
    window.dispatchEvent(new CustomEvent('chargingStateChanged', { detail: { isCharging: false, record } }));
    return record;
  }

  getChargingHistory() {
    return this.chargingHistory;
  }

  /**
   * Computes comparative EV vs Petrol economy & Carbon savings
   */
  calculateFinancialAndEcoSavings(vehicle) {
    const odo = vehicle ? (vehicle.odometerKm || 4500) : 4500;
    
    // Petrol 2W benchmark:
    // Avg mileage = 42 km/L
    // Avg petrol price = ₹102 / L (or $1.25 / L)
    // Cost per km (Petrol) = 102 / 42 = ₹2.43 / km
    const petrolCostPerKm = 2.45;
    const totalPetrolCost = odo * petrolCostPerKm;

    // EV 2W benchmark:
    // Avg consumption = 35 Wh/km (0.035 kWh/km)
    // Avg electricity blended cost = ₹9.5 / kWh
    // Cost per km (EV) = 0.035 * 9.5 = ₹0.33 / km!
    const evWhPerKm = vehicle ? (vehicle.avgHistoricalEfficiencyWhPerKm || 35) : 35;
    const evCostPerKm = (evWhPerKm / 1000) * 9.5;
    const totalEvCost = odo * evCostPerKm;

    const netSavings = Math.round(totalPetrolCost - totalEvCost);

    // Carbon emissions savings:
    // Petrol 2W emits approx 82 grams CO2 per km.
    // EV grid emissions (blended renewable/grid) approx 22 g CO2 per km.
    // Net CO2 saved = 60 g CO2 / km
    const co2SavedKg = Math.round((odo * 0.060) * 10) / 10;
    const treesEquivalent = Math.round(co2SavedKg / 21); // 1 mature tree absorbs ~21 kg CO2/year

    return {
      odometerKm: odo,
      petrolCostPerKm: Math.round(petrolCostPerKm * 100) / 100,
      evCostPerKm: Math.round(evCostPerKm * 100) / 100,
      totalPetrolCost: Math.round(totalPetrolCost),
      totalEvCost: Math.round(totalEvCost),
      netSavingsCurrency: netSavings,
      co2SavedKg: co2SavedKg,
      treesEquivalent: treesEquivalent,
      currency: "₹"
    };
  }

  /**
   * Generates Battery Health degradation trend model (SOH vs Cycles)
   */
  getBatteryDegradationCurve(vehicle) {
    const chemistry = (vehicle && vehicle.batteryType) ? vehicle.batteryType : "NMC";
    const currentCycles = (vehicle && vehicle.batteryCycles) ? vehicle.batteryCycles : 140;
    const currentSoh = (vehicle && vehicle.batteryHealthSohPercent) ? vehicle.batteryHealthSohPercent : 96.5;

    // Simulated lifecycle projections up to 1500 cycles
    const projectionPoints = [
      { cycles: 0, soh: 100 },
      { cycles: 100, soh: 97.5 },
      { cycles: 250, soh: 95.0 },
      { cycles: 500, soh: 91.2 },
      { cycles: 750, soh: 87.5 },
      { cycles: 1000, soh: 83.8 },
      { cycles: 1250, soh: 80.5 },
      { cycles: 1500, soh: 78.0 }
    ];

    return {
      chemistry,
      currentCycles,
      currentSoh,
      retentionAt1000Cycles: chemistry.includes("LFP") ? "90%+" : "84%",
      healthGrade: currentSoh >= 95 ? "Excellent (Tier 1)" : (currentSoh >= 85 ? "Good" : "Degraded - Service Recommended"),
      points: projectionPoints
    };
  }
}

window.telemetryDashboard = new TelemetryDashboard();
