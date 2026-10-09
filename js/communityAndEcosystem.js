/**
 * Enterprise EV Platform - Community, AI Driving Coach, Battery Swapping & Complete Ecosystem
 * Integrates QR Checkout, Emergency Roadside SOS, Document Locker, and Green Loyalty Rewards.
 */

class EcosystemManager {
  constructor() {
    this.loyaltyPoints = 420;
    this.sosActive = false;
    this.activeSwapReservation = null;
    this.lastReceipt = null;
    this.documents = [];
    this.init();
  }

  init() {
    const storedDocs = localStorage.getItem('aerovolt_documents');
    if (storedDocs) {
      try {
        this.documents = JSON.parse(storedDocs);
      } catch (e) {
        this.documents = this.getSeedDocuments();
      }
    } else {
      this.documents = this.getSeedDocuments();
      this.persistDocs();
    }

    const storedPoints = localStorage.getItem('aerovolt_points');
    if (storedPoints) this.loyaltyPoints = parseInt(storedPoints, 10);
  }

  persistDocs() {
    localStorage.setItem('aerovolt_documents', JSON.stringify(this.documents));
  }

  persistPoints() {
    localStorage.setItem('aerovolt_points', this.loyaltyPoints.toString());
  }

  getSeedDocuments() {
    return [
      {
        id: "doc_01",
        title: "Comprehensive EV Motor Insurance",
        issuer: "Acko General Insurance",
        policyNumber: "POL-EV-2024-998812",
        expiryDate: "2025-11-20",
        vehicleReg: "KA-01-EV-4509",
        status: "Active",
        type: "Insurance"
      },
      {
        id: "doc_02",
        title: "Vehicle Registration Certificate (RC)",
        issuer: "Transport Dept, Govt of Karnataka",
        policyNumber: "RC-KA01-2024-4509",
        expiryDate: "2039-01-15",
        vehicleReg: "KA-01-EV-4509",
        status: "Active",
        type: "RC Book"
      },
      {
        id: "doc_03",
        title: "Battery 5-Year Unlimited Warranty",
        issuer: "Ather Energy / OEM Warranty",
        policyNumber: "BATT-WARR-8831-NMC",
        expiryDate: "2029-01-10",
        vehicleReg: "KA-01-EV-4509",
        status: "Active",
        type: "Warranty"
      }
    ];
  }

  getDocuments() {
    return this.documents;
  }

  addDocument(doc) {
    this.documents.push({
      id: "doc_" + Date.now(),
      title: doc.title || "Vehicle Document",
      issuer: doc.issuer || "Authorized Provider",
      policyNumber: doc.policyNumber || "DOC-" + Math.floor(100000 + Math.random() * 900000),
      expiryDate: doc.expiryDate || "2026-12-31",
      vehicleReg: doc.vehicleReg || "KA-01-EV-4509",
      status: "Active",
      type: doc.type || "General"
    });
    this.persistDocs();
    return this.documents;
  }

  /**
   * Generates tailored AI Driving Efficiency Coaching Tips
   */
  getAiCoachingInsights(vehicle, rangeData) {
    const tips = [
      {
        category: "Throttle Modulation",
        title: "Smooth Progressive Acceleration",
        badge: "High Impact",
        impact: "+14% Range Gain",
        desc: "Hard starts from red lights draw up to 4x nominal current. Progressive linear throttle modulation preserves cell temperature and maximizes battery range."
      },
      {
        category: "Regenerative Braking",
        title: "One-Pedal / Twist Throttle Regen Utilization",
        badge: "Energy Recovery",
        impact: "+12% Kinetic Energy Captured",
        desc: "Anticipate traffic stops 100 meters ahead. Releasing the throttle early lets the motor act as a generator, pumping electricity back into your battery pack."
      },
      {
        category: "Aerodynamics & Cruising",
        title: "Sweet Spot Cruising Speed (40 - 52 km/h)",
        badge: "Aero Physics",
        impact: "+18% Wh/km Improvement",
        desc: "Aerodynamic drag increases quadratically with speed. Cruising at 45 km/h requires almost 40% less motor power than maintaining 75 km/h on urban corridors."
      },
      {
        category: "Thermal Management",
        title: "Post-Ride Thermal Charging Window",
        badge: "Battery Life",
        impact: "+5% SOH Longevity",
        desc: "Plug in right after your trip while the battery electrolyte is warm (25°C - 35°C) for optimal chemical acceptance and lower internal impedance."
      }
    ];

    if (vehicle && vehicle.tyreFrontPsi < 29) {
      tips.unshift({
        category: "Tyre Mechanics",
        title: "Restore Tyre Pressure to Spec",
        badge: "Immediate Action",
        impact: "+7% Immediate Recovery",
        desc: `Your front tyre is currently at ${vehicle.tyreFrontPsi} PSI (Recommended 30 PSI). Inflating to spec eliminates tyre contact squirm and rolling drag.`
      });
    }

    return tips;
  }

