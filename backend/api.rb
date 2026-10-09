# frozen_string_literal: true

require 'webrick'
require 'json'
require 'securerandom'
require 'time'
require_relative 'db'
require_relative 'physics_engine'

module AeroVolt
  class ApiServlet < WEBrick::HTTPServlet::AbstractServlet
    def do_OPTIONS(req, res)
      set_cors_headers(res)
      res.status = 204
    end

    def do_GET(req, res)
      set_cors_headers(res)
      route(req, res, :get)
    end

    def do_POST(req, res)
      set_cors_headers(res)
      route(req, res, :post)
    end

    def do_PUT(req, res)
      set_cors_headers(res)
      route(req, res, :put)
    end

    def do_DELETE(req, res)
      set_cors_headers(res)
      route(req, res, :delete)
    end

    private

    def db
      DB.connection
    end

    def set_cors_headers(res)
      res['Access-Control-Allow-Origin'] = '*'
      res['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
      res['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
      res['Content-Type'] = 'application/json'
    end

    def parse_body(req)
      return {} if req.body.nil? || req.body.strip.empty?
      JSON.parse(req.body)
    rescue JSON::ParserError
      {}
    end

    def json_response(res, status, payload)
      res.status = status
      res.body = JSON.generate(payload)
    end

    def authenticate_user(req)
      auth_header = req['Authorization'] || ''
      token = auth_header.sub(/^Bearer\s+/, '').strip
      if token.empty?
        return db.get_first_row('SELECT * FROM users WHERE email = "surya@aerovolt.com";')
      end
      user = db.get_first_row('SELECT * FROM users WHERE auth_token = ?;', [token])
      user || db.get_first_row('SELECT * FROM users WHERE email = "surya@aerovolt.com";')
    end

    def route(req, res, method)
      path = req.path.chomp('/')

      case [method, path]
      # --- HEALTH & DIAGNOSTICS ---
      when [:get, '/api/health']
        json_response(res, 200, {
          status: 'online',
          version: '2.4.0-enterprise',
          timestamp: Time.now.utc.iso8601,
          database: 'SQLite3 connected',
          ecosystem: 'AeroVolt Enterprise EV Platform'
        })

      # --- AUTH ---
      when [:post, '/api/auth/login']
        body = parse_body(req)
        email = body['email'] || 'surya@aerovolt.com'
        user = db.get_first_row('SELECT * FROM users WHERE email = ?;', [email])
        if user
          json_response(res, 200, {
            success: true,
            user: { id: user['id'], name: user['name'], email: user['email'], role: user['role'], phone: user['phone'] },
            token: user['auth_token']
          })
        else
          json_response(res, 401, { success: false, error: 'Invalid credentials' })
        end

      when [:get, '/api/auth/me']
        user = authenticate_user(req)
        json_response(res, 200, {
          success: true,
          user: { id: user['id'], name: user['name'], email: user['email'], role: user['role'], phone: user['phone'] }
        })

      # --- VEHICLES CRUD ---
      when [:get, '/api/vehicles']
        user = authenticate_user(req)
        vehicles = db.execute('SELECT * FROM vehicles WHERE user_id = ? ORDER BY is_favorite DESC, updated_at DESC;', [user['id']])
        vehicles.each { |v| v['supported_connectors'] = JSON.parse(v['supported_connectors']) rescue [] }
        json_response(res, 200, { success: true, count: vehicles.size, vehicles: vehicles })

      when [:post, '/api/vehicles']
        user = authenticate_user(req)
        body = parse_body(req)
        id = 'veh_' + SecureRandom.hex(6)
        now = Time.now.utc.iso8601

        ins_sql = 'INSERT INTO vehicles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
        db.execute(ins_sql, [
          id, user['id'], body['category'] || '2w_scooter', body['make'] || 'EV', body['model'] || 'Custom EV',
          body['nickname'] || body['model'], (body['year'] || 2024).to_i, body['reg_number'] || 'EV-NEW',
          (body['battery_capacity_kwh'] || 3.7).to_f, (body['usable_capacity_kwh'] || 3.2).to_f,
          body['battery_type'] || 'NMC', (body['nominal_voltage'] || 51.1).to_f,
          (body['rated_range_km'] || 150.0).to_f, (body['base_efficiency_wh_km'] || 34.0).to_f,
          (body['current_soc_percent'] || 90.0).to_f, (body['battery_health_soh_percent'] || 98.0).to_f,
          (body['battery_cycles'] || 10).to_i, (body['odometer_km'] || 500.0).to_f,
          body['current_riding_mode'] || 'Ride', (body['rider_payload_kg'] || 75.0).to_f,
          (body['tyre_front_psi'] || 30.0).to_f, (body['tyre_rear_psi'] || 32.0).to_f,
          30.0, 32.0, JSON.generate(body['supported_connectors'] || ['15A 3-Pin AC']),
          (body['max_charging_power_kw'] || 3.3).to_f, (body['max_dc_fast_power_kw'] || 6.0).to_f,
          0, nil, 0, now
        ])

        created = db.get_first_row('SELECT * FROM vehicles WHERE id = ?;', [id])
        created['supported_connectors'] = JSON.parse(created['supported_connectors']) rescue []
        json_response(res, 201, { success: true, vehicle: created })

      # --- RANGE PREDICTION ENGINE ---
      when [:post, '/api/range/estimate']
        body = parse_body(req)
        vehicle_id = body['vehicle_id']
        vehicle = vehicle_id ? db.get_first_row('SELECT * FROM vehicles WHERE id = ?;', [vehicle_id]) : db.get_first_row('SELECT * FROM vehicles LIMIT 1;')
        if vehicle
          result = PhysicsEngine.calculate_range(vehicle, body)
          json_response(res, 200, { success: true, vehicle_id: vehicle['id'], range_data: result })
        else
          json_response(res, 404, { success: false, error: 'Vehicle not found' })
        end

      # --- STATIONS DISCOVERY ---
      when [:get, '/api/stations']
        stations = db.execute('SELECT * FROM stations ORDER BY available_ports DESC, rating DESC;')
        stations.each do |s|
          s['supported_connectors'] = JSON.parse(s['supported_connectors']) rescue []
          s['amenities'] = JSON.parse(s['amenities']) rescue []
        end
        json_response(res, 200, { success: true, count: stations.size, stations: stations })

      # --- ROUTE TRIP PLANNER ---
      when [:post, '/api/routes/plan']
        body = parse_body(req)
        vehicle_id = body['vehicle_id']
        vehicle = vehicle_id ? db.get_first_row('SELECT * FROM vehicles WHERE id = ?;', [vehicle_id]) : db.get_first_row('SELECT * FROM vehicles LIMIT 1;')
        plan = PhysicsEngine.plan_trip(vehicle, db, body)
        json_response(res, 200, { success: true, plan: plan })

      # --- CHARGING SESSIONS & SIMULATOR ---
      when [:get, '/api/charging/sessions']
        user = authenticate_user(req)
        sessions = db.execute('SELECT * FROM charging_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 20;', [user['id']])
        json_response(res, 200, { success: true, count: sessions.size, sessions: sessions })

      when [:post, '/api/charging/sessions/start']
        user = authenticate_user(req)
        body = parse_body(req)
        session_id = 'chg_' + SecureRandom.hex(6)
        now = Time.now.utc.iso8601

        ins_chg = 'INSERT INTO charging_sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);'
        db.execute(ins_chg, [
          session_id, user['id'], body['vehicle_id'] || 'veh_ather_450x',
          body['station_id'] || 'st_ather_indiranagar', body['station_name'] || 'Fast Charging Hub',
          body['charger_type'] || 'DC Fast', (body['start_soc'] || 20.0).to_f, (body['start_soc'] || 20.0).to_f,
          0.0, 0, 0.0, '₹', 'Active', now, nil
        ])

        json_response(res, 201, { success: true, session_id: session_id, started_at: now })

      when [:post, '/api/charging/sessions/stop']
        body = parse_body(req)
        session_id = body['session_id']
        end_soc = (body['end_soc'] || 85.0).to_f
        energy_kwh = (body['energy_kwh'] || 2.4).to_f
        cost = (body['cost'] || 32.0).to_f
        duration = (body['duration_minutes'] || 25).to_i
        now = Time.now.utc.iso8601

        upd_chg = 'UPDATE charging_sessions SET end_soc = ?, energy_kwh = ?, duration_minutes = ?, cost = ?, status = ?, ended_at = ? WHERE id = ?;'
        db.execute(upd_chg, [end_soc, energy_kwh, duration, cost, 'Completed', now, session_id])

        if body['vehicle_id']
          db.execute('UPDATE vehicles SET current_soc_percent = ?, updated_at = ? WHERE id = ?;', [end_soc, now, body['vehicle_id']])
        end

        json_response(res, 200, { success: true, message: 'Charging session finalized and logged' })

      # --- ENTERPRISE FLEET PORTAL ---
      when [:get, '/api/fleet/summary']
        fleet = db.execute('SELECT * FROM fleet_vehicles;')
        total = fleet.size
        on_route = fleet.count { |f| f['status'] == 'En Route' }
        charging = fleet.count { |f| f['status'] == 'Charging' }
        maintenance = fleet.count { |f| f['status'] == 'Maintenance' }
        total_odo = fleet.sum { |f| f['odometer_km'].to_f }
        avg_wh = total.positive? ? (fleet.sum { |f| f['wh_per_km'].to_f } / total).round(1) : 34.0
        fuel_savings = (total_odo * 2.10).round

        json_response(res, 200, {
          success: true,
          metrics: {
            total_vehicles: total,
            on_route_count: on_route,
            charging_count: charging,
            maintenance_count: maintenance,
            total_odometer_km: total_odo.round,
            fleet_avg_wh_km: avg_wh,
            total_savings_inr: fuel_savings,
            co2_offset_kg: (total_odo * 0.060).round(1)
          }
        })

      when [:get, '/api/fleet/vehicles']
        fleet = db.execute('SELECT * FROM fleet_vehicles ORDER BY status ASC, wh_per_km DESC;')
        json_response(res, 200, { success: true, count: fleet.size, fleet_vehicles: fleet })

      when [:post, '/api/fleet/assign-driver']
        body = parse_body(req)
        db.execute('UPDATE fleet_vehicles SET driver_name = ?, driver_phone = ? WHERE id = ?;', [body['driver_name'], body['driver_phone'], body['vehicle_id']])
        json_response(res, 200, { success: true, message: 'Driver reassigned successfully' })

      when [:get, '/api/fleet/export/csv']
        fleet = db.execute('SELECT * FROM fleet_vehicles;')
        csv_data = "ID,Registration,Model,Driver,Status,SoC %,SOH %,Odometer (km),Wh/km,Efficiency,Location\n"
        fleet.each do |f|
          csv_data += "#{f['id']},#{f['reg_number']},\"#{f['model']}\",\"#{f['driver_name']}\",#{f['status']},#{f['current_soc_percent']},#{f['soh_percent']},#{f['odometer_km']},#{f['wh_per_km']},#{f['is_efficient'].to_i == 1 ? 'Optimal' : 'Inefficient'},\"#{f['last_known_location']}\"\n"
        end
        res.status = 200
        res['Content-Type'] = 'text/csv'
        res['Content-Disposition'] = 'attachment; filename="AeroVolt_Fleet_Telemetry.csv"'
        res.body = csv_data

      # --- ECOSYSTEM, SWAPPING, CHECKOUT & SOS ---
      when [:post, '/api/ecosystem/swap/reserve']
        otp = rand(100_000..999_999).to_s
        res_id = 'SWAP-' + SecureRandom.hex(4).upcase
        now = Time.now.utc.iso8601
        db.execute('INSERT INTO reservations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);', [res_id, 'st_gogoro_swap_hsr', 'veh_ather_450x', 'usr_rider_1', 'battery_swap', otp, now, 15, 'Confirmed'])
        json_response(res, 201, {
          success: true,
          reservation_id: res_id,
          otp_code: otp,
          reserved_packs: 2,
          expires_in_minutes: 15,
          station_name: 'Gogoro GoStation HSR Sector 3'
        })

      when [:post, '/api/ecosystem/payments/checkout']
        body = parse_body(req)
        amount = (body['amount'] || 40.0).to_f
        tx_id = 'TXN-EV-' + rand(10_000_000..99_999_999).to_s
        gst = (amount * 0.05).round(2)
        base = (amount - gst).round(2)

        json_response(res, 200, {
          success: true,
          receipt: {
            transaction_id: tx_id,
            timestamp: Time.now.utc.iso8601,
            station_name: body['station_name'] || 'AeroVolt Super Hub',
            kwh_delivered: (body['kwh'] || 3.2).to_f,
            base_amount: base,
            gst_tax: gst,
            total_paid: amount,
            currency: '₹',
            green_points_earned: ((body['kwh'] || 3.2).to_f * 5).round
          }
        })

      when [:post, '/api/ecosystem/sos/dispatch']
        ticket_id = 'SOS-' + rand(10_000..99_999).to_s
        json_response(res, 201, {
          success: true,
          ticket_id: ticket_id,
          eta_minutes: 14,
          unit_type: 'Mobile EV DC Fast Powerbank Recovery Van',
          specialist_name: 'Vikram Chauhan (Lead EV Recovery)',
          contact: '+91 800-EV-RESCUE',
          status: 'En Route to GPS Coordinates'
        })

      when [:get, '/api/ecosystem/documents']
        docs = db.execute('SELECT * FROM documents;')
        json_response(res, 200, { success: true, count: docs.size, documents: docs })

      else
        # Dynamic ID path handlers (e.g. /api/vehicles/:id)
        if method == :put && path =~ %r{\A/api/vehicles/([^/]+)\z}
          veh_id = Regexp.last_match(1)
          body = parse_body(req)
          now = Time.now.utc.iso8601
          upd_v = 'UPDATE vehicles SET tyre_front_psi = COALESCE(?, tyre_front_psi), tyre_rear_psi = COALESCE(?, tyre_rear_psi), current_soc_percent = COALESCE(?, current_soc_percent), rider_payload_kg = COALESCE(?, rider_payload_kg), odometer_km = COALESCE(?, odometer_km), updated_at = ? WHERE id = ?;'
          db.execute(upd_v, [body['tyre_front_psi']&.to_f, body['tyre_rear_psi']&.to_f, body['current_soc_percent']&.to_f, body['rider_payload_kg']&.to_f, body['odometer_km']&.to_f, now, veh_id])
          updated = db.get_first_row('SELECT * FROM vehicles WHERE id = ?;', [veh_id])
          return json_response(res, 200, { success: true, vehicle: updated })
        elsif method == :delete && path =~ %r{\A/api/vehicles/([^/]+)\z}
          veh_id = Regexp.last_match(1)
          db.execute('DELETE FROM vehicles WHERE id = ?;', [veh_id])
          return json_response(res, 200, { success: true, message: 'Vehicle removed from garage' })
        end

        json_response(res, 404, { success: false, error: "Endpoint #{req.path} not found" })
      end
    end
  end
end
