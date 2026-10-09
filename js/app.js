/**
 * Enterprise EV Platform - Main Application Controller (AeroVolt EV Enterprise)
 * Coordinates tabs, reactive physics calculations, interactive map, telemetry, and modals.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Internationalization
  window.i18n.init();

  // 2. Global State
  let currentActiveTab = 'dashboard';
  let leafletMap = null;
  let mapMarkers = [];

  // Populate Language Selector
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.innerHTML = window.i18n.supportedLocales
      .map(loc => `<option value="${loc.code}" ${loc.code === window.i18n.currentLocale ? 'selected' : ''}>${loc.flag} ${loc.name}</option>`)
      .join('');

    langSelect.addEventListener('change', (e) => {
      window.i18n.setLocale(e.target.value);
      renderAllViews();
    });
  }

  // Theme Toggle
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('aerovolt_theme', nextTheme);
      themeToggleBtn.innerHTML = nextTheme === 'dark' 
        ? '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>'
        : '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>';
    });

    const savedTheme = localStorage.getItem('aerovolt_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }

  // Tab Navigation Handling
  function switchTab(tabId) {
    currentActiveTab = tabId;
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-btn').forEach(n => n.classList.remove('active'));

    const targetPane = document.getElementById(`tab-${tabId}`);
    if (targetPane) targetPane.classList.add('active');

    const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (activeNav) activeNav.classList.add('active');

    const activeMobileNav = document.querySelector(`.mobile-nav-btn[data-tab="${tabId}"]`);
    if (activeMobileNav) activeMobileNav.classList.add('active');

    if (tabId === 'map') {
      setTimeout(() => initOrRefreshMap(), 150);
    } else if (tabId === 'fleet') {
      renderFleetPortal();
    } else if (tabId === 'garage') {
      renderGarageView();
    } else if (tabId === 'analytics') {
      renderAnalyticsView();
    } else if (tabId === 'ecosystem') {
      renderEcosystemView();
    } else if (tabId === 'route') {
      renderTripPlannerView();
    }
  }

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // -------------------------------------------------------------
  // Top Header & Active Vehicle
  // -------------------------------------------------------------
  function updateHeaderVehicleDisplay() {
    const v = window.vehicleManager.getActiveVehicle();
    if (!v) return;

    const nameEl = document.getElementById('headerVehicleName');
    const socEl = document.getElementById('headerVehicleSoc');
    if (nameEl) nameEl.textContent = `${v.make} ${v.model}`;
    if (socEl) socEl.textContent = `${v.currentSocPercent}%`;

    // Run diagnostics
    window.alertsEngine.evaluateVehicleDiagnostics(v);
    updateAlertsBadge();
  }

  function updateAlertsBadge() {
    const badgeEl = document.getElementById('alertsBadge');
    const unread = window.alertsEngine.getUnreadCount();
    if (badgeEl) {
      if (unread > 0) {
        badgeEl.textContent = unread;
        badgeEl.style.display = 'inline-block';
      } else {
        badgeEl.style.display = 'none';
      }
    }
  }

  function renderAlertsList() {
    const container = document.getElementById('alertsListContainer');
    if (!container) return;

    const alerts = window.alertsEngine.getAlerts();
    if (alerts.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--accent-emerald);">✓ All vehicle diagnostics nominal. No active warnings.</div>`;
      return;
    }

    container.innerHTML = alerts.map(a => `
      <div class="status-pill ${a.severity}" style="padding: 12px; font-size: 0.85rem; border-radius: 8px; display: flex; flex-direction: column; gap: 4px; align-items: flex-start; width: 100%;">
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
          <b>${a.severity === 'danger' ? '🚨' : (a.severity === 'warning' ? '⚠️' : 'ℹ️')} ${a.title}</b>
          <button style="background: transparent; border: none; color: inherit; cursor: pointer; font-size: 1rem;" onclick="window.appDismissAlert('${a.id}')">&times;</button>
        </div>
        <div style="font-weight: normal; opacity: 0.95;">${a.message}</div>
        ${a.actionLabel ? `
          <button class="btn btn-secondary btn-sm" style="margin-top: 6px;" onclick="window.appAlertAction('${a.actionTab || ''}')">
            ${a.actionLabel} &rarr;
          </button>
        ` : ''}
      </div>
    `).join('');

    window.alertsEngine.markAllAsRead();
    updateAlertsBadge();
  }

  window.appDismissAlert = (id) => {
    window.alertsEngine.dismissAlert(id);
    renderAlertsList();
    updateAlertsBadge();
  };

  window.appAlertAction = (tab) => {
    document.getElementById('alertsModal')?.classList.remove('open');
    if (tab) switchTab(tab);
  };

  const alertsBellBtn = document.getElementById('alertsBellBtn');
  if (alertsBellBtn) {
    alertsBellBtn.addEventListener('click', () => {
      renderAlertsList();
      document.getElementById('alertsModal')?.classList.add('open');
    });
  }


  // -------------------------------------------------------------
  // Dashboard & Real-Time Physics Range Engine
  // -------------------------------------------------------------
  function renderDashboard() {
    const vehicle = window.vehicleManager.getActiveVehicle();
    if (!vehicle) return;

    // Environmental slider values
    const tempSlider = document.getElementById('sliderTemp');
    const payloadSlider = document.getElementById('sliderPayload');
    const modeSelect = document.getElementById('selectMode');
    const terrainSelect = document.getElementById('selectTerrain');
    const weatherSelect = document.getElementById('selectWeather');
    const trafficSelect = document.getElementById('selectTraffic');

    const tempVal = tempSlider ? parseFloat(tempSlider.value) : 24;
    const payloadVal = payloadSlider ? parseFloat(payloadSlider.value) : (vehicle.riderPayloadKg || 75);
    const modeVal = modeSelect ? modeSelect.value : (vehicle.currentRidingMode || "Ride");
    const terrainVal = terrainSelect ? terrainSelect.value : "flat";
    const weatherVal = weatherSelect ? weatherSelect.value : "clear";
    const trafficVal = trafficSelect ? trafficSelect.value : "moderate";

    // Update labels
    const tempDisp = document.getElementById('dispTemp');
    if (tempDisp) tempDisp.textContent = `${tempVal}°C`;
    const payloadDisp = document.getElementById('dispPayload');
    if (payloadDisp) payloadDisp.textContent = `${payloadVal} kg`;

    // Populate mode select options if needed
    if (modeSelect && modeSelect.options.length === 0 && vehicle.ridingModes) {
      modeSelect.innerHTML = vehicle.ridingModes
        .map(m => `<option value="${m.name}" ${m.name.toLowerCase() === (vehicle.currentRidingMode || '').toLowerCase() ? 'selected' : ''}>${m.name} (${m.topSpeedKmH} km/h max)</option>`)
        .join('');
    }

    // Run Physics Range Engine
    const rangeData = window.rangeEngine.calculateRange(vehicle, {
      temperatureC: tempVal,
      riderPayloadKg: payloadVal,
      ridingMode: modeVal,
      terrain: terrainVal,
      weather: weatherVal,
      traffic: trafficVal
    });

    if (!rangeData) return;

    // Update Circular Radial Gauge
    const rangeNumEl = document.getElementById('heroRangeNumber');
    const safeRangeEl = document.getElementById('heroSafeRange');
    const gaugePath = document.getElementById('gaugeProgress');

    if (rangeNumEl) rangeNumEl.textContent = rangeData.estimatedDistanceKm;
    if (safeRangeEl) safeRangeEl.textContent = `Safe Reserve: ${rangeData.safeDistanceKm} km`;

    if (gaugePath) {
      // 2 * PI * r = 2 * 3.14159 * 90 = 565.48
      const maxRange = vehicle.ratedRangeKm || 150;
      const ratio = Math.min(1.0, rangeData.estimatedDistanceKm / maxRange);
      const strokeDash = 565.48;
      const offset = strokeDash - (ratio * strokeDash);
      gaugePath.style.strokeDashoffset = offset;

      // Color code: green when > 40%, amber when 20-40%, red when < 20%
      if (vehicle.currentSocPercent <= 20) {
        gaugePath.style.stroke = 'var(--accent-rose)';
      } else if (vehicle.currentSocPercent <= 40) {
        gaugePath.style.stroke = 'var(--accent-amber)';
      } else {
        gaugePath.style.stroke = 'var(--accent-emerald)';
      }
    }

    // Key Stat Tiles
    const statSoc = document.getElementById('statSoc');
    if (statSoc) statSoc.textContent = `${vehicle.currentSocPercent}%`;

    const statSoh = document.getElementById('statSoh');
    if (statSoh) statSoh.textContent = `${vehicle.batteryHealthSohPercent}%`;

    const statEfficiency = document.getElementById('statEfficiency');
    if (statEfficiency) statEfficiency.textContent = `${rangeData.dynamicWhPerKm} Wh/km`;

    const statOdo = document.getElementById('statOdo');
    if (statOdo) statOdo.textContent = `${vehicle.odometerKm.toLocaleString()} km`;

    // Actionable AI Insights in Dashboard
    const insightsContainer = document.getElementById('dashboardInsights');
    if (insightsContainer) {
      if (rangeData.actionableInsights.length > 0) {
        insightsContainer.innerHTML = rangeData.actionableInsights
          .map(msg => `<div class="status-pill warning" style="margin-right: 6px; margin-bottom: 6px; padding: 6px 12px; font-size: 0.8rem;">💡 ${msg}</div>`)
          .join('');
      } else {
        insightsContainer.innerHTML = `<span style="font-size: 0.82rem; color: var(--accent-emerald);">✨ Optimal riding conditions detected. Operating at peak efficiency.</span>`;
      }
    }

    // Live Charging Box status
    updateChargingSimDisplay();
  }

  function updateChargingSimDisplay() {
    const simBox = document.getElementById('chargingSimStatus');
    const badge = document.getElementById('chargingSimBadge');
    const btn = document.getElementById('toggleChargeSimBtn');
    const session = window.telemetryDashboard.activeChargingSession;

    if (window.telemetryDashboard.isCharging && session) {
      if (badge) {
        badge.className = 'charging-badge active';
        badge.textContent = `⚡ Charging (${session.currentPowerKw} kW)`;
      }
      if (btn) {
        btn.textContent = 'Stop Charging';
        btn.className = 'btn btn-danger btn-sm';
      }
      document.getElementById('simPower').textContent = `${session.currentPowerKw} kW`;
      document.getElementById('simEnergy').textContent = `${session.energyDeliveredKwh} kWh`;
      document.getElementById('simCost').textContent = `${session.currency}${session.costAccrued}`;
    } else {
      if (badge) {
        badge.className = 'charging-badge idle';
        badge.textContent = 'Standby / Unplugged';
      }
      if (btn) {
        btn.textContent = 'Start Simulation Charging';
        btn.className = 'btn btn-primary btn-sm';
      }
      document.getElementById('simPower').textContent = '0.0 kW';
      document.getElementById('simEnergy').textContent = '0.0 kWh';
      document.getElementById('simCost').textContent = '₹0.00';
    }
  }

  // Charging Simulator Toggle Button
  const toggleChargeSimBtn = document.getElementById('toggleChargeSimBtn');
  if (toggleChargeSimBtn) {
    toggleChargeSimBtn.addEventListener('click', () => {
      const v = window.vehicleManager.getActiveVehicle();
      if (window.telemetryDashboard.isCharging) {
        window.telemetryDashboard.stopChargingSimulation();
      } else {
        window.telemetryDashboard.startChargingSimulation(v);
      }
    });
  }

  window.addEventListener('chargingTick', () => {
    updateChargingSimDisplay();
    renderDashboard();
    updateHeaderVehicleDisplay();
  });

  window.addEventListener('chargingStateChanged', () => {
    updateChargingSimDisplay();
    renderDashboard();
    updateHeaderVehicleDisplay();
  });

  // Environmental Controls Input Listeners
  ['sliderTemp', 'sliderPayload', 'selectMode', 'selectTerrain', 'selectWeather', 'selectTraffic'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => renderDashboard());
  });

  // -------------------------------------------------------------
  // Map & Charging Station Discovery View
  // -------------------------------------------------------------
  function initOrRefreshMap() {
    const mapContainer = document.getElementById('map-canvas');
    if (!mapContainer) return;

    const userCoords = window.stationsManager.getUserCoordinates();
    const activeVehicle = window.vehicleManager.getActiveVehicle();

    // Check if Leaflet is loaded
    if (window.L && !leafletMap) {
      leafletMap = L.map('map-canvas').setView([userCoords.lat, userCoords.lng], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19
      }).addTo(leafletMap);
    } else if (leafletMap) {
      leafletMap.invalidateSize();
    }

    renderStationMarkers();
    renderStationsList();
  }

  function renderStationMarkers() {
    if (!leafletMap || !window.L) {
      renderSvgMapFallback();
      return;
    }

    // Clear old markers
    mapMarkers.forEach(m => leafletMap.removeLayer(m));
    mapMarkers = [];

    const activeVehicle = window.vehicleManager.getActiveVehicle();
    const stations = window.stationsManager.getFilteredStations(getStationFilterOptions(), activeVehicle);
    const userCoords = window.stationsManager.getUserCoordinates();

    // User Location Marker
    const userIcon = L.divIcon({
      className: 'user-map-pin',
      html: `<div style="width: 18px; height: 18px; border-radius: 50%; background: #06b6d4; border: 3px solid #fff; box-shadow: 0 0 12px #06b6d4;"></div>`,
      iconSize: [18, 18]
    });
    const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(leafletMap);
    userMarker.bindPopup(`<b>Your Active Vehicle</b><br>${activeVehicle ? activeVehicle.name : 'EV'}`);
    mapMarkers.push(userMarker);

    // Range Isochrone Circle around user
    const rangeData = window.rangeEngine.calculateRange(activeVehicle);
    if (rangeData) {
      const radiusMeters = rangeData.estimatedDistanceKm * 1000;
      const rangeCircle = L.circle([userCoords.lat, userCoords.lng], {
        radius: radiusMeters,
        color: '#10b981',
        weight: 1.5,
        opacity: 0.7,
        fillColor: '#10b981',
        fillOpacity: 0.05,
        dashArray: '5, 8'
      }).addTo(leafletMap);
      mapMarkers.push(rangeCircle);
    }

    // Station Markers
    stations.forEach(st => {
      const isCompat = st.compatibility.isCompatible;
      const pinColor = st.isBatterySwap ? '#10b981' : (isCompat ? st.brandColor || '#3b82f6' : '#94a3b8');

      const customIcon = L.divIcon({
        className: 'station-pin',
        html: `<div style="background: ${pinColor}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; box-shadow: 0 3px 8px rgba(0,0,0,0.4); border: 2px solid ${isCompat ? '#fff' : '#64748b'};">
                ${st.isBatterySwap ? '🔄' : '⚡'}
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([st.lat, st.lng], { icon: customIcon }).addTo(leafletMap);
      marker.on('click', () => openStationDetailDrawer(st));
      mapMarkers.push(marker);
    });
  }

  function renderSvgMapFallback() {
    const mapContainer = document.getElementById('map-canvas');
    if (!mapContainer) return;

    const activeVehicle = window.vehicleManager.getActiveVehicle();
    const stations = window.stationsManager.getFilteredStations(getStationFilterOptions(), activeVehicle);

    mapContainer.innerHTML = `
      <div style="width: 100%; height: 100%; background: #0b1329; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
        <svg width="100%" height="100%" viewBox="0 0 800 600" style="position: absolute; inset: 0;">
          <!-- Grid lines -->
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <!-- Radial Range Boundary Circle -->
          <circle cx="400" cy="300" r="220" fill="rgba(16, 185, 129, 0.05)" stroke="#10b981" stroke-width="2" stroke-dasharray="6,6"/>
          <circle cx="400" cy="300" r="140" fill="rgba(6, 182, 212, 0.05)" stroke="#06b6d4" stroke-width="1" stroke-dasharray="4,4"/>
          
          <!-- User Vehicle Center Pin -->
          <circle cx="400" cy="300" r="10" fill="#06b6d4" stroke="#fff" stroke-width="2"/>
          <text x="400" y="325" fill="#22d3ee" font-size="12" font-weight="bold" text-anchor="middle">You (${activeVehicle ? activeVehicle.name : 'EV'})</text>

          <!-- Dynamic Station Nodes -->
          ${stations.slice(0, 10).map((s, idx) => {
            const angle = (idx / 10) * 2 * Math.PI;
            const distPx = Math.min(260, 50 + (s.distanceKm * 18));
            const x = 400 + Math.cos(angle) * distPx;
            const y = 300 + Math.sin(angle) * distPx;
            const isCompat = s.compatibility.isCompatible;
            return `
              <g style="cursor: pointer;" onclick="window.appOpenStation('${s.id}')">
                <line x1="400" y1="300" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
                <circle cx="${x}" cy="${y}" r="14" fill="${s.isBatterySwap ? '#10b981' : (isCompat ? '#3b82f6' : '#64748b')}" stroke="#fff" stroke-width="2"/>
                <text x="${x}" y="${y+4}" fill="#fff" font-size="11" text-anchor="middle">${s.isBatterySwap ? '🔄' : '⚡'}</text>
                <text x="${x}" y="${y+24}" fill="#e2e8f0" font-size="10" text-anchor="middle">${s.name.substring(0, 16)}</text>
              </g>
            `;
          }).join('')}
        </svg>
        <div style="position: absolute; bottom: 16px; left: 16px; background: rgba(0,0,0,0.7); padding: 8px 14px; border-radius: 8px; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.1);">
          📍 Interactive Radar Map | Range Isochrone: <b>${window.rangeEngine.calculateRange(activeVehicle).estimatedDistanceKm} km</b>
        </div>
      </div>
    `;
  }

  window.appOpenStation = (id) => {
    const s = window.stationsManager.getStationById(id);
    if (s) openStationDetailDrawer(s);
  };

  function getStationFilterOptions() {
    return {
      searchQuery: (document.getElementById('stationSearchInput')?.value || ''),
      onlyCompatible: document.getElementById('filterChipCompat')?.classList.contains('active'),
      onlyFastCharging: document.getElementById('filterChipFast')?.classList.contains('active'),
      onlyBatterySwap: document.getElementById('filterChipSwap')?.classList.contains('active'),
      onlyAvailable: document.getElementById('filterChipAvail')?.classList.contains('active'),
      favoritesOnly: document.getElementById('filterChipFav')?.classList.contains('active')
    };
  }

  function renderStationsList() {
    const listContainer = document.getElementById('stationsListContainer');
    if (!listContainer) return;

    const activeVehicle = window.vehicleManager.getActiveVehicle();
    const stations = window.stationsManager.getFilteredStations(getStationFilterOptions(), activeVehicle);

    if (stations.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">No charging stations found matching the active filters.</div>`;
      return;
    }

    listContainer.innerHTML = stations.map(st => `
      <div class="station-card" onclick="window.appOpenStation('${st.id}')">
        <div class="station-card-header">
          <div>
            <div class="station-name">${st.name}</div>
            <div class="station-operator">${st.operator} • ${st.city}</div>
          </div>
          <span class="compat-tag ${st.compatibility.isCompatible ? 'yes' : 'no'}">
            ${st.compatibility.isCompatible ? '✓ Compatible' : '✕ Incompatible'}
          </span>
        </div>
        <div style="display: flex; gap: 8px; font-size: 0.8rem; color: var(--text-secondary);">
          <span>⭐ ${st.rating} (${st.reviewCount})</span>
          <span>•</span>
          <span>📍 ${st.distanceKm} km (~${st.etaMins} mins)</span>
          <span>•</span>
          <span style="color: ${st.availablePorts > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; font-weight: 600;">
            ${st.availablePorts}/${st.totalPorts} Open
          </span>
        </div>
        <div class="station-specs-row">
          <span>${st.isBatterySwap ? '🔄 Instant Swapping' : `⚡ ${st.powerKw} kW Max`}</span>
          <span style="font-weight: 600; color: var(--text-primary);">${st.currencySymbol}${st.pricingPerKwh}/kWh</span>
        </div>
      </div>
    `).join('');
  }

  // Filter Chips Listeners
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      renderStationMarkers();
      renderStationsList();
    });
  });

  const searchInput = document.getElementById('stationSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderStationMarkers();
      renderStationsList();
    });
  }

  // Station Detail Modal / Drawer
  function openStationDetailDrawer(station) {
    const modal = document.getElementById('stationDetailModal');
    if (!modal) return;

    const activeVehicle = window.vehicleManager.getActiveVehicle();
    const compat = window.stationsManager.checkCompatibility(station, activeVehicle);

    document.getElementById('modalStationName').textContent = station.name;
    document.getElementById('modalStationAddress').textContent = station.address;
    document.getElementById('modalStationOperator').textContent = `${station.operator} • ${station.operatingHours}`;
    document.getElementById('modalStationPower').textContent = `${station.powerKw} kW (${station.isFastCharger ? 'DC Fast' : 'AC Standard'})`;
    document.getElementById('modalStationPricing').textContent = `${station.currencySymbol}${station.pricingPerKwh} / kWh`;
    document.getElementById('modalStationPorts').textContent = `${station.availablePorts} of ${station.totalPorts} ports currently vacant`;
    
    const compatBox = document.getElementById('modalStationCompatBox');
    if (compatBox) {
      compatBox.className = compat.isCompatible ? 'status-pill success' : 'status-pill danger';
      compatBox.textContent = compat.message;
    }

    // Amenities
    const amenitiesEl = document.getElementById('modalStationAmenities');
    if (amenitiesEl) {
      amenitiesEl.innerHTML = station.amenities.map(a => `<span class="status-pill" style="background: rgba(255,255,255,0.06); color: var(--text-secondary); margin-right: 6px; margin-bottom: 6px;">${a}</span>`).join('');
    }

    // Reviews
    const reviewsEl = document.getElementById('modalStationReviews');
    if (reviewsEl) {
      if (station.reviews && station.reviews.length > 0) {
        reviewsEl.innerHTML = station.reviews.map(r => `
          <div style="border-bottom: 1px solid var(--border-color); padding: 8px 0; font-size: 0.82rem;">
            <div style="display: flex; justify-content: space-between;"><b>${r.user}</b> <span>⭐ ${r.rating}</span></div>
            <div style="color: var(--text-secondary); margin-top: 2px;">${r.comment}</div>
          </div>
        `).join('');
      } else {
        reviewsEl.innerHTML = `<div style="font-size: 0.82rem; color: var(--text-muted);">No reviews yet. Be the first to review!</div>`;
      }
    }

    // Reserve Button Action
    const reserveBtn = document.getElementById('modalReservePortBtn');
    if (reserveBtn) {
      reserveBtn.onclick = () => {
        const res = window.stationsManager.reserveSlot(station.id, activeVehicle ? activeVehicle.id : 'default');
        if (res) {
          alert(`Slot Reserved Successfully!\nReservation ID: ${res.id}\nDuration: 30 minutes guaranteed.`);
          modal.classList.remove('open');
          renderStationsList();
        } else {
          alert("Sorry, all bays are currently occupied at this station.");
        }
      };
    }

    // Charge Here Simulator Action
    const chargeHereBtn = document.getElementById('modalChargeHereBtn');
    if (chargeHereBtn) {
      chargeHereBtn.onclick = () => {
        modal.classList.remove('open');
        switchTab('dashboard');
        window.telemetryDashboard.startChargingSimulation(activeVehicle, station);
      };
    }

    modal.classList.add('open');
  }

  // -------------------------------------------------------------
  // Trip Planner View
  // -------------------------------------------------------------
  function renderTripPlannerView() {
    const presetSelect = document.getElementById('presetRouteSelect');
    if (presetSelect && presetSelect.options.length === 0) {
      presetSelect.innerHTML = window.tripPlanner.getPresetRoutes()
        .map(r => `<option value="${r.id}">${r.name} (${r.distanceKm} km)</option>`)
        .join('');

      presetSelect.addEventListener('change', (e) => {
        const route = window.tripPlanner.getPresetRoutes().find(r => r.id === e.target.value);
        if (route) {
          document.getElementById('routeOriginInput').value = route.origin;
          document.getElementById('routeDestInput').value = route.destination;
          document.getElementById('routeDistanceInput').value = route.distanceKm;
          executeTripPlan(route.id);
        }
      });
    }

    const planBtn = document.getElementById('executePlanBtn');
    if (planBtn) {
      planBtn.onclick = () => executeTripPlan(presetSelect ? presetSelect.value : null);
    }

    // Auto-run default plan
    executeTripPlan(presetSelect ? presetSelect.value : null);
  }

  function executeTripPlan(presetId = null) {
    const activeVehicle = window.vehicleManager.getActiveVehicle();
    const distanceKm = parseFloat(document.getElementById('routeDistanceInput')?.value || 62.5);
    const origin = document.getElementById('routeOriginInput')?.value || "Origin";
    const dest = document.getElementById('routeDestInput')?.value || "Destination";
    const rangeData = window.rangeEngine.calculateRange(activeVehicle);

    const result = window.tripPlanner.planTrip({
      originName: origin,
      destName: dest,
      distanceKm: distanceKm,
      elevationGainMeters: presetId?.includes('nandi') ? 550 : 60,
      presetRouteId: presetId,
      vehicle: activeVehicle,
      rangeCalculation: rangeData
    });

    const outputContainer = document.getElementById('tripPlanResultOutput');
    if (!outputContainer || !result.success) return;

    const plan = result.plan;
    outputContainer.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.15rem; color: var(--text-primary);">${plan.originName} ➔ ${plan.destName}</h3>
            <div style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px;">Total Corridor: <b>${plan.distanceKm} km</b> • Est. Driving: <b>${plan.drivingTimeMinutes} mins</b></div>
          </div>
          <span class="status-pill ${plan.isDirectReachable ? 'success' : 'warning'}" style="font-size: 0.82rem; padding: 6px 12px;">
            ${plan.isDirectReachable ? '✓ Non-Stop Direct Trip' : '⚡ Charging Stop Required'}
          </span>
        </div>

        <div class="grid-3" style="margin-bottom: 20px;">
          <div class="stat-tile">
            <span class="stat-label">Total Energy Needed</span>
            <span class="stat-value">${(plan.totalEnergyNeededWh / 1000).toFixed(2)} kWh</span>
            <span class="stat-sub">${Math.round(plan.totalEnergyNeededWh / plan.distanceKm)} Wh/km avg</span>
          </div>
          <div class="stat-tile">
            <span class="stat-label">Total Journey Time</span>
            <span class="stat-value">${plan.totalTripMinutes} mins</span>
            <span class="stat-sub">Includes charging dwell time</span>
          </div>
          <div class="stat-tile">
            <span class="stat-label">Final Arrival Battery</span>
            <span class="stat-value" style="color: ${plan.finalArrivalSocPercent > 20 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}">${plan.finalArrivalSocPercent}%</span>
            <span class="stat-sub">Safe buffer remaining</span>
          </div>
        </div>

        <div style="font-size: 0.95rem; font-weight: 600; margin-bottom: 12px;">Itinerary & Charging Optimization</div>
        <div class="route-stop-timeline">
          <div class="timeline-node">
            <div class="timeline-icon">A</div>
            <div class="timeline-content">
              <b>${plan.originName}</b>
              <div style="color: var(--text-secondary); font-size: 0.82rem;">Departure with <b>${activeVehicle.currentSocPercent}% SoC</b> (Range: ${plan.currentRangeKm} km)</div>
            </div>
          </div>

          ${plan.stops.map(stop => `
            <div class="timeline-node">
              <div class="timeline-icon" style="background: var(--accent-cyan);">⚡</div>
              <div class="timeline-content" style="background: rgba(6, 182, 212, 0.08); padding: 12px; border-radius: 8px; border: 1px solid rgba(6, 182, 212, 0.3);">
                <div style="display: flex; justify-content: space-between;">
                  <b>Charging Stop: ${stop.stationName}</b>
                  <span style="color: var(--accent-cyan); font-weight: 700;">+${stop.chargeDurationMinutes} mins</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
                  Arrive at: <b>${stop.arrivalSocPercent}% SoC</b> ➔ Charge to: <b>${stop.departureSocPercent}% SoC</b>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                  Charger: ${stop.chargingPowerKw} kW • Est. Cost: ${stop.currency}${stop.estimatedCost} • Amenities: ${stop.amenities.join(', ')}
                </div>
              </div>
            </div>
          `).join('')}

          <div class="timeline-node">
            <div class="timeline-icon" style="background: var(--accent-indigo);">B</div>
            <div class="timeline-content">
              <b>${plan.destName}</b>
              <div style="color: var(--text-secondary); font-size: 0.82rem;">Arrival destination with <b>${plan.finalArrivalSocPercent}% reserve battery</b></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------
  // My Garage View
  // -------------------------------------------------------------
  function renderGarageView() {
    const garageGrid = document.getElementById('garageVehiclesGrid');
    if (!garageGrid) return;

    const vehicles = window.vehicleManager.getAllVehicles();
    const activeVehicle = window.vehicleManager.getActiveVehicle();

    garageGrid.innerHTML = vehicles.map(v => {
      const isActive = activeVehicle && activeVehicle.id === v.id;
      return `
        <div class="card" style="border: ${isActive ? '2px solid var(--accent-emerald)' : '1px solid var(--border-color)'}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span class="status-pill" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); margin-bottom: 6px;">
                ${v.category.replace('_', ' ').toUpperCase()}
              </span>
              <h3 style="font-size: 1.15rem; font-weight: 700;">${v.name}</h3>
              <div style="color: var(--text-muted); font-size: 0.8rem;">Plate: ${v.regNumber} • ${v.year}</div>
            </div>
            ${isActive ? '<span class="status-pill success">Active</span>' : `<button class="btn btn-secondary btn-sm" onclick="window.appSetActiveVehicle('${v.id}')">Make Active</button>`}
          </div>

          <div class="grid-2" style="margin-bottom: 16px; font-size: 0.84rem;">
            <div><span style="color: var(--text-muted);">Battery:</span> <b>${v.batteryCapacityKwh} kWh (${v.batteryType})</b></div>
            <div><span style="color: var(--text-muted);">Current SoC:</span> <b style="color: var(--accent-emerald);">${v.currentSocPercent}%</b></div>
            <div><span style="color: var(--text-muted);">SOH Health:</span> <b>${v.batteryHealthSohPercent}%</b></div>
            <div><span style="color: var(--text-muted);">Odometer:</span> <b>${v.odometerKm.toLocaleString()} km</b></div>
            <div><span style="color: var(--text-muted);">Tyre PSI:</span> <b>F:${v.tyreFrontPsi} / R:${v.tyreRearPsi}</b></div>
            <div><span style="color: var(--text-muted);">Riding Mode:</span> <b>${v.currentRidingMode}</b></div>
          </div>

          <div style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 14px;">
            Connectors: <b>${v.supportedConnectors.join(', ')}</b>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm btn-full" onclick="window.appEditVehicle('${v.id}')">Edit Specs</button>
            ${vehicles.length > 1 ? `<button class="btn btn-danger btn-sm" onclick="window.appDeleteVehicle('${v.id}')">Delete</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  window.appSetActiveVehicle = (id) => {
    window.vehicleManager.setActiveVehicle(id);
    renderAllViews();
  };

  window.appDeleteVehicle = (id) => {
    if (confirm("Are you sure you want to remove this vehicle from your garage?")) {
      window.vehicleManager.deleteVehicle(id);
      renderAllViews();
    }
  };

  window.appEditVehicle = (id) => {
    const v = window.vehicleManager.getVehicleById(id);
    if (!v) return;

    const newFrontPsi = prompt("Enter Front Tyre PSI:", v.tyreFrontPsi);
    const newRearPsi = prompt("Enter Rear Tyre PSI:", v.tyreRearPsi);
    const newSoc = prompt("Enter Current Battery SoC (%):", v.currentSocPercent);
    const newPayload = prompt("Enter Rider + Cargo Payload (kg):", v.riderPayloadKg || 75);

    if (newFrontPsi && newRearPsi && newSoc) {
      window.vehicleManager.updateVehicle(id, {
        tyreFrontPsi: parseFloat(newFrontPsi),
        tyreRearPsi: parseFloat(newRearPsi),
        currentSocPercent: Math.min(100, Math.max(0, parseInt(newSoc, 10))),
        riderPayloadKg: parseFloat(newPayload || 75)
      });
      renderAllViews();
    }
  };

  // Add Vehicle Modal Logic
  const addVehicleBtn = document.getElementById('addVehicleBtn');
  const addVehicleModal = document.getElementById('addVehicleModal');
  const templateSelect = document.getElementById('vehicleTemplateSelect');

  if (templateSelect) {
    templateSelect.innerHTML = window.vehicleManager.getTemplates()
      .map(t => `<option value="${t.id}">${t.make} ${t.model} (${t.batteryCapacityKwh} kWh • ${t.category})</option>`)
      .join('');
  }

  if (addVehicleBtn && addVehicleModal) {
    addVehicleBtn.onclick = () => addVehicleModal.classList.add('open');
  }

  const saveNewVehicleBtn = document.getElementById('saveNewVehicleBtn');
  if (saveNewVehicleBtn) {
    saveNewVehicleBtn.onclick = () => {
      const tplId = templateSelect ? templateSelect.value : 'tpl_ather_450x';
      const customName = document.getElementById('newVehicleNickname')?.value;
      const reg = document.getElementById('newVehicleReg')?.value;
      const odo = parseFloat(document.getElementById('newVehicleOdo')?.value || 100);

      window.vehicleManager.addVehicleFromTemplate(tplId, {
        nickname: customName,
        regNumber: reg,
        odometerKm: odo
      });

      addVehicleModal.classList.remove('open');
      renderAllViews();
    };
  }

  // -------------------------------------------------------------
  // Analytics & Health View
  // -------------------------------------------------------------
  function renderAnalyticsView() {
    const v = window.vehicleManager.getActiveVehicle();
    if (!v) return;

    const finEco = window.telemetryDashboard.calculateFinancialAndEcoSavings(v);
    const degData = window.telemetryDashboard.getBatteryDegradationCurve(v);

    document.getElementById('analyticsTotalSavings').textContent = `₹${finEco.netSavingsCurrency.toLocaleString()}`;
    document.getElementById('analyticsPetrolCost').textContent = `₹${finEco.petrolCostPerKm}/km`;
    document.getElementById('analyticsEvCost').textContent = `₹${finEco.evCostPerKm}/km`;
    document.getElementById('analyticsCo2Saved').textContent = `${finEco.co2SavedKg} kg`;
    document.getElementById('analyticsTreesEquiv').textContent = `${finEco.treesEquivalent} trees`;
    document.getElementById('analyticsSohGrade').textContent = degData.healthGrade;

    // Render SOH Degradation Curve Points in SVG
    const svgDeg = document.getElementById('batteryDegradationSvg');
    if (svgDeg) {
      const points = degData.points;
      const w = 500, h = 180;
      // map cycles 0-1500 to x: 40-480, SOH 75-100 to y: 160-20
      const polyPoints = points.map(p => {
        const x = 40 + (p.cycles / 1500) * 440;
        const y = 160 - ((p.soh - 75) / 25) * 140;
        return `${x},${y}`;
      }).join(' ');

      svgDeg.innerHTML = `
        <defs>
          <linearGradient id="degGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <!-- Axes -->
        <line x1="40" y1="20" x2="40" y2="160" stroke="#334155" stroke-width="1"/>
        <line x1="40" y1="160" x2="480" y2="160" stroke="#334155" stroke-width="1"/>
        <!-- Grid lines & labels -->
        <text x="35" y="25" fill="#94a3b8" font-size="10" text-anchor="end">100%</text>
        <text x="35" y="95" fill="#94a3b8" font-size="10" text-anchor="end">88%</text>
        <text x="35" y="160" fill="#94a3b8" font-size="10" text-anchor="end">75%</text>
        
        <text x="40" y="175" fill="#94a3b8" font-size="10" text-anchor="middle">0 cyc</text>
        <text x="260" y="175" fill="#94a3b8" font-size="10" text-anchor="middle">750 cyc</text>
        <text x="480" y="175" fill="#94a3b8" font-size="10" text-anchor="middle">1500 cyc</text>

        <!-- Curve -->
        <polyline fill="none" stroke="#10b981" stroke-width="3" points="${polyPoints}"/>
        ${points.map(p => {
          const x = 40 + (p.cycles / 1500) * 440;
          const y = 160 - ((p.soh - 75) / 25) * 140;
          return `<circle cx="${x}" cy="${y}" r="4" fill="#10b981" stroke="#fff" stroke-width="1"/>`;
        }).join('')}
      `;
    }

    // Charging History Table
    const chgHistoryEl = document.getElementById('chargingHistoryTableBody');
    if (chgHistoryEl) {
      const history = window.telemetryDashboard.getChargingHistory();
      chgHistoryEl.innerHTML = history.map(h => `
        <tr>
          <td>${h.date}</td>
          <td><b>${h.stationName}</b></td>
          <td>${h.chargerType}</td>
          <td>${h.energyKwh} kWh</td>
          <td>${h.startSoc}% ➔ ${h.endSoc}%</td>
          <td><b>${h.currency}${h.cost}</b></td>
        </tr>
      `).join('');
    }
  }

  // -------------------------------------------------------------
  // Fleet Portal View
  // -------------------------------------------------------------
  function renderFleetPortal() {
    const metrics = window.fleetManager.getFleetMetrics();
    const vehicles = window.fleetManager.getFleetVehicles();

    document.getElementById('fleetKpiTotal').textContent = metrics.totalVehicles;
    document.getElementById('fleetKpiOnRoute').textContent = metrics.onRouteCount;
    document.getElementById('fleetKpiCharging').textContent = metrics.chargingCount;
    document.getElementById('fleetKpiMaintenance').textContent = metrics.maintenanceCount;
    document.getElementById('fleetKpiEfficiency').textContent = `${metrics.avgWhPerKm} Wh/km`;
    document.getElementById('fleetKpiSavings').textContent = metrics.totalSavingsCurrency;

    const tbody = document.getElementById('fleetTableBody');
    if (tbody) {
      tbody.innerHTML = vehicles.map(v => `
        <tr>
          <td><b>${v.regNumber}</b><br><span style="font-size: 0.76rem; color: var(--text-muted);">${v.model}</span></td>
          <td>${v.driverName}<br><span style="font-size: 0.76rem; color: var(--text-muted);">${v.driverPhone}</span></td>
          <td>
            <span class="status-pill ${v.status === 'En Route' ? 'success' : (v.status === 'Charging' ? 'warning' : (v.status === 'Maintenance' ? 'danger' : 'info'))}">
              ${v.status}
            </span>
          </td>
          <td><b>${v.currentSocPercent}%</b> (SOH: ${v.sohPercent}%)</td>
          <td>
            <span style="color: ${v.isEfficient ? 'var(--accent-emerald)' : 'var(--accent-rose)'}; font-weight: 600;">
              ${v.whPerKm} Wh/km
            </span>
            ${!v.isEfficient ? '<br><span style="font-size: 0.7rem; color: var(--accent-rose);">⚠️ Inefficient</span>' : ''}
          </td>
          <td style="font-size: 0.8rem;">${v.lastKnownLocation}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.appAssignDriver('${v.id}')">Reassign</button>
          </td>
        </tr>
      `).join('');
    }

    const exportBtn = document.getElementById('exportFleetCsvBtn');
    if (exportBtn) {
      exportBtn.onclick = () => window.fleetManager.exportCsvReport();
    }
  }

  window.appAssignDriver = (vehicleId) => {
    const newDriver = prompt("Enter Driver Full Name:");
    const newPhone = prompt("Enter Driver Contact Number:");
    if (newDriver && newPhone) {
      window.fleetManager.assignDriver(vehicleId, newDriver, newPhone);
      renderFleetPortal();
    }
  };

  // -------------------------------------------------------------
  // Ecosystem, AI Coach, Swapping & SOS View
  // -------------------------------------------------------------
  function renderEcosystemView() {
    const v = window.vehicleManager.getActiveVehicle();
    const rangeData = window.rangeEngine.calculateRange(v);

    // AI Coaching Tips
    const coachingContainer = document.getElementById('aiCoachingContainer');
    if (coachingContainer) {
      const tips = window.ecosystemManager.getAiCoachingInsights(v, rangeData);
      coachingContainer.innerHTML = tips.map(t => `
        <div class="card" style="margin-bottom: 14px; border-left: 4px solid var(--accent-cyan);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="status-pill" style="background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan);">${t.category}</span>
            <span style="font-weight: 700; color: var(--accent-emerald); font-size: 0.84rem;">${t.impact}</span>
          </div>
          <h4 style="font-size: 1rem; margin-bottom: 4px;">${t.title}</h4>
          <p style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.5;">${t.desc}</p>
        </div>
      `).join('');
    }

    // Loyalty Points Display
    document.getElementById('ecoLoyaltyPoints').textContent = window.ecosystemManager.getLoyaltyPoints();

    // Document Locker
    const docsContainer = document.getElementById('documentsLockerContainer');
    if (docsContainer) {
      const docs = window.ecosystemManager.getDocuments();
      docsContainer.innerHTML = docs.map(d => `
        <div class="card" style="padding: 14px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <b>${d.title}</b>
            <div style="font-size: 0.78rem; color: var(--text-secondary);">Policy: ${d.policyNumber} • Expires: ${d.expiryDate}</div>
          </div>
          <span class="status-pill success">${d.status}</span>
        </div>
      `).join('');
    }

    // Service Centers
    const serviceList = document.getElementById('serviceCentersList');
    if (serviceList) {
      const centers = window.ecosystemManager.getServiceCenters();
      serviceList.innerHTML = centers.map(c => `
        <div class="card" style="padding: 14px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <b>${c.name}</b>
            <span>⭐ ${c.rating} (${c.distanceKm} km)</span>
          </div>
          <div style="color: var(--text-secondary); font-size: 0.8rem; margin: 4px 0;">${c.address} • 📞 ${c.phone}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${c.services.join(' • ')}</div>
        </div>
      `).join('');
    }
  }

  // Battery Swap Reservation Button
  const reserveSwapBtn = document.getElementById('reserveBatterySwapBtn');
  if (reserveSwapBtn) {
    reserveSwapBtn.onclick = () => {
      const swap = window.ecosystemManager.reserveBatterySwap();
      alert(`Battery Swap Reserved Successfully!\nStation: ${swap.stationName}\nReserved Packs: 2 Fresh Packs\nSwap OTP: ${swap.otpCode}\nValid until: ${swap.expiryTimestamp}`);
      renderEcosystemView();
    };
  }

  // Roadside Emergency SOS Button
  const triggerSosBtn = document.getElementById('triggerSosBtn');
  if (triggerSosBtn) {
    triggerSosBtn.onclick = () => {
      const v = window.vehicleManager.getActiveVehicle();
      const coords = window.stationsManager.getUserCoordinates();
      const ticket = window.ecosystemManager.dispatchEmergencySos(v, coords);
      alert(`🚨 EMERGENCY SOS DISPATCHED!\nTicket: ${ticket.ticketId}\nUnit: ${ticket.serviceDispatched}\nDriver: ${ticket.driverName}\nETA: ${ticket.etaMinutes} mins to your location\nAssistance Hotline: ${ticket.driverContact}`);
    };
  }

  // QR Charger Checkout Button
  const qrCheckoutBtn = document.getElementById('qrCheckoutBtn');
  if (qrCheckoutBtn) {
    qrCheckoutBtn.onclick = () => {
      const receipt = window.ecosystemManager.processQrPayment({
        stationName: "AeroVolt High-Speed Charging Hub Indiranagar",
        portNumber: "Bay #02 (6 kW Fast)",
        kwh: 3.2,
        amount: 40.0,
        currency: "₹"
      });
      alert(`Payment Successful!\nTxn: ${receipt.transactionId}\nStation: ${receipt.stationName}\nAmount Paid: ${receipt.currency}${receipt.totalPaid} (Incl. GST: ${receipt.currency}${receipt.taxGst})\nGreen Loyalty Points Earned: +${receipt.greenPointsEarned}`);
      renderEcosystemView();
    };
  }

  // Close modals on click backdrop or close button
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('close-btn')) {
        modal.classList.remove('open');
      }
    });
  });

  // Global Refresh Routine
  function renderAllViews() {
    updateHeaderVehicleDisplay();
    renderDashboard();
    renderStationsList();
    renderStationMarkers();
    renderTripPlannerView();
    renderGarageView();
    renderAnalyticsView();
    renderFleetPortal();
    renderEcosystemView();
  }

  // Initial Boot
  renderAllViews();
});
