ENV["RAILS_ENV"] = "test"

require "rubygems"
require "bundler"
Bundler.setup

require 'spec'
require 'typhoeus'

Thread.abort_on_exception = true

module Poller
  def poll_until(timeout = 15, &block)
    waiting = true
    start_time = Time.now
    while waiting
      if (Time.now - start_time > timeout)
        raise "Timeout expired in poll_until"
      end
    
      begin
        if yield
          waiting = false
        end
      end
    end
  end
end
Kernel.extend Poller

Pathname.glob(Pathname.new(File.dirname(__FILE__)).join("spec_helpers/*.rb")).each do |filename|
  require filename.to_s
end

Spec::Runner.configure do |config|

end