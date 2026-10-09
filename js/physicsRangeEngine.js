/**
 * Enterprise EV Platform - Physics & AI Range Intelligence Engine
 * Comprehensive multi-factor physical dynamics and adaptive learning algorithm.
 */

class PhysicsRangeEngine {
  constructor() {
    this.ambientConditions = {
      temperatureC: 24,
      weather: "clear", // clear, headwind, rain, heavy_storm
      terrain: "flat", // flat, rolling, uphill_steep, downhill
      traffic: "moderate" // low, moderate, heavy_stop_go
    };

    this.aiLearningModel = {
      driverAggressivenessIndex: 1.02, // 0.85 (ultra eco) to 1.30 (heavy throttle)
      adaptiveBiasFactor: 1.01,
      confidenceScorePercent: 94
    };
  }

  setEnvironmentalConditions(conditions) {
    this.ambientConditions = { ...this.ambientConditions, ...conditions };
  }

  getEnvironmentalConditions() {
    return this.ambientConditions;
  }

  /**
   * Temperature effect on Li-Ion electrochemical efficiency & internal impedance.
   * Optimal electrochemical band is 22°C - 26°C.
   */
  calculateTemperatureFactor(tempC) {
    if (tempC >= 22 && tempC <= 27) {
      return 1.0;
    } else if (tempC < 22) {
      // Sub-zero and cold battery efficiency drops
      const delta = 22 - tempC;
      return 1.0 + (delta * 0.0075);
    } else {
      // Extreme heat causes auxiliary cooling / thermal throttling
      const delta = tempC - 27;
      return 1.0 + (delta * 0.0045);
    }
  }

  /**
   * Payload effect on rolling resistance and inertial acceleration.
   * Baseline is 70 kg single rider.
   */
  calculatePayloadFactor(payloadKg, curbWeightKg = 112) {
    const baseline = 70;
    const delta = payloadKg - baseline;
    const totalMass = curbWeightKg + payloadKg;
    const baselineMass = curbWeightKg + baseline;
    // Ratio of inertial mass scaling
    const massRatio = totalMass / baselineMass;
    return 1.0 + (massRatio - 1.0) * 0.65;
  }

  /**
   * Tyre pressure degradation factor.
   * Under-inflated tyres increase rolling resistance coefficient Crr significantly.
   */
  calculateTyrePressureFactor(frontPsi, rearPsi, nomFront = 30, nomRear = 32) {
    const frontDeficit = Math.max(0, (nomFront - frontPsi) / nomFront);
    const rearDeficit = Math.max(0, (nomRear - rearPsi) / nomRear);
    const avgDeficit = (frontDeficit + rearDeficit) / 2;
    return 1.0 + (avgDeficit * 0.28);
  }

  /**
   * Weather & aerodynamic drag impact (relative headwind, road surface friction).
   */
  calculateWeatherFactor(weather) {
    switch (weather) {
      case "headwind":
        return 1.16; // Aerodynamic drag increases quadratically with relative airspeed
      case "rain":
        return 1.10; // Tyre hydrodynamic displacement resistance
      case "heavy_storm":
        return 1.24;
      case "clear":
      default:
        return 1.00;
    }
  }

  /**
   * Terrain elevation profile factor.
   */
  calculateTerrainFactor(terrain) {
    switch (terrain) {
      case "uphill_steep":
        return 1.38; // Continuous gravitational potential energy work mg*sin(theta)
      case "rolling":
        return 1.08; // Undulating hills with imperfect regen recovery
      case "downhill":
        return 0.76; // Gravity assist + kinetic regenerative braking energy capture
      case "flat":
      default:
        return 1.00;
    }
  }

  /**
   * Urban traffic stop-and-go factor.
   */
  calculateTrafficFactor(traffic) {
    switch (traffic) {
      case "heavy_stop_go":
        return 1.15; // Repeated acceleration from 0 km/h dissipates peak energy
      case "low":
        return 0.96; // Smooth uninterrupted cruising
      case "moderate":
      default:
        return 1.00;
    }
  }

  /**
   * Riding Mode factor from vehicle profile.
   */
  calculateModeFactor(vehicle, currentModeName) {
    if (!vehicle.ridingModes || vehicle.ridingModes.length === 0) return 1.0;
    const mode = vehicle.ridingModes.find(m => m.name.toLowerCase() === currentModeName.toLowerCase());
    return mode ? mode.factor : 1.0;
  }

  /**
   * AI-adapted historical driver efficiency factor based on recorded trip telemetry.
   */
  calculateAiHistoricalFactor(vehicle) {
    if (!vehicle.recentTrips || vehicle.recentTrips.length === 0) {
      return this.aiLearningModel.adaptiveBiasFactor;
    }
    // Calculate rolling average of recent trips compared to base rating
    const totalRecordedWh = vehicle.recentTrips.reduce((acc, t) => acc + (t.whPerKm * t.distanceKm), 0);
    const totalDistance = vehicle.recentTrips.reduce((acc, t) => acc + t.distanceKm, 0);
    if (totalDistance === 0) return 1.0;

    const actualAvgWhPerKm = totalRecordedWh / totalDistance;
    const baseWh = vehicle.baseEfficiencyWhPerKm || 34;
    const historicalRatio = actualAvgWhPerKm / baseWh;
    // Blend with base AI model
    return 0.7 * historicalRatio + 0.3 * this.aiLearningModel.adaptiveBiasFactor;
  }

