# frozen_string_literal: true

require_relative 'backend/server'

port = ENV['PORT'] || 8080
AeroVolt::Server.start(port)
