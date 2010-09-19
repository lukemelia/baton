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
  end
  
  attr_reader :message
  
  def clear_message
    @message = ''
  end
  def on_client_message(message)
    puts "on_client_message: #{message}"
    @message_received = true
    @message << message
  end
  
  def wait_for_message(client, expected_message_or_regexp = nil)
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
  client = SocketIoClient.new("ws://0.0.0.0:8080/rt/websocket", listener)
  return client, listener
end

def subscribe(channel_id, client = SocketIoClient.new("ws://0.0.0.0:8080/rt/websocket", MessageListener.new), listener = client.listener)
  client.connect
  client.send("SUBSCRIBE #{channel_id}")
  listener.wait_for_message(client)
end

def subscribe_on_thread(channel_id, client = SocketIoClient.new("ws://0.0.0.0:8080/rt/websocket", MessageListener.new), listener = client.listener, &block)
  Thread.new do
    subscribe(channel_id, client, listener)
    yield if block_given?
  end
end

# def subscribe(endpoint, opts = {})
#   publish_endpoint = endpoint.gsub(/subscribe/, 'publish').gsub(/sub/, 'pub')
#   starting_number_of_subscribers = get(publish_endpoint).response.header['x-channel-subscribers'].to_i
#   
#   request_headers = {}
#   request_headers['If-Modified-Since'] = opts[:if_modified_since] if opts[:if_modified_since]
#   request_headers['If-None-Match'] = opts[:if_none_match] if opts[:if_none_match]
#   subscribe_result = SubscribeResult.new
#   subscribe_result.thread = Thread.new do
#     client = WebSocket.new("ws://0.0.0.0:8080/")
#     client.send("SUBSCRIBE 42")
#     subscribe_result.message = client.receive()
#   end
# 
#   poll_until {
#     get(publish_endpoint).response.header['x-channel-subscribers'].to_i == starting_number_of_subscribers + 1
#   }
#   subscribe_result
# end
