/**
 * Enterprise EV Platform - Backend REST API Client
 * Provides automatic synchronization between frontend and SQLite backend,
 * with seamless offline fallback.
 */

const API_BASE = window.location.origin.startsWith('http') ? `${window.location.origin}/api` : 'http://localhost:8080/api';

class ApiClient {
  constructor() {
    this.isOnline = false;
    this.token = localStorage.getItem('aerovolt_token') || 'tok_demo_rider';
    this.checkHealth();
  }

  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        this.isOnline = (data.status === 'online');
        this.updateConnectionBadge(true);
        return true;
      }
    } catch (e) {
      this.isOnline = false;
      this.updateConnectionBadge(false);
      return false;
    }
    this.isOnline = false;
    this.updateConnectionBadge(false);
    return false;
  }

  updateConnectionBadge(connected) {
    let badge = document.getElementById('backendStatusBadge');
    if (!badge) {
      const headerRight = document.querySelector('.header-right');
      if (headerRight) {
        badge = document.createElement('div');
        badge.id = 'backendStatusBadge';
        badge.className = 'status-pill';
        badge.style.fontSize = '0.75rem';
        badge.style.cursor = 'pointer';
        badge.title = 'Click to re-check backend connection';
        badge.onclick = () => this.checkHealth();
        headerRight.insertBefore(badge, headerRight.firstChild);
      }
    }
    if (badge) {
      if (connected) {
        badge.className = 'status-pill success';
        badge.innerHTML = '🟢 API Live (SQLite)';
      } else {
        badge.className = 'status-pill info';
        badge.innerHTML = '🟡 Offline Cache Active';
      }
    }
  }

  async getVehicles() {
    try {
      const res = await fetch(`${API_BASE}/vehicles`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.vehicles;
      }
    } catch (e) {}
    return null;
  }

  async calculateRange(vehicleId, environmentalParams = {}) {
    try {
      const res = await fetch(`${API_BASE}/range/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({ vehicle_id: vehicleId, ...environmentalParams })
      });
      if (res.ok) {
        const data = await res.json();
        return data.range_data;
      }
    } catch (e) {}
    return null;
  }

  async planRoute(vehicleId, origin, dest, distanceKm, elevationMeters) {
    try {
      const res = await fetch(`${API_BASE}/routes/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          origin: origin,
          destination: dest,
          distance_km: distanceKm,
          elevation_gain_m: elevationMeters
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.plan;
      }
    } catch (e) {}
    return null;
  }

  async getFleetSummary() {
    try {
      const res = await fetch(`${API_BASE}/fleet/summary`);
      if (res.ok) {
        const data = await res.json();
        return data.metrics;
      }
    } catch (e) {}
    return null;
  }

  async getFleetVehicles() {
    try {
      const res = await fetch(`${API_BASE}/fleet/vehicles`);
      if (res.ok) {
        const data = await res.json();
        return data.fleet_vehicles;
      }
    } catch (e) {}
    return null;
  }

  async reserveSwap() {
    try {
      const res = await fetch(`${API_BASE}/ecosystem/swap/reserve`, { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return null;
  }

  async checkoutQr(amount, kwh) {
    try {
      const res = await fetch(`${API_BASE}/ecosystem/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, kwh })
      });
      if (res.ok) {
        const data = await res.json();
        return data.receipt;
      }
    } catch (e) {}
    return null;
  }

  async dispatchSos() {
    try {
      const res = await fetch(`${API_BASE}/ecosystem/sos/dispatch`, { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return null;
  }
}

window.apiClient = new ApiClient();