  /**
   * Battery Swapping: Reserve 2 packs in 60 seconds
   */
  reserveBatterySwap(stationId = "st_gogoro_swap_hsr") {
    const station = window.stationsManager.getStationById(stationId) || window.stationsManager.getAllStations().find(s => s.isBatterySwap);
    const otp = Math.floor(100000 + Math.random() * 900000);
    const reservation = {
      id: "SWAP-" + Date.now(),
      stationName: station ? station.name : "Gogoro Smart GoStation",
      stationAddress: station ? station.address : "HSR Sector 3",
      otpCode: otp,
      reservedPacks: 2,
      expiryTimestamp: new Date(Date.now() + 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: station ? station.pricingPerKwh : 35.0,
      currency: "₹"
    };

    this.activeSwapReservation = reservation;
    this.loyaltyPoints += 15; // Reward points for swapping
    this.persistPoints();

    return reservation;
  }

  /**
   * QR Charger Checkout & Digital Tax Receipt Generator
   */
  processQrPayment(paymentData) {
    const txId = "TXN-EV-" + Math.floor(10000000 + Math.random() * 90000000);
    const totalAmount = paymentData.amount || 45.0;
    const gstRate = 0.05; // 5% EV GST
    const baseAmount = Math.round((totalAmount / (1 + gstRate)) * 100) / 100;
    const gstAmount = Math.round((totalAmount - baseAmount) * 100) / 100;

    const receipt = {
      transactionId: txId,
      date: new Date().toLocaleString(),
      stationName: paymentData.stationName || "AeroVolt High-Speed Charging Hub",
      chargerPort: paymentData.portNumber || "Bay #02 (CCS2 Fast)",
      energyDeliveredKwh: paymentData.kwh || 3.2,
      pricePerKwh: paymentData.pricePerKwh || 14.0,
      baseAmount: baseAmount,
      taxGst: gstAmount,
      totalPaid: totalAmount,
      currency: paymentData.currency || "₹",
      paymentMethod: paymentData.paymentMethod || "UPI / Green Wallet",
      status: "Successful",
      greenPointsEarned: Math.round(paymentData.kwh * 5 || 16)
    };

    this.lastReceipt = receipt;
    this.loyaltyPoints += receipt.greenPointsEarned;
    this.persistPoints();

    return receipt;
  }

  getLastReceipt() {
    return this.lastReceipt;
  }

  /**
   * Emergency Roadside Assistance (SOS Dispatch)
   */
  dispatchEmergencySos(vehicle, userCoords) {
    this.sosActive = true;
    const ticketId = "SOS-" + Math.floor(10000 + Math.random() * 90000);
    const etaMinutes = 14;

    const sosTicket = {
      ticketId: ticketId,
      vehicleName: vehicle ? vehicle.name : "Electric Two-Wheeler",
      regNumber: vehicle ? vehicle.regNumber : "EV-4509",
      lat: userCoords ? userCoords.lat : 12.9716,
      lng: userCoords ? userCoords.lng : 77.5946,
      serviceDispatched: "Mobile EV Van with 15 kW DC Powerbank + Hydraulic Recovery Tow",
      driverName: "Vikram Chauhan (Lead Recovery Specialist)",
      driverContact: "+91 800-EV-RESCUE",
      etaMinutes: etaMinutes,
      status: "En Route to Your GPS Location"
    };

    return sosTicket;
  }

  getLoyaltyPoints() {
    return this.loyaltyPoints;
  }

  /**
   * Curated EV Service Centers
   */
  getServiceCenters() {
    return [
      {
        name: "AeroVolt Authorized EV Express Hub - Indiranagar",
        address: "100ft Rd, Indiranagar, Bengaluru",
        phone: "+91 80 4123 4567",
        distanceKm: 2.1,
        services: ["Battery Pack Health Calibration", "Motor Controller Diagnostics", "Regen Brake Tuning", "Tyre Pressure & Wheel Alignment"],
        rating: 4.9
      },
      {
        name: "EcoMotion Multi-Brand EV Service Clinic - Koramangala",
        address: "80ft Rd, 6th Block, Koramangala, Bengaluru",
        phone: "+91 80 4234 5678",
        distanceKm: 4.5,
        services: ["BMS Firmware Flash", "Suspension Overhaul", "All-Weather Waterproofing IP67 Test"],
        rating: 4.8
      },
      {
        name: "GreenWheel EV Specialist Care - Whitefield",
        address: "ITPL Main Road, Whitefield, Bengaluru",
        phone: "+91 80 4345 6789",
        distanceKm: 8.9,
        services: ["General 5,000 km Service", "Fast Charger Port Repair", "Cell Balancing"],
        rating: 4.7
      }
    ];
  }
}

window.ecosystemManager = new EcosystemManager();