  /**
   * Master Calculation Method
   */
  calculateRange(vehicle, overrides = {}) {
    if (!vehicle) return null;

    const temp = overrides.temperatureC !== undefined ? overrides.temperatureC : this.ambientConditions.temperatureC;
    const weather = overrides.weather || this.ambientConditions.weather;
    const terrain = overrides.terrain || this.ambientConditions.terrain;
    const traffic = overrides.traffic || this.ambientConditions.traffic;
    const modeName = overrides.ridingMode || vehicle.currentRidingMode || "Ride";
    const payload = overrides.riderPayloadKg !== undefined ? overrides.riderPayloadKg : (vehicle.riderPayloadKg || 75);
    const frontPsi = overrides.tyreFrontPsi !== undefined ? overrides.tyreFrontPsi : vehicle.tyreFrontPsi;
    const rearPsi = overrides.tyreRearPsi !== undefined ? overrides.tyreRearPsi : vehicle.tyreRearPsi;
    const soc = overrides.socPercent !== undefined ? overrides.socPercent : vehicle.currentSocPercent;
    const soh = vehicle.batteryHealthSohPercent || 97.0;

    // Component multipliers
    const fTemp = this.calculateTemperatureFactor(temp);
    const fPayload = this.calculatePayloadFactor(payload, vehicle.curbWeightKg || 112);
    const fTyre = this.calculateTyrePressureFactor(frontPsi, rearPsi, vehicle.tyreFrontNominalPsi || 30, vehicle.tyreRearNominalPsi || 32);
    const fWeather = this.calculateWeatherFactor(weather);
    const fTerrain = this.calculateTerrainFactor(terrain);
    const fTraffic = this.calculateTrafficFactor(traffic);
    const fMode = this.calculateModeFactor(vehicle, modeName);
    const fAi = this.calculateAiHistoricalFactor(vehicle);

    // Combined multi-variable factor
    const combinedFactor = fTemp * fPayload * fTyre * fWeather * fTerrain * fTraffic * fMode * fAi;

    // Baseline energy consumption rate (Wh/km)
    const baseWhPerKm = vehicle.baseEfficiencyWhPerKm || 34;
    const dynamicWhPerKm = baseWhPerKm * combinedFactor;

    // Usable energy remaining (Watt-hours)
    // SOH scales maximum capacity; SOC scales current level
    const totalCapacityWh = (vehicle.batteryCapacityKwh || 3.7) * 1000;
    const usableCapacityWh = (vehicle.usableCapacityKwh ? vehicle.usableCapacityKwh * 1000 : totalCapacityWh * 0.90);
    const healthAdjustedMaxWh = usableCapacityWh * (soh / 100);
    const remainingUsableWh = healthAdjustedMaxWh * (soc / 100);

    // Remaining Distance (km)
    const estimatedDistanceKm = remainingUsableWh / dynamicWhPerKm;
    const safeDistanceKm = estimatedDistanceKm * 0.85; // 15% reserve buffer

    // Factor sensitivity deltas for user coaching & transparency
    const ecoModeGainKm = (remainingUsableWh / (baseWhPerKm * (combinedFactor / fMode * 0.84))) - estimatedDistanceKm;
    const tyreRecoveryKm = (remainingUsableWh / (baseWhPerKm * (combinedFactor / fTyre * 1.0))) - estimatedDistanceKm;

    return {
      estimatedDistanceKm: Math.max(0, Math.round(estimatedDistanceKm * 10) / 10),
      safeDistanceKm: Math.max(0, Math.round(safeDistanceKm * 10) / 10),
      dynamicWhPerKm: Math.round(dynamicWhPerKm * 10) / 10,
      baseWhPerKm: baseWhPerKm,
      remainingUsableWh: Math.round(remainingUsableWh),
      batteryHealthSoh: soh,
      currentSocPercent: soc,
      activeMode: modeName,
      factors: {
        temperature: { factor: Math.round(fTemp * 100) / 100, value: `${temp}°C` },
        payload: { factor: Math.round(fPayload * 100) / 100, value: `${payload} kg` },
        tyrePressure: { factor: Math.round(fTyre * 100) / 100, value: `F:${frontPsi}/R:${rearPsi} PSI` },
        weather: { factor: Math.round(fWeather * 100) / 100, value: weather },
        terrain: { factor: Math.round(fTerrain * 100) / 100, value: terrain },
        traffic: { factor: Math.round(fTraffic * 100) / 100, value: traffic },
        ridingMode: { factor: Math.round(fMode * 100) / 100, value: modeName },
        aiAdaptive: { factor: Math.round(fAi * 100) / 100, confidence: `${this.aiLearningModel.confidenceScorePercent}%` }
      },
      actionableInsights: [
        ecoModeGainKm > 1 ? `Switching to Eco mode can recover +${Math.round(ecoModeGainKm)} km range.` : null,
        tyreRecoveryKm > 1 ? `Inflating tyres to nominal PSI will restore +${Math.round(tyreRecoveryKm * 10) / 10} km.` : null,
        temp < 15 ? `Battery at ${temp}°C experiences +${Math.round((fTemp - 1) * 100)}% internal impedance loss.` : null,
        fTerrain > 1.2 ? `Steep terrain increases energy draw by ${Math.round((fTerrain - 1) * 100)}%. Use regenerative braking on descents.` : null
      ].filter(Boolean)
    };
  }
}

window.rangeEngine = new PhysicsRangeEngine();
