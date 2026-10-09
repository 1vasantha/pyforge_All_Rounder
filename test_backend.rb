# frozen_string_literal: true

require_relative 'backend/db'
require_relative 'backend/physics_engine'
require_relative 'backend/api'
require 'stringio'
require 'json'

puts "========================================================"
puts "  🧪 Running AeroVolt EV Enterprise Backend Test Suite"
puts "========================================================"

passed = 0
failed = 0

def assert(condition, message)
  if condition
    puts "  [PASS] #{message}"
    true
  else
    puts "  [FAIL] #{message}"
    false
  end
end

# 1. Database & Schema Verification
puts "\n[1] Testing SQLite Database Connection & Seeds..."
db = AeroVolt::DB.connection

user_count = db.get_first_value('SELECT COUNT(*) FROM users;')
assert(user_count.to_i >= 2, "Seeded users exist (#{user_count} found)") ? passed += 1 : failed += 1

veh_count = db.get_first_value('SELECT COUNT(*) FROM vehicles;')
assert(veh_count.to_i >= 2, "Seeded vehicles exist (#{veh_count} found)") ? passed += 1 : failed += 1

st_count = db.get_first_value('SELECT COUNT(*) FROM stations;')
assert(st_count.to_i >= 5, "Seeded charging/swapping stations exist (#{st_count} found)") ? passed += 1 : failed += 1

flt_count = db.get_first_value('SELECT COUNT(*) FROM fleet_vehicles;')
assert(flt_count.to_i >= 6, "Seeded fleet vehicles exist (#{flt_count} found)") ? passed += 1 : failed += 1

# 2. Physics & AI Range Engine Verification
puts "\n[2] Testing Server-Side Physics Range Engine..."
vehicle = db.get_first_row('SELECT * FROM vehicles WHERE id = "veh_ather_450x";')
calc = AeroVolt::PhysicsEngine.calculate_range(vehicle, {
  'temperature_c' => 24.0,
  'rider_payload_kg' => 78.0,
  'riding_mode' => 'Ride',
  'terrain' => 'flat',
  'weather' => 'clear'
})

assert(calc[:estimated_distance_km] > 50.0, "Estimated distance computed: #{calc[:estimated_distance_km]} km") ? passed += 1 : failed += 1
assert(calc[:safe_distance_km] < calc[:estimated_distance_km], "Safe reserve distance computed: #{calc[:safe_distance_km]} km") ? passed += 1 : failed += 1
assert(calc[:dynamic_wh_per_km] > 20.0, "Dynamic energy consumption computed: #{calc[:dynamic_wh_per_km]} Wh/km") ? passed += 1 : failed += 1

# Cold Temperature Physics Test
calc_cold = AeroVolt::PhysicsEngine.calculate_range(vehicle, { 'temperature_c' => -2.0 })
assert(calc_cold[:estimated_distance_km] < calc[:estimated_distance_km], "Cold weather (-2°C) reduces battery range (#{calc_cold[:estimated_distance_km]} km vs #{calc[:estimated_distance_km]} km)") ? passed += 1 : failed += 1

# Route Planner Test
puts "\n[3] Testing Route Planning with Auto Charging Stops..."
route_plan = AeroVolt::PhysicsEngine.plan_trip(vehicle, db, {
  'distance_km' => 120.0, # Exceeds vehicle range, forces charging stop
  'elevation_gain_m' => 400.0
})
assert(route_plan[:is_direct_reachable] == false, "Identified trip requires charging stops (120 km route)") ? passed += 1 : failed += 1
assert(route_plan[:recommended_stops].size > 0, "Auto-injected #{route_plan[:recommended_stops].size} charging stops") ? passed += 1 : failed += 1

# 3. WEBrick REST API Servlet Simulation
puts "\n[4] Testing REST API Servlet Endpoints..."

class MockRequest
  attr_accessor :path, :body, :headers
  def initialize(path, body = nil, headers = {})
    @path = path
    @body = body
    @headers = headers
  end
  def [](key); @headers[key]; end
end

class MockResponse
  attr_accessor :status, :body, :headers
  def initialize
    @headers = {}
    @status = 200
    @body = ''
  end
  def []=(k, v); @headers[k] = v; end
  def [](k); @headers[k]; end
end

servlet = AeroVolt::ApiServlet.new(WEBrick::HTTPServer.new(Port: 9999, DoNotListen: true))

# Test /api/health
req = MockRequest.new('/api/health')
res = MockResponse.new
servlet.do_GET(req, res)
health_json = JSON.parse(res.body)
assert(res.status == 200 && health_json['status'] == 'online', "GET /api/health returns HTTP 200 online") ? passed += 1 : failed += 1

# Test /api/vehicles
req = MockRequest.new('/api/vehicles')
res = MockResponse.new
servlet.do_GET(req, res)
veh_json = JSON.parse(res.body)
assert(res.status == 200 && veh_json['vehicles'].is_a?(Array), "GET /api/vehicles returns vehicle list") ? passed += 1 : failed += 1

# Test /api/range/estimate
req = MockRequest.new('/api/range/estimate', JSON.generate({ 'vehicle_id' => 'veh_ather_450x', 'temperature_c' => 28.0 }))
res = MockResponse.new
servlet.do_POST(req, res)
range_json = JSON.parse(res.body)
assert(res.status == 200 && range_json['range_data']['estimated_distance_km'] > 0, "POST /api/range/estimate returns physics estimate") ? passed += 1 : failed += 1

# Test /api/stations
req = MockRequest.new('/api/stations')
res = MockResponse.new
servlet.do_GET(req, res)
stations_json = JSON.parse(res.body)
assert(res.status == 200 && stations_json['stations'].size > 0, "GET /api/stations returns charging stations") ? passed += 1 : failed += 1

# Test /api/fleet/summary
req = MockRequest.new('/api/fleet/summary')
res = MockResponse.new
servlet.do_GET(req, res)
fleet_json = JSON.parse(res.body)
assert(res.status == 200 && fleet_json['metrics']['total_vehicles'] >= 6, "GET /api/fleet/summary returns fleet KPIs") ? passed += 1 : failed += 1

# Test /api/ecosystem/swap/reserve
req = MockRequest.new('/api/ecosystem/swap/reserve')
res = MockResponse.new
servlet.do_POST(req, res)
swap_json = JSON.parse(res.body)
assert(res.status == 201 && swap_json['otp_code'] =~ /^\d{6}$/, "POST /api/ecosystem/swap/reserve generates 60s swap OTP (#{swap_json['otp_code']})") ? passed += 1 : failed += 1

# Test /api/ecosystem/payments/checkout
req = MockRequest.new('/api/ecosystem/payments/checkout', JSON.generate({ 'amount' => 50.0, 'kwh' => 4.0 }))
res = MockResponse.new
servlet.do_POST(req, res)
pay_json = JSON.parse(res.body)
assert(res.status == 200 && pay_json['receipt']['total_paid'] == 50.0, "POST /api/ecosystem/payments/checkout generates GST invoice") ? passed += 1 : failed += 1

# Test /api/ecosystem/sos/dispatch
req = MockRequest.new('/api/ecosystem/sos/dispatch')
res = MockResponse.new
servlet.do_POST(req, res)
sos_json = JSON.parse(res.body)
assert(res.status == 201 && sos_json['eta_minutes'] == 14, "POST /api/ecosystem/sos/dispatch dispatches roadside assistance van") ? passed += 1 : failed += 1

puts "\n========================================================"
puts "  🎉 Test Suite Summary: #{passed} Passed, #{failed} Failed"
puts "========================================================"

exit(failed == 0 ? 0 : 1)
