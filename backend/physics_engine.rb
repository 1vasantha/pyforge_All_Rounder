# frozen_string_literal: true

module AeroVolt
  class PhysicsEngine
    def self.calculate_range(vehicle, env = {})
      temp_c = (env['temperature_c'] || 24.0).to_f
      payload_kg = (env['rider_payload_kg'] || vehicle['rider_payload_kg'] || 75.0).to_f
      mode_name = (env['riding_mode'] || vehicle['current_riding_mode'] || 'Ride').to_s
      terrain = (env['terrain'] || 'flat').to_s
      weather = (env['weather'] || 'clear').to_s
      traffic = (env['traffic'] || 'moderate').to_s

      front_psi = (env['tyre_front_psi'] || vehicle['tyre_front_psi'] || 30.0).to_f
      rear_psi = (env['tyre_rear_psi'] || vehicle['tyre_rear_psi'] || 32.0).to_f
      nom_front = (vehicle['tyre_front_nominal_psi'] || 30.0).to_f
      nom_rear = (vehicle['tyre_rear_nominal_psi'] || 32.0).to_f

      soc = (env['soc_percent'] || vehicle['current_soc_percent'] || 75.0).to_f
      soh = (vehicle['battery_health_soh_percent'] || 97.0).to_f
      curb_weight = (vehicle['category'] == '2w_bike' ? 140.0 : (vehicle['category'] == '4w_car' ? 1500.0 : 112.0))

      # 1. Temperature Multiplier
      f_temp = if temp_c.between?(22.0, 27.0)
                 1.0
               elsif temp_c < 22.0
                 1.0 + ((22.0 - temp_c) * 0.0075)
               else
                 1.0 + ((temp_c - 27.0) * 0.0045)
               end

      # 2. Inertial Mass & Rolling Resistance Scaling
      base_mass = curb_weight + 70.0
      total_mass = curb_weight + payload_kg
      f_payload = 1.0 + (((total_mass / base_mass) - 1.0) * 0.65)

      # 3. Tyre Pressure Multiplier
      f_front_def = [0.0, (nom_front - front_psi) / nom_front].max
      f_rear_def = [0.0, (nom_rear - rear_psi) / nom_rear].max
      f_tyre = 1.0 + (((f_front_def + f_rear_def) / 2.0) * 0.28)

      # 4. Weather Aerodynamics
      f_weather = case weather
                  when 'headwind' then 1.16
                  when 'rain' then 1.10
                  when 'heavy_storm' then 1.24
                  else 1.00
                  end

      # 5. Terrain Elevation
      f_terrain = case terrain
                  when 'uphill_steep' then 1.38
                  when 'rolling' then 1.08
                  when 'downhill' then 0.76
                  else 1.00
                  end

      # 6. Urban Traffic Stop-and-Go
      f_traffic = case traffic
                  when 'heavy_stop_go' then 1.15
                  when 'low' then 0.96
                  else 1.00
                  end

      # 7. Riding Mode Throttle Governor
      f_mode = case mode_name.downcase
               when 'eco' then 0.85
               when 'sport', 'sports' then 1.25
               when 'warp', 'hyper', 'ballistic' then 1.55
               else 1.00 # Ride, Normal, City
               end

      f_ai = 1.01 # Adaptive learning factor

      combined_factor = f_temp * f_payload * f_tyre * f_weather * f_terrain * f_traffic * f_mode * f_ai

      base_wh_km = (vehicle['base_efficiency_wh_km'] || 34.0).to_f
      dynamic_wh_km = (base_wh_km * combined_factor).round(1)

      usable_kwh = (vehicle['usable_capacity_kwh'] || (vehicle['battery_capacity_kwh'] * 0.9)).to_f
      remaining_wh = (usable_kwh * 1000.0 * (soh / 100.0) * (soc / 100.0)).round

      est_km = dynamic_wh_km.positive? ? (remaining_wh / dynamic_wh_km).round(1) : 0.0
      safe_km = (est_km * 0.85).round(1)

      insights = []
      insights << "Switching to Eco mode recovers +#{((est_km * (f_mode / 0.85)) - est_km).round(1)} km" if f_mode > 0.9
      insights << "Inflating tyres to spec recovers +#{((est_km * f_tyre) - est_km).round(1)} km" if f_tyre > 1.02
      insights << "Cold battery at #{temp_c}°C loses #{((f_temp - 1.0) * 100).round}% efficiency" if temp_c < 15.0

      {
        estimated_distance_km: est_km,
        safe_distance_km: safe_km,
        dynamic_wh_per_km: dynamic_wh_km,
        base_wh_per_km: base_wh_km,
        remaining_usable_wh: remaining_wh,
        battery_health_soh: soh,
        current_soc_percent: soc,
        active_mode: mode_name,
        factors: {
          temperature: { factor: f_temp.round(2), value: "#{temp_c}°C" },
          payload: { factor: f_payload.round(2), value: "#{payload_kg} kg" },
          tyre_pressure: { factor: f_tyre.round(2), value: "F:#{front_psi}/R:#{rear_psi} PSI" },
          weather: { factor: f_weather.round(2), value: weather },
          terrain: { factor: f_terrain.round(2), value: terrain },
          traffic: { factor: f_traffic.round(2), value: traffic },
          riding_mode: { factor: f_mode.round(2), value: mode_name }
        },
        actionable_insights: insights
      }
    end

    def self.plan_trip(vehicle, db, params = {})
      origin = params['origin'] || 'Current GPS'
      dest = params['destination'] || 'Target Destination'
      distance_km = (params['distance_km'] || 60.0).to_f
      elev_gain_m = (params['elevation_gain_m'] || 50.0).to_f

      range_calc = calculate_range(vehicle, params)
      dynamic_wh_km = range_calc[:dynamic_wh_per_km]
      remaining_wh = range_calc[:remaining_usable_wh]

      total_mass = (vehicle['category'] == '4w_car' ? 1650.0 : 190.0)
      elev_wh = (total_mass * 9.81 * [0.0, elev_gain_m].max) / 3600.0
      total_needed_wh = (distance_km * dynamic_wh_km) + elev_wh

      is_direct = remaining_wh >= (total_needed_wh * 1.15)
      arrival_soc = [0.0, (((remaining_wh - total_needed_wh) / (vehicle['usable_capacity_kwh'] * 1000.0)) * 100.0)].max.round(1)
      driving_mins = ((distance_km / 42.0) * 60.0).round

      stops = []

      unless is_direct
        # Query compatible fast or swap stations
        stations = db.execute('SELECT * FROM stations WHERE status = "Available" ORDER BY is_fast_charger DESC, power_kw DESC LIMIT 3;')
        selected_st = stations.first

        if selected_st
          stop_dist = (distance_km * 0.45).round(1)
          energy_to_stop = stop_dist * dynamic_wh_km
          stop_arr_soc = [5.0, (((remaining_wh - energy_to_stop) / (vehicle['usable_capacity_kwh'] * 1000.0)) * 100.0)].max.round(1)

          is_swap = selected_st['is_battery_swap'].to_i == 1
          chg_mins = is_swap ? 2 : 28
          dep_soc = is_swap ? 100.0 : 80.0
          cost = is_swap ? 35.0 : 42.0

          stops << {
            stop_number: 1,
            station_id: selected_st['id'],
            station_name: selected_st['name'],
            operator: selected_st['operator'],
            address: selected_st['address'],
            distance_from_origin_km: stop_dist,
            arrival_soc_percent: stop_arr_soc,
            departure_soc_percent: dep_soc,
            charge_duration_minutes: chg_mins,
            charging_power_kw: selected_st['power_kw'],
            is_battery_swap: is_swap,
            estimated_cost: cost,
            currency: selected_st['currency_symbol'] || '₹'
          }
        end
      end

      total_trip_mins = driving_mins + stops.sum { |s| s[:charge_duration_minutes] }
      final_soc = stops.empty? ? arrival_soc : 45.0

      {
        origin: origin,
        destination: dest,
        distance_km: distance_km,
        elevation_gain_meters: elev_gain_m,
        total_energy_needed_wh: total_needed_wh.round,
        is_direct_reachable: is_direct,
        driving_time_minutes: driving_mins,
        total_trip_minutes: total_trip_mins,
        final_arrival_soc_percent: final_soc,
        recommended_stops: stops
      }
    end
  end
end
