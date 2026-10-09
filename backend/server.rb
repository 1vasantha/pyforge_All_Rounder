# frozen_string_literal: true

require 'webrick'
require_relative 'db'
require_relative 'api'

module AeroVolt
  class Server
    def self.start(port = 8080)
      public_dir = File.expand_path('../../', __FILE__)

      server = WEBrick::HTTPServer.new(
        Port: port.to_i,
        DocumentRoot: public_dir,
        AccessLog: [],
        Logger: WEBrick::Log.new($stdout, WEBrick::Log::INFO)
      )

      # Initialize database connection and schemas
      DB.connection

      # Mount API Servlet on /api
      server.mount('/api', ApiServlet)

      trap('INT') { server.shutdown }
      trap('TERM') { server.shutdown }

      puts "================================================================="
      puts "  🚀 AeroVolt EV Enterprise - Full-Stack Working Backend & Frontend"
      puts "================================================================="
      puts "  Local Application URL : http://localhost:#{port}"
      puts "  REST API Base URL     : http://localhost:#{port}/api"
      puts "  Health Check Endpoint : http://localhost:#{port}/api/health"
      puts "  SQLite Database File  : #{DB::DB_FILE}"
      puts "  Static Assets Root    : #{public_dir}"
      puts "================================================================="
      puts "  Press Ctrl+C to terminate the server."
      puts "================================================================="

      server.start
    end
  end
end

if __FILE__ == $0
  port = ENV['PORT'] || 8080
  AeroVolt::Server.start(port)
end
