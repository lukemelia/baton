require 'spec/spec_helpers/socket_io_client'

class BatonClient
  attr_reader :listener
  
  def initialize(uri, listener)
    @listener = listener
    @socket_io_client = ::SocketIoClient.new(uri, self)
    @channel_timestamps = {}
  end
  
  def on_client_message(message)
    if message =~ /^SUBSCRIBED (.+)$/
      @listener.on_subscribed($1)
    elsif message =~ /^UNSUBSCRIBED (.+) \((.+)\)$/
      @listener.on_unsubscribed($1, $2)
    else
      message =~ /^(.+) ([0-9.]+) (.+)$/
      channel_id = $1
      timestamp = $2
      message_body = $3
      @listener.on_client_message(message_body)
      @channel_timestamps[channel_id.to_s] = timestamp
    end
  end
  
  def connect
    @socket_io_client.connect
  end
  
  def receive
    @socket_io_client.receive
  end
  
  def disconnect
    @socket_io_client.disconnect
  end
  
  def subscribe(channel_id)
    subscribe_command = "SUBSCRIBE #{channel_id}"
    subscribe_command << " SINCE #{@channel_timestamps[channel_id.to_s]}" if @channel_timestamps.has_key?(channel_id.to_s)
    @socket_io_client.send(subscribe_command)
  end
  
end