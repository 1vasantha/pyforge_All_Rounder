/**
 * Enterprise EV Platform - Charging & Swapping Stations Network Database
 * Includes compatibility matching, real-time availability, ratings, and amenity filtering.
 */

const SEED_STATIONS = [
  // --- BENGALURU & TECH CORRIDOR ---
  {
    id: "st_ather_indiranagar",
    name: "Ather Grid - 100ft Road Indiranagar",
    operator: "Ather Energy",
    brandColor: "#10b981",
    lat: 12.9716,
    lng: 77.6412,
    address: "100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru",
    city: "Bengaluru",
    supportedConnectors: ["Ather Grid Fast", "15A 3-Pin AC (Ather Dot)"],
    powerKw: 6.0,
    isFastCharger: true,
    isBatterySwap: false,
    totalPorts: 4,
    availablePorts: 3,
    pricingPerKwh: 12.5,
    currencySymbol: "₹",
    operatingHours: "24/7 (Open All Days)",
    amenities: ["Cafe Coffee Day", "Restroom", "Free Wi-Fi", "Tyre Air Pump", "24/7 CCTV"],
    rating: 4.8,
    reviewCount: 184,
    status: "Available",
    qrCodeId: "ATHER-INDIRA-01",
    acceptsReservation: true,
    reviews: [
      { user: "Rohan K.", rating: 5, date: "2 days ago", comment: "Fast 1.5 km/min charge speed! Nice cafe next door." },
      { user: "Priya S.", rating: 4, date: "1 week ago", comment: "Cables in good condition. Smooth app unlock." }
    ]
  },
  {
    id: "st_ola_koramangala",
    name: "Ola Hypercharger - 5th Block Koramangala",
    operator: "Ola Electric",
    brandColor: "#06b6d4",
    lat: 12.9352,
    lng: 77.6245,
    address: "80 Feet Rd, 5th Block, Koramangala, Bengaluru",
    city: "Bengaluru",
    supportedConnectors: ["Ola Hypercharger"],
    powerKw: 8.0,
    isFastCharger: true,
    isBatterySwap: false,
    totalPorts: 6,
    availablePorts: 4,
    pricingPerKwh: 11.0,
    currencySymbol: "₹",
    operatingHours: "24/7 (Open All Days)",
    amenities: ["Convenience Store", "Covered Canopy", "Restroom", "EV Lounge"],
    rating: 4.6,
    reviewCount: 220,
    status: "Available",
    qrCodeId: "OLA-KORA-HYPER-02",
    acceptsReservation: true,
    reviews: [
      { user: "Vikram R.", rating: 5, date: "3 days ago", comment: "Charged my S1 Pro from 20% to 70% in under 18 mins." }
    ]
  },
  {
    id: "st_tata_ez_whitefield",
    name: "Tata Power EZ Charge - ITPL Main Road",
    operator: "Tata Power",
    brandColor: "#3b82f6",
    lat: 12.9863,
    lng: 77.7298,
    address: "ITPL Main Rd, Whitefield, Bengaluru",
    city: "Bengaluru",
    supportedConnectors: ["CCS2 DC", "Type 2 AC", "Bharat AC001", "15A 3-Pin AC"],
    powerKw: 60.0,
    isFastCharger: true,
    isBatterySwap: false,
    totalPorts: 8,
    availablePorts: 5,
    pricingPerKwh: 18.0,
    currencySymbol: "₹",
    operatingHours: "24/7 (Open All Days)",
    amenities: ["Starbucks Cafe", "Food Court", "Valet Parking", "Restroom", "Security"],
    rating: 4.7,
    reviewCount: 312,
    status: "Available",
    qrCodeId: "TATA-EZ-ITPL-03",
    acceptsReservation: true,
    reviews: [
      { user: "Anand M.", rating: 5, date: "Yesterday", comment: "Great multi-standard hub, works for both 2W bikes and 4W cars." }
    ]
  },
  {
    id: "st_gogoro_swap_hsr",
    name: "Gogoro GoStation - HSR Sector 3",
    operator: "Gogoro",
    brandColor: "#10b981",
    lat: 12.9116,
    lng: 77.6473,
    address: "27th Main Rd, Sector 3, HSR Layout, Bengaluru",
    city: "Bengaluru",
    supportedConnectors: ["Gogoro GoStation Swappable"],
    powerKw: 15.0,
    isFastCharger: true,
    isBatterySwap: true,
    totalPorts: 12,
    availablePorts: 10,
    pricingPerKwh: 35.0, // per swap flat rate
    currencySymbol: "₹",
    operatingHours: "24/7 (Open All Days)",
    amenities: ["Quick Swap (<60s)", "Self-Service", "Shelter Canopy", "CCTV"],
    rating: 4.9,
    reviewCount: 94,
    status: "Available",
    qrCodeId: "GOGORO-HSR-01",
    acceptsReservation: true,
    reviews: [
      { user: "Deepak S.", rating: 5, date: "Yesterday", comment: "Full swap in 45 seconds! Zero waiting time." }
    ]
  },
  {
    id: "st_sun_mobility_mg_road",
    name: "Sun Mobility Quick Swap Dock - MG Road",
    operator: "Sun Mobility",
    brandColor: "#f59e0b",
    lat: 12.9756,
    lng: 77.6094,
    address: "Near Trinity Metro Station, MG Road, Bengaluru",
    city: "Bengaluru",
    supportedConnectors: ["Battery Swap", "Removable Pack Fast Dock"],
    powerKw: 10.0,
    isFastCharger: true,
    isBatterySwap: true,
    totalPorts: 8,
    availablePorts: 6,
    pricingPerKwh: 40.0,
    currencySymbol: "₹",
    operatingHours: "06:00 - 23:00",
    amenities: ["Metro Access", "Express Swapping", "Assisted Attendant"],
    rating: 4.5,
    reviewCount: 78,
    status: "Available",
    qrCodeId: "SUN-MOB-MG-04",
    acceptsReservation: false,
    reviews: [
      { user: "Karthik N.", rating: 4, date: "4 days ago", comment: "Very handy for commercial delivery riders." }
    ]
  },
  {
    id: "st_zeon_electronic_city",
    name: "Zeon Charging Hub - Electronic City Phase 1",
    operator: "Zeon Charging",
    brandColor: "#8b5cf6",
    lat: 12.8452,
    lng: 77.6602,
    address: "Hosur Rd, Phase 1, Electronic City, Bengaluru",
    city: "Bengaluru",
    supportedConnectors: ["CCS2 DC", "Type 2 AC", "Bharat AC001", "15A 3-Pin AC", "UV Boost Charger"],
    powerKw: 50.0,
    isFastCharger: true,
    isBatterySwap: false,
    totalPorts: 6,
    availablePorts: 2,
    pricingPerKwh: 17.5,
    currencySymbol: "₹",
    operatingHours: "24/7 (Open All Days)",
    amenities: ["Diner", "Restrooms", "Fast Wi-Fi", "EV Tyre Inflator"],
    rating: 4.7,
    reviewCount: 145,
    status: "Available",
    qrCodeId: "ZEON-ECITY-05",
    acceptsReservation: true,
    reviews: [
      { user: "Suresh P.", rating: 5, date: "1 week ago", comment: "Charged my Ultraviolette F77 fast. Great highway hub." }
    ]
  },
  {
    id: "st_jio_bp_hebbal",
    name: "Jio-bp pulse - Bellary Road Hebbal",
    operator: "Jio-bp pulse",
    brandColor: "#059669",
    lat: 13.0358,
    lng: 77.5970,
    address: "Airport Exit Road, Hebbal Flyover, Bengaluru",
    city: "Bengaluru",
    supportedConnectors: ["CCS2 DC", "Type 2 AC", "Bharat DC001", "15A 3-Pin AC"],
    powerKw: 60.0,
    isFastCharger: true,
    isBatterySwap: false,
    totalPorts: 6,
    availablePorts: 1,
    pricingPerKwh: 16.0,
    currencySymbol: "₹",
    operatingHours: "24/7 (Open All Days)",
    amenities: ["Wild Bean Cafe", "Restroom", "ATM", "Air & Water", "Fuel Court"],
    rating: 4.4,
    reviewCount: 198,
    status: "Busy",
    qrCodeId: "JIOBP-HEBBAL-06",
    acceptsReservation: true,
    reviews: [
      { user: "Manoj G.", rating: 4, date: "5 days ago", comment: "Only 1 port open when I arrived, but charging was consistent." }
    ]
  },
  {
    id: "st_ather_jayanagar",
    name: "Ather Space Experience Center - Jayanagar 4th Block",
    operator: "Ather Energy",
    brandColor: "#10b981",
    lat: 12.9299,
    lng: 77.5824,
    address: "11th Main, 4th Block, Jayanagar, Bengaluru",
    city: "Bengaluru",
    supportedConnectors: ["Ather Grid Fast", "15A 3-Pin AC (Ather Dot)"],
    powerKw: 6.0,
    isFastCharger: true,
    isBatterySwap: false,
    totalPorts: 4,
    availablePorts: 4,
    pricingPerKwh: 12.0,
    currencySymbol: "₹",
    operatingHours: "08:00 - 22:00",
    amenities: ["Ather Lounge", "Service Support", "Free Coffee", "Showroom"],
    rating: 4.9,
    reviewCount: 260,
    status: "Available",
    qrCodeId: "ATHER-JAYA-07",
    acceptsReservation: true,
    reviews: [
      { user: "Varun B.", rating: 5, date: "Yesterday", comment: "Super clean, helpful staff, and top charging reliability." }
    ]
  },
  // --- MUMBAI & PUNE CORRIDOR ---
  {
    id: "st_tata_bkc_mumbai",
    name: "Tata Power Mega Hub - BKC G Block",
    operator: "Tata Power",
    brandColor: "#3b82f6",
    lat: 19.0657,
    lng: 72.8682,
    address: "Bandra Kurla Complex, Bandra East, Mumbai",
    city: "Mumbai",
    supportedConnectors: ["CCS2 DC", "Type 2 AC", "Bharat AC001", "15A 3-Pin AC"],
    powerKw: 120.0,
    isFastCharger: true,
    isBatterySwap: false,
    totalPorts: 12,
    availablePorts: 7,
    pricingPerKwh: 19.0,
    currencySymbol: "₹",
    operatingHours: "24/7 (Open All Days)",
    amenities: ["Food Plaza", "Restroom", "24/7 Security", "Solar Canopy"],
    rating: 4.8,
    reviewCount: 410,
    status: "Available",
    qrCodeId: "TATA-BKC-08",
    acceptsReservation: true,
    reviews: [
      { user: "Rajesh S.", rating: 5, date: "3 days ago", comment: "Prime location in BKC. Multiple high-output dispensers." }
    ]
  },
  {
    id: "st_ola_navi_mumbai",
    name: "Ola Hypercharger - Vashi Sector 17",
    operator: "Ola Electric",
    brandColor: "#06b6d4",
    lat: 19.0771,
    lng: 72.9986,
    address: "Sector 17, Vashi, Navi Mumbai",
    city: "Mumbai",
    supportedConnectors: ["Ola Hypercharger"],
    powerKw: 8.0,
    isFastCharger: true,
    isBatterySwap: false,
    totalPorts: 4,
    availablePorts: 3,
    pricingPerKwh: 11.5,
    currencySymbol: "₹",
    operatingHours: "24/7 (Open All Days)",
    amenities: ["Shopping Mall Nearby", "Restroom", "Convenience Store"],
    rating: 4.5,
    reviewCount: 115,
    status: "Available",
    qrCodeId: "OLA-VASHI-09",
    acceptsReservation: true,
    reviews: []
  },
  // --- DELHI NCR & HIGHWAY ---
  {
    id: "st_chargepoint_connaught",
    name: "Statiq / ChargePoint Hub - Connaught Place",
    operator: "Statiq Network",
    brandColor: "#ec4899",
    lat: 28.6315,
    lng: 77.2167,
    address: "Outer Circle, Connaught Place, New Delhi",
    city: "New Delhi",
    supportedConnectors: ["CCS2 DC", "Type 2 AC", "Bharat AC001", "15A 3-Pin AC"],
    powerKw: 50.0,
    isFastCharger: true,
    isBatterySwap: false,
    totalPorts: 8,
    availablePorts: 4,
    pricingPerKwh: 15.0,
    currencySymbol: "₹",
    operatingHours: "24/7 (Open All Days)",
    amenities: ["Metro CP", "Shopping & Dining", "Restroom", "CCTV"],
    rating: 4.6,
    reviewCount: 280,
    status: "Available",
    qrCodeId: "STATIQ-CP-10",
    acceptsReservation: true,
    reviews: []
  },
  // --- GLOBAL HUBS (LONDON / US / EUROPE) ---
  {
    id: "st_bp_pulse_london",
    name: "BP Pulse Fast Charging Hub - Hammersmith",
    operator: "BP Pulse",
    brandColor: "#10b981",
    lat: 51.4927,
    lng: -0.2244,
    address: "King St, Hammersmith, London",
    city: "London",
    supportedConnectors: ["CCS2 DC", "Type 2 AC"],
    powerKw: 150.0,
    isFastCharger: true,
    isBatterySwap: false,
    totalPorts: 8,
    availablePorts: 5,
    pricingPerKwh: 0.69,
    currencySymbol: "£",
    operatingHours: "24/7 (Open All Days)",
    amenities: ["M&S Simply Food", "Restroom", "Costa Coffee", "Free Air"],
    rating: 4.7,
    reviewCount: 350,
    status: "Available",
    qrCodeId: "BPPULSE-LON-11",
    acceptsReservation: true,
    reviews: []
  },
  {
    id: "st_chargepoint_sf",
    name: "ChargePoint Express Plus - SOMA San Francisco",
    operator: "ChargePoint",
    brandColor: "#ea580c",
    lat: 37.7749,
    lng: -122.4194,
    address: "8th & Market St, SOMA, San Francisco, CA",
    city: "San Francisco",
    supportedConnectors: ["CCS2 DC", "J1772", "Type 2 AC", "Tesla Supercharger"],
    powerKw: 250.0,
    isFastCharger: true,
    isBatterySwap: false,
    totalPorts: 16,
    availablePorts: 9,
    pricingPerKwh: 0.38,
    currencySymbol: "$",
    operatingHours: "24/7 (Open All Days)",
    amenities: ["Cafe", "Whole Foods Nearby", "Restrooms", "Security Patrol"],
    rating: 4.8,
    reviewCount: 520,
    status: "Available",
    qrCodeId: "CP-SOMA-12",
    acceptsReservation: true,
    reviews: []
  }
];

