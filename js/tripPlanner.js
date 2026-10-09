/**
 * Enterprise EV Platform - Intelligent Trip Planner & Route Charging Optimizer
 * Automatically computes energy-optimal routes, elevation drag, and required charging stops.
 */

const PRESET_CORRIDORS = [
  {
    id: "route_bengaluru_nandi_hills",
    name: "Bengaluru City to Nandi Hills (Weekend Ride)",
    origin: "MG Road, Central Bengaluru",
    destination: "Nandi Hills Peak Top",
    distanceKm: 62.5,
    originCoords: { lat: 12.9756, lng: 77.6094 },
    destCoords: { lat: 13.3702, lng: 77.6835 },
    elevationGainMeters: 550, // Significant uphill gradient
    terrain: "uphill_steep",
    recommendedStopStationId: "st_jio_bp_hebbal",
    description: "Scenic climb with 550m elevation gain. Battery drain increases ~28% on the final 12 km hill hairpin turns."
  },
  {
    id: "route_tech_corridor_hosur",
    name: "Indiranagar to Electronic City Tech Corridor",
    origin: "Indiranagar 100ft Road",
    destination: "Electronic City Phase 2",
    distanceKm: 24.8,
    originCoords: { lat: 12.9716, lng: 77.6412 },
    destCoords: { lat: 12.8452, lng: 77.6602 },
    elevationGainMeters: 40,
    terrain: "flat",
    recommendedStopStationId: "st_zeon_electronic_city",
    description: "Daily tech commuter corridor with elevated highway. Steady speed cruise."
  },
  {
    id: "route_mysuru_expressway",
    name: "Bengaluru to Mandya / Mysuru Highway Expressway",
    origin: "Kengeri Satellite Town",
    destination: "Mandya City Center",
    distanceKm: 88.0,
    originCoords: { lat: 12.9121, lng: 77.4831 },
    destCoords: { lat: 12.5234, lng: 76.8974 },
    elevationGainMeters: 90,
    terrain: "rolling",
    recommendedStopStationId: "st_ather_jayanagar",
    description: "Long range intercity corridor. Two-wheelers require mid-way top-up unless equipped with high-capacity pack."
  },
  {
    id: "route_mumbai_lonavala",
    name: "Mumbai BKC to Lonavala Hill Station",
    origin: "BKC G Block, Mumbai",
    destination: "Lonavala Khandala Ghats",
    distanceKm: 86.4,
    originCoords: { lat: 19.0657, lng: 72.8682 },
    destCoords: { lat: 18.7546, lng: 73.4062 },
    elevationGainMeters: 620,
    terrain: "uphill_steep",
    recommendedStopStationId: "st_ola_navi_mumbai",
    description: "Challenging Bhor Ghat gradient. Heavy energy drain on mountain ascent."
  }
];

class TripPlanner {
  constructor() {
    this.presetRoutes = PRESET_CORRIDORS;
    this.currentPlan = null;
  }

  getPresetRoutes() {
    return this.presetRoutes;
  }

  /**
   * Plans a trip between two points, factoring in vehicle state, real-world range,
   * terrain elevation, and auto-inserting optimal compatible charging stops.
   */
  planTrip(options) {
    const {
      originName = "Current Location",
      destName = "Destination",
      distanceKm = 45,
      elevationGainMeters = 50,
      terrain = "flat",
      vehicle,
      rangeCalculation
    } = options;

    if (!vehicle || !rangeCalculation) {
      return { success: false, error: "Active vehicle data required" };
    }

    const currentRangeKm = rangeCalculation.estimatedDistanceKm;
    const safeRangeKm = rangeCalculation.safeDistanceKm;
    const dynamicWhPerKm = rangeCalculation.dynamicWhPerKm;

    // Additional energy for elevation gain: Potential energy Work = m * g * h
    // For a 2W bike + rider (approx 190 kg): PE = 190 * 9.81 * h Joules. (1 Wh = 3600 J)
    const totalMassKg = (vehicle.curbWeightKg || 112) + (vehicle.riderPayloadKg || 75);
    const elevationEnergyWh = (totalMassKg * 9.81 * Math.max(0, elevationGainMeters)) / 3600;

    // Total trip energy needed
    const distanceEnergyWh = distanceKm * dynamicWhPerKm;
    const totalEnergyNeededWh = distanceEnergyWh + elevationEnergyWh;
    const remainingBatteryWh = rangeCalculation.remainingUsableWh;

    const isDirectReachable = (remainingBatteryWh >= totalEnergyNeededWh * 1.15); // 15% safety buffer
    const projectedArrivalBatteryWh = remainingBatteryWh - totalEnergyNeededWh;
    const projectedArrivalSocPercent = Math.max(0, Math.round((projectedArrivalBatteryWh / (vehicle.usableCapacityKwh * 1000 || 3500)) * 100));

    // Base driving time assuming 40 km/h average
    const drivingTimeMinutes = Math.round((distanceKm / 42) * 60);

    const plan = {
      id: "trip_" + Date.now(),
      originName,
      destName,
      distanceKm,
      elevationGainMeters,
      totalEnergyNeededWh: Math.round(totalEnergyNeededWh),
      currentRangeKm,
      isDirectReachable,
      drivingTimeMinutes,
      projectedArrivalSocPercent,
      stops: []
    };

    if (!isDirectReachable) {
      // Find candidate stations from StationsManager that are compatible and along the corridor
      const allStations = window.stationsManager.getAllStations();
      const compatibleStations = allStations.filter(st => {
        const compat = window.stationsManager.checkCompatibility(st, vehicle);
        return compat.isCompatible;
      });

      // Pick the best station (prioritize fast charging or swapping, good rating)
      let selectedStation = compatibleStations.find(s => s.isFastCharger || s.isBatterySwap) || compatibleStations[0];
      
      // If a preset route specifies a recommended stop, use that
      if (options.presetRouteId) {
        const preset = this.presetRoutes.find(p => p.id === options.presetRouteId);
        if (preset && preset.recommendedStopStationId) {
          const match = allStations.find(s => s.id === preset.recommendedStopStationId);
          if (match) selectedStation = match;
        }
      }

      if (selectedStation) {
        // Calculate charging time required to reach safe departure SoC (80% or sufficient for remainder)
        const stopDistanceKm = Math.round(distanceKm * 0.45 * 10) / 10;
        const energyToStopWh = stopDistanceKm * dynamicWhPerKm;
        const arrivalSocAtStop = Math.max(5, Math.round(((remainingBatteryWh - energyToStopWh) / (vehicle.usableCapacityKwh * 1000)) * 100));
        
        let chargeDurationMinutes = 25;
        let departureSocPercent = 85;
        let estimatedCost = 35;

        if (selectedStation.isBatterySwap) {
          chargeDurationMinutes = 2; // Instant 60s pack swap
          departureSocPercent = 100;
          estimatedCost = selectedStation.pricingPerKwh || 35;
        } else {
          // Calculate charging speed: Power (kW) delivered
          const chargePowerKw = Math.min(selectedStation.powerKw, vehicle.maxDcFastPowerKw || vehicle.maxChargingPowerKw || 3.3);
          const energyToRechargeWh = ((departureSocPercent - arrivalSocAtStop) / 100) * (vehicle.usableCapacityKwh * 1000);
          chargeDurationMinutes = Math.round((energyToRechargeWh / (chargePowerKw * 1000)) * 60);
          estimatedCost = Math.round((energyToRechargeWh / 1000) * (selectedStation.pricingPerKwh || 14));
        }

        plan.stops.push({
          stopNumber: 1,
          stationId: selectedStation.id,
          stationName: selectedStation.name,
          operator: selectedStation.operator,
          location: selectedStation.address,
          distanceFromOriginKm: stopDistanceKm,
          arrivalSocPercent: arrivalSocAtStop,
          departureSocPercent: departureSocPercent,
          chargeDurationMinutes: Math.max(2, chargeDurationMinutes),
          chargingPowerKw: selectedStation.powerKw,
          isBatterySwap: selectedStation.isBatterySwap,
          estimatedCost: estimatedCost,
          currency: selectedStation.currencySymbol || "₹",
          amenities: selectedStation.amenities.slice(0, 3)
        });

        plan.totalTripMinutes = drivingTimeMinutes + chargeDurationMinutes;
        plan.finalArrivalSocPercent = Math.max(25, departureSocPercent - Math.round(((distanceKm - stopDistanceKm) * dynamicWhPerKm) / (vehicle.usableCapacityKwh * 1000) * 100));
      } else {
        plan.totalTripMinutes = drivingTimeMinutes;
        plan.finalArrivalSocPercent = 5;
        plan.warning = "No compatible charging station found along this corridor! Consider reducing speed or switching to a swappable EV.";
      }
    } else {
      plan.totalTripMinutes = drivingTimeMinutes;
      plan.finalArrivalSocPercent = projectedArrivalSocPercent;
    }

    this.currentPlan = plan;
    return { success: true, plan };
  }

  getCurrentPlan() {
    return this.currentPlan;
  }
}

window.tripPlanner = new TripPlanner();
