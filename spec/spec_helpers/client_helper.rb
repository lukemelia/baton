require 'net/http'
require 'uri'

def get(endpoint, special_headers = {})
  endpoint = "http://0.0.0.0:8081#{endpoint}" unless endpoint =~ /\:\/\//
  url = URI.parse(endpoint)
  Net::HTTP.start(url.host, url.port) {|http|
    http.read_timeout = 5
    http.get(endpoint, special_headers)
  }
rescue EOFError => e # stopping Thin during open connection
  # OK
rescue Timeout::Error => e
  return nil
end

def post(endpoint, request_body, special_headers = {})
  endpoint = "http://0.0.0.0:8081#{endpoint}" unless endpoint =~ /\:\/\//
  url = URI.parse(endpoint)
  Net::HTTP.start(url.host, url.port) {|http|
    http.read_timeout = 5
    http.post(endpoint, request_body, special_headers)
  }
rescue EOFError => e # stopping Thin during open connection
  # OK
rescue Timeout::Error => e
  return nil
end

def put(endpoint, request_body = '')
  endpoint = "http://0.0.0.0:8081#{endpoint}" unless endpoint =~ /\:\/\//
  url = URI.parse(endpoint)
  Net::HTTP.start(url.host, url.port) {|http|
    http.read_timeout = 5
    http.put(endpoint, request_body)
  }
rescue EOFError => e # stopping Thin during open connection
  # OK
rescue Timeout::Error => e
  return nil
end

def delete(endpoint)
  endpoint = "http://0.0.0.0:8081#{endpoint}" unless endpoint =~ /\:\/\//
  url = URI.parse(endpoint)
  Net::HTTP.start(url.host, url.port) {|http|
    http.read_timeout = 5
    http.delete(endpoint)
  }
rescue EOFError => e # stopping Thin during open connection
  # OK
rescue Timeout::Error => e
  return nil
end

def send_options_request(endpoint)
  url = URI.parse("http://0.0.0.0:8081#{endpoint}")
  Net::HTTP.start(url.host, url.port) {|http|
    http.read_timeout = 5
    http.options(endpoint)
  }
rescue EOFError => e # stopping Thin during open connection
  # OK
rescue Timeout::Error => e
  return nil
end

class MessageListener
  include Poller
  
  def initialize
    @message = ''
    @subscribes = {}
    @unsubscribes = {}
  end
  
  attr_reader :message
  
  def clear_message
    @message = ''
  end
  
  def on_client_message(message)
    puts "on_client_message: #{message.inspect}"
    unless message.nil? || message == ''
      @message_received = true
      @message << message
    end
  end
  
  def on_subscribed(channel_id)
    @subscribes[channel_id] = true
  end
  
  def on_unsubscribed(channel_id, reason)
    @unsubscribes[channel_id] = reason
  end
  
  def wait_for_subscription_confirmation(client, channel_id)
    if @subscribes[channel_id]
      return
    else
      client.receive
      wait_for_subscription_confirmation(client, channel_id)
    end
  end
  
  def wait_for_message(client, expected_message_or_regexp = nil)
    puts "wait_for_message #{expected_message_or_regexp.inspect}"
    puts "#{@message}"
    if @message_received = true && expected_message_or_regexp
      return true if expected_message_or_regexp.is_a?(Regexp) && @message =~ expected_message_or_regexp
      return true if @message == expected_message_or_regexp
    end
    
    @message_received = false
    while (@message_received == false)
      client.receive
    end

    if expected_message_or_regexp
      wait_for_message(client, expected_message_or_regexp)
    end
  end
  
  def poll_for_message(expected_message_or_regexp)
    poll_until do
      # puts "message is now: '#{listener.message}'" unless listener.message.nil? || listener.message == '' 
      if @message == ''
        false
      elsif expected_message_or_regexp.is_a?(Regexp)
        @message =~ expected_message_or_regexp
      else
        @message == expected_message_or_regexp
      end
    end
  end
  
  def wait_for_unsubscribed(client, expected_channel_id, expected_reason_or_regexp)
    puts "wait_for_unsubscribed #{expected_channel_id.inspect}, #{expected_reason_or_regexp.inspect}"
    if reason = @unsubscribes[expected_channel_id]
      return true if expected_reason_or_regexp.is_a?(Regexp) && reason =~ @unsubscribes[expected_channel_id]
      return true if reason == @unsubscribes[expected_channel_id]
    end
    
    while (@unsubscribes[expected_channel_id].nil?)
      client.receive
    end

    wait_for_unsubscribed(client, expected_channel_id, expected_reason_or_regexp)
  end
end

class SubscribeResult
  attr_accessor :response
  attr_accessor :thread
  def thread_join
    thread.join
  end
  def body
    response.body
  end
  def code
    response.code.to_i
  end
end

def new_client_and_listener
  listener = MessageListener.new
  client = BatonClient.new("ws://0.0.0.0:8080/rt/websocket", listener)
  return client, listener
end

def subscribe(channel_id, client = BatonClient.new("ws://0.0.0.0:8080/rt/websocket", MessageListener.new), listener = client.listener)
  client.connect
  client.subscribe(channel_id)
  listener.wait_for_subscription_confirmation(client, channel_id)
end

def subscribe_on_thread(channel_id, client = BatonClient.new("ws://0.0.0.0:8080/rt/websocket", MessageListener.new), listener = client.listener, &block)
  Thread.new do
    subscribe(channel_id, client, listener)
    yield if block_given?
  end
end