class StationsManager {
  constructor() {
    this.stations = [];
    this.userCoords = { lat: 12.9716, lng: 77.5946 }; // Default: Central Bengaluru (customizable)
    this.favoriteStationIds = new Set();
    this.init();
  }

  init() {
    const stored = localStorage.getItem('aerovolt_stations');
    if (stored) {
      try {
        this.stations = JSON.parse(stored);
      } catch (e) {
        this.stations = [...SEED_STATIONS];
      }
    } else {
      this.stations = [...SEED_STATIONS];
      this.persist();
    }

    const storedFavs = localStorage.getItem('aerovolt_favorites');
    if (storedFavs) {
      try {
        this.favoriteStationIds = new Set(JSON.parse(storedFavs));
      } catch (e) {
        this.favoriteStationIds = new Set();
      }
    }

    // Try HTML5 Geolocation if permitted, else keep simulated GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          window.dispatchEvent(new CustomEvent('userLocationUpdated', { detail: this.userCoords }));
        },
        err => {
          // silently keep default
        },
        { timeout: 5000 }
      );
    }
  }

  persist() {
    localStorage.setItem('aerovolt_stations', JSON.stringify(this.stations));
    localStorage.setItem('aerovolt_favorites', JSON.stringify([...this.favoriteStationIds]));
  }

  getAllStations() {
    return this.stations;
  }

  getStationById(id) {
    return this.stations.find(s => s.id === id);
  }

  setUserCoordinates(lat, lng) {
    this.userCoords = { lat, lng };
    window.dispatchEvent(new CustomEvent('userLocationUpdated', { detail: this.userCoords }));
  }

  getUserCoordinates() {
    return this.userCoords;
  }

  /**
   * Haversine formula to compute distance in km
   */
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Compatibility matching between vehicle and charging station
   */
  checkCompatibility(station, vehicle) {
    if (!station || !vehicle) return { isCompatible: false, matchedConnectors: [], message: "Missing data" };

    const vehicleConnectors = vehicle.supportedConnectors || [];
    const stationConnectors = station.supportedConnectors || [];

    const matched = stationConnectors.filter(sc =>
      vehicleConnectors.some(vc => vc.toLowerCase().trim() === sc.toLowerCase().trim() ||
        (vc.includes("15A") && sc.includes("15A")) ||
        (vc.includes("CCS2") && sc.includes("CCS2")) ||
        (vc.includes("Type 2") && sc.includes("Type 2")) ||
        (vc.includes("Ather") && sc.includes("Ather")) ||
        (vc.includes("Ola") && sc.includes("Ola")) ||
        (vc.includes("Swap") && sc.includes("Swap"))
      )
    );

    const isCompatible = matched.length > 0;
    return {
      isCompatible,
      matchedConnectors: matched,
      message: isCompatible
        ? `Compatible with ${vehicle.name} via ${matched.join(', ')}`
        : `Incompatible: Station offers [${stationConnectors.join(', ')}], but ${vehicle.name} requires [${vehicleConnectors.join(', ')}]`
    };
  }

  /**
   * Search, filter, and sort stations
   */
  getFilteredStations(filters = {}, activeVehicle = null) {
    let result = this.stations.map(station => {
      const dist = this.calculateDistanceKm(this.userCoords.lat, this.userCoords.lng, station.lat, station.lng);
      // Rough travel time assuming 30 km/h urban speed
      const etaMins = Math.round((dist / 30) * 60) + 2;
      const compat = activeVehicle ? this.checkCompatibility(station, activeVehicle) : { isCompatible: true, matchedConnectors: [] };
      const isFav = this.favoriteStationIds.has(station.id);

      return {
        ...station,
        distanceKm: dist,
        etaMins: etaMins,
        compatibility: compat,
        isFavorite: isFav
      };
    });

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.operator.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
      );
    }

    if (filters.onlyCompatible && activeVehicle) {
      result = result.filter(s => s.compatibility.isCompatible);
    }

    if (filters.onlyFastCharging) {
      result = result.filter(s => s.isFastCharger || s.powerKw >= 10);
    }

    if (filters.onlyBatterySwap) {
      result = result.filter(s => s.isBatterySwap);
    }

    if (filters.onlyAvailable) {
      result = result.filter(s => s.availablePorts > 0 && s.status === 'Available');
    }

    if (filters.connectorType && filters.connectorType !== 'all') {
      result = result.filter(s => s.supportedConnectors.some(c => c.toLowerCase().includes(filters.connectorType.toLowerCase())));
    }

    if (filters.favoritesOnly) {
      result = result.filter(s => s.isFavorite);
    }

    // Sort by distance by default
    result.sort((a, b) => a.distanceKm - b.distanceKm);

    return result;
  }

  toggleFavorite(stationId) {
    if (this.favoriteStationIds.has(stationId)) {
      this.favoriteStationIds.delete(stationId);
    } else {
      this.favoriteStationIds.add(stationId);
    }
    this.persist();
    window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: [...this.favoriteStationIds] }));
    return this.favoriteStationIds.has(stationId);
  }

  addReview(stationId, review) {
    const station = this.getStationById(stationId);
    if (station) {
      if (!station.reviews) station.reviews = [];
      station.reviews.unshift({
        user: review.user || "EV Community Rider",
        rating: review.rating || 5,
        date: "Just now",
        comment: review.comment || "Great experience charging here!"
      });
      // Recalculate average rating
      const sum = station.reviews.reduce((acc, r) => acc + r.rating, 0);
      station.rating = Math.round((sum / station.reviews.length) * 10) / 10;
      station.reviewCount = station.reviews.length;
      this.persist();
      return station;
    }
    return null;
  }

  reportIssue(stationId, issueType, details) {
    const station = this.getStationById(stationId);
    if (station) {
      if (!station.incidentReports) station.incidentReports = [];
      station.incidentReports.unshift({
        id: "rep_" + Date.now(),
        type: issueType,
        details: details,
        timestamp: new Date().toISOString()
      });
      if (issueType === 'broken_charger' && station.availablePorts > 0) {
        station.availablePorts = Math.max(0, station.availablePorts - 1);
        if (station.availablePorts === 0) station.status = 'Busy';
      }
      this.persist();
      return true;
    }
    return false;
  }

  reserveSlot(stationId, vehicleId, durationMins = 30) {
    const station = this.getStationById(stationId);
    if (station && station.availablePorts > 0) {
      station.availablePorts -= 1;
      const reservation = {
        id: "RES-" + Math.floor(100000 + Math.random() * 900000),
        stationId: station.id,
        stationName: station.name,
        vehicleId: vehicleId,
        reservedAt: new Date().toISOString(),
        durationMins: durationMins,
        status: "Confirmed",
        qrToken: "RES-QR-" + Date.now()
      };
      this.persist();
      return reservation;
    }
    return null;
  }
}

window.stationsManager = new StationsManager();
