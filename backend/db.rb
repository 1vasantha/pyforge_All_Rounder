# frozen_string_literal: true

require 'sqlite3'
require 'json'
require 'securerandom'
require 'digest'
require 'time'

module AeroVolt
  class DB
    DB_FILE = File.expand_path('../../aerovolt.db', __FILE__)

    def self.connection
      @connection ||= begin
        db = SQLite3::Database.new(DB_FILE)
        db.results_as_hash = true
        db.execute('PRAGMA foreign_keys = ON;')
        init_schema(db)
        seed_data(db)
        db
      end
    end

    def self.init_schema(db)
      db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'rider',
          phone TEXT,
          auth_token TEXT,
          created_at TEXT NOT NULL
        );
      SQL

      db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS vehicles (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          category TEXT NOT NULL,
          make TEXT NOT NULL,
          model TEXT NOT NULL,
          nickname TEXT,
          year INTEGER NOT NULL,
          reg_number TEXT NOT NULL,
          battery_capacity_kwh REAL NOT NULL,
          usable_capacity_kwh REAL NOT NULL,
          battery_type TEXT NOT NULL,
          nominal_voltage REAL NOT NULL,
          rated_range_km REAL NOT NULL,
          base_efficiency_wh_km REAL NOT NULL,
          current_soc_percent REAL NOT NULL,
          battery_health_soh_percent REAL NOT NULL,
          battery_cycles INTEGER NOT NULL DEFAULT 0,
          odometer_km REAL NOT NULL,
          current_riding_mode TEXT NOT NULL,
          rider_payload_kg REAL NOT NULL DEFAULT 75,
          tyre_front_psi REAL NOT NULL,
          tyre_rear_psi REAL NOT NULL,
          tyre_front_nominal_psi REAL NOT NULL,
          tyre_rear_nominal_psi REAL NOT NULL,
          supported_connectors TEXT NOT NULL,
          max_charging_power_kw REAL NOT NULL,
          max_dc_fast_power_kw REAL NOT NULL,
          is_fleet INTEGER NOT NULL DEFAULT 0,
          assigned_driver TEXT,
          is_favorite INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      SQL

      db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS stations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          operator TEXT NOT NULL,
          brand_color TEXT NOT NULL,
          lat REAL NOT NULL,
          lng REAL NOT NULL,
          address TEXT NOT NULL,
          city TEXT NOT NULL,
          supported_connectors TEXT NOT NULL,
          power_kw REAL NOT NULL,
          is_fast_charger INTEGER NOT NULL DEFAULT 0,
          is_battery_swap INTEGER NOT NULL DEFAULT 0,
          total_ports INTEGER NOT NULL,
          available_ports INTEGER NOT NULL,
          pricing_per_kwh REAL NOT NULL,
          currency_symbol TEXT NOT NULL DEFAULT '₹',
          operating_hours TEXT NOT NULL,
          amenities TEXT NOT NULL,
          rating REAL NOT NULL DEFAULT 5.0,
          review_count INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'Available'
        );
      SQL

      db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS charging_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          vehicle_id TEXT,
          station_id TEXT,
          station_name TEXT,
          charger_type TEXT,
          start_soc REAL NOT NULL,
          end_soc REAL NOT NULL,
          energy_kwh REAL NOT NULL,
          duration_minutes INTEGER NOT NULL,
          cost REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT '₹',
          status TEXT NOT NULL DEFAULT 'Completed',
          started_at TEXT NOT NULL,
          ended_at TEXT
        );
      SQL

      db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS reviews (
          id TEXT PRIMARY KEY,
          station_id TEXT NOT NULL,
          user_name TEXT NOT NULL,
          rating INTEGER NOT NULL,
          comment TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (station_id) REFERENCES stations(id)
        );
      SQL

      db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS reservations (
          id TEXT PRIMARY KEY,
          station_id TEXT NOT NULL,
          vehicle_id TEXT,
          user_id TEXT,
          type TEXT NOT NULL DEFAULT 'port',
          otp_code TEXT,
          reserved_at TEXT NOT NULL,
          duration_minutes INTEGER NOT NULL DEFAULT 30,
          status TEXT NOT NULL DEFAULT 'Confirmed',
          FOREIGN KEY (station_id) REFERENCES stations(id)
        );
      SQL

      db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS fleet_vehicles (
          id TEXT PRIMARY KEY,
          reg_number TEXT NOT NULL,
          model TEXT NOT NULL,
          category TEXT NOT NULL,
          driver_name TEXT NOT NULL,
          driver_phone TEXT NOT NULL,
          driver_rating REAL NOT NULL DEFAULT 4.8,
          status TEXT NOT NULL DEFAULT 'En Route',
          current_soc_percent REAL NOT NULL,
          soh_percent REAL NOT NULL,
          odometer_km REAL NOT NULL,
          wh_per_km REAL NOT NULL,
          target_wh_per_km REAL NOT NULL,
          is_efficient INTEGER NOT NULL DEFAULT 1,
          inefficiency_reason TEXT,
          last_known_location TEXT NOT NULL,
          battery_capacity_kwh REAL NOT NULL,
          connector TEXT NOT NULL,
          next_maintenance_km REAL NOT NULL,
          alert_count INTEGER NOT NULL DEFAULT 0
        );
      SQL

      db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          title TEXT NOT NULL,
          issuer TEXT NOT NULL,
          policy_number TEXT NOT NULL,
          expiry_date TEXT NOT NULL,
          vehicle_reg TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Active',
          type TEXT NOT NULL
        );
      SQL

      db.execute <<-SQL
        CREATE TABLE IF NOT EXISTS alerts (
          id TEXT PRIMARY KEY,
          vehicle_id TEXT NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          severity TEXT NOT NULL DEFAULT 'info',
          action_label TEXT,
          action_tab TEXT,
          is_read INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
      SQL
    end

    def self.seed_data(db)
      count = db.get_first_value('SELECT COUNT(*) FROM users;')
      return if count.to_i > 0

      now = Time.now.utc.iso8601

      # 1. Seed Users
      pw_hash = Digest::SHA256.hexdigest('aerovolt123')
      token_rider = 'tok_demo_rider_' + SecureRandom.hex(8)
      token_fleet = 'tok_demo_fleet_' + SecureRandom.hex(8)

      user_sql = 'INSERT INTO users (id, name, email, password_hash, role, phone, auth_token, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);'
      db.execute(user_sql, ['usr_rider_1', 'Surya Rider', 'surya@aerovolt.com', pw_hash, 'rider', '+91 98860 11223', token_rider, now])
      db.execute(user_sql, ['usr_fleet_admin', 'Enterprise Logistics Manager', 'fleet@aerovolt.com', pw_hash, 'fleet_manager', '+91 98860 99887', token_fleet, now])

      # 2. Seed User Vehicles
      veh_sql = <<-SQL
        INSERT INTO vehicles (
          id, user_id, category, make, model, nickname, year, reg_number,
          battery_capacity_kwh, usable_capacity_kwh, battery_type, nominal_voltage,
          rated_range_km, base_efficiency_wh_km, current_soc_percent, battery_health_soh_percent,
          battery_cycles, odometer_km, current_riding_mode, rider_payload_kg,
          tyre_front_psi, tyre_rear_psi, tyre_front_nominal_psi, tyre_rear_nominal_psi,
          supported_connectors, max_charging_power_kw, max_dc_fast_power_kw, is_fleet, assigned_driver, is_favorite, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      SQL

      db.execute(veh_sql, [
        'veh_ather_450x', 'usr_rider_1', '2w_scooter', 'Ather Energy', '450X Gen 3', 'Daily Stealth',
        2024, 'KA-01-EV-4509', 3.7, 3.24, 'NMC', 51.1, 150.0, 34.0, 78.0, 96.5, 142, 4890.0,
        'Ride', 78.0, 29.5, 31.8, 30.0, 32.0,
        JSON.generate(["Ather Grid Fast", "15A 3-Pin AC (Ather Dot)"]),
        3.3, 6.0, 0, nil, 1, now
      ])

      db.execute(veh_sql, [
        'veh_uv_f77', 'usr_rider_1', '2w_bike', 'Ultraviolette Automotive', 'F77 Mach 2 Recon', 'Thunder Wing',
        2024, 'KA-04-EV-7700', 10.3, 9.8, 'NMC Liquid Cooled', 108.0, 323.0, 42.0, 62.0, 99.1, 48, 1840.0,
        'Combat', 85.0, 32.0, 36.0, 32.0, 36.0,
        JSON.generate(["Type 2 AC", "CCS2 DC", "UV Boost Charger"]),
        6.6, 12.0, 0, nil, 0, now
      ])

      # 3. Seed Stations
      st_sql = <<-SQL
        INSERT INTO stations (
          id, name, operator, brand_color, lat, lng, address, city, supported_connectors,
          power_kw, is_fast_charger, is_battery_swap, total_ports, available_ports,
          pricing_per_kwh, currency_symbol, operating_hours, amenities, rating, review_count, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      SQL

      stations_seed = [
        ['st_ather_indiranagar', 'Ather Grid - 100ft Road Indiranagar', 'Ather Energy', '#10b981', 12.9716, 77.6412, '100 Feet Rd, Indiranagar, Bengaluru', 'Bengaluru', JSON.generate(["Ather Grid Fast", "15A 3-Pin AC (Ather Dot)"]), 6.0, 1, 0, 4, 3, 12.5, '₹', '24/7 (Open All Days)', JSON.generate(["Cafe Coffee Day", "Restroom", "Free Wi-Fi", "Tyre Air Pump"]), 4.8, 184, 'Available'],
        ['st_ola_koramangala', 'Ola Hypercharger - 5th Block Koramangala', 'Ola Electric', '#06b6d4', 12.9352, 77.6245, '80 Feet Rd, 5th Block, Koramangala, Bengaluru', 'Bengaluru', JSON.generate(["Ola Hypercharger"]), 8.0, 1, 0, 6, 4, 11.0, '₹', '24/7 (Open All Days)', JSON.generate(["Convenience Store", "Covered Canopy", "Restroom"]), 4.6, 220, 'Available'],
        ['st_tata_ez_whitefield', 'Tata Power EZ Charge - ITPL Main Road', 'Tata Power', '#3b82f6', 12.9863, 77.7298, 'ITPL Main Rd, Whitefield, Bengaluru', 'Bengaluru', JSON.generate(["CCS2 DC", "Type 2 AC", "Bharat AC001", "15A 3-Pin AC"]), 60.0, 1, 0, 8, 5, 18.0, '₹', '24/7 (Open All Days)', JSON.generate(["Starbucks Cafe", "Food Court", "Valet Parking", "Restroom"]), 4.7, 312, 'Available'],
        ['st_gogoro_swap_hsr', 'Gogoro GoStation - HSR Sector 3', 'Gogoro', '#10b981', 12.9116, 77.6473, '27th Main Rd, Sector 3, HSR Layout, Bengaluru', 'Bengaluru', JSON.generate(["Gogoro GoStation Swappable"]), 15.0, 1, 1, 12, 10, 35.0, '₹', '24/7 (Open All Days)', JSON.generate(["Quick Swap (<60s)", "Self-Service", "Shelter Canopy"]), 4.9, 94, 'Available'],
        ['st_zeon_electronic_city', 'Zeon Charging Hub - Electronic City Phase 1', 'Zeon Charging', '#8b5cf6', 12.8452, 77.6602, 'Hosur Rd, Electronic City, Bengaluru', 'Bengaluru', JSON.generate(["CCS2 DC", "Type 2 AC", "Bharat AC001", "UV Boost Charger"]), 50.0, 1, 0, 6, 2, 17.5, '₹', '24/7 (Open All Days)', JSON.generate(["Diner", "Restrooms", "Fast Wi-Fi"]), 4.7, 145, 'Available'],
        ['st_jio_bp_hebbal', 'Jio-bp pulse - Bellary Road Hebbal', 'Jio-bp pulse', '#059669', 13.0358, 77.5970, 'Airport Exit Road, Hebbal Flyover, Bengaluru', 'Bengaluru', JSON.generate(["CCS2 DC", "Type 2 AC", "Bharat DC001", "15A 3-Pin AC"]), 60.0, 1, 0, 6, 1, 16.0, '₹', '24/7 (Open All Days)', JSON.generate(["Wild Bean Cafe", "Restroom", "ATM"]), 4.4, 198, 'Busy']
      ]

      stations_seed.each { |st| db.execute(st_sql, st) }

      # 4. Seed Fleet Vehicles
      flt_sql = <<-SQL
        INSERT INTO fleet_vehicles (
          id, reg_number, model, category, driver_name, driver_phone, driver_rating, status,
          current_soc_percent, soh_percent, odometer_km, wh_per_km, target_wh_per_km, is_efficient,
          inefficiency_reason, last_known_location, battery_capacity_kwh, connector, next_maintenance_km, alert_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      SQL

      fleet_seed = [
        ['flt_01', 'KA-01-FL-1001', 'Ather 450X Gen 3 Cargo', '2w_scooter', 'Rajesh Kumar', '+91 98860 12345', 4.9, 'En Route', 74.0, 97.2, 12450.0, 34.2, 35.0, 1, nil, 'Indiranagar Hub, Sector 2', 3.7, 'Ather Grid Fast', 15000.0, 0],
        ['flt_02', 'KA-01-FL-1002', 'Bounce Infinity E1+ Swap', '2w_scooter', 'Mohammed Farhan', '+91 98860 23456', 4.7, 'Charging', 32.0, 95.8, 18900.0, 31.8, 32.0, 1, nil, 'HSR Layout Gogoro Station', 2.0, 'Swappable Dual Pack', 20000.0, 0],
        ['flt_03', 'KA-01-FL-1003', 'Ola S1 Pro Gen 2', '2w_scooter', 'Sunil Verma', '+91 98860 34567', 4.2, 'En Route', 41.0, 94.1, 24100.0, 42.5, 33.0, 0, 'Excessive aggressive throttle & tyre pressure low', 'Outer Ring Road, Bellandur', 4.0, 'Ola Hypercharger', 25000.0, 1],
        ['flt_04', 'KA-01-FL-1004', 'Hero Vida V1 Pro', '2w_scooter', 'Ananya Gowda', '+91 98860 45678', 4.95, 'Idle', 88.0, 98.4, 8900.0, 32.1, 33.5, 1, nil, 'Koramangala Depot', 3.94, 'Bharat AC001', 10000.0, 0],
        ['flt_05', 'KA-01-FL-1005', 'Revolt RV400 Commuter', '2w_bike', 'Kishore Rao', '+91 98860 56789', 4.5, 'Maintenance', 18.0, 91.0, 31200.0, 36.4, 32.0, 0, 'Brake pad dragging & scheduled hub service overdue', 'Central Service Center, Peenya', 3.24, '15A 3-Pin AC', 30000.0, 2],
        ['flt_06', 'KA-01-FL-1006', 'Ultraviolette F77 Recon', '2w_bike', 'Arjun Reddy', '+91 98860 67890', 4.85, 'En Route', 68.0, 99.0, 14200.0, 43.8, 44.0, 1, nil, 'Airport Highway Express', 10.3, 'Type 2 AC / CCS2', 20000.0, 0]
      ]

      fleet_seed.each { |flt| db.execute(flt_sql, flt) }

      # 5. Seed Documents
      doc_sql = 'INSERT INTO documents (id, user_id, title, issuer, policy_number, expiry_date, vehicle_reg, status, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);'
      db.execute(doc_sql, ['doc_01', 'usr_rider_1', 'Comprehensive EV Motor Insurance', 'Acko General Insurance', 'POL-EV-2024-998812', '2025-11-20', 'KA-01-EV-4509', 'Active', 'Insurance'])
      db.execute(doc_sql, ['doc_02', 'usr_rider_1', 'Vehicle Registration Certificate (RC)', 'Transport Dept, Karnataka', 'RC-KA01-2024-4509', '2039-01-15', 'KA-01-EV-4509', 'Active', 'RC Book'])

      # 6. Seed Charging Sessions
      chg_sql = 'INSERT INTO charging_sessions (id, user_id, vehicle_id, station_id, station_name, charger_type, start_soc, end_soc, energy_kwh, duration_minutes, cost, currency, status, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
      db.execute(chg_sql, ['chg_01', 'usr_rider_1', 'veh_ather_450x', 'st_ather_indiranagar', 'Ather Grid Indiranagar', 'DC Fast 6kW', 22.0, 80.0, 2.15, 28, 26.8, '₹', 'Completed', '2024-10-07 18:30:00', '2024-10-07 18:58:00'])
    end
  end
end
