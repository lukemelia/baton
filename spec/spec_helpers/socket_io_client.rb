require 'json'

class SocketIoClient
  FRAME = "~m~"
  
  attr_reader :listener
  
  def initialize(uri, listener)
    @uri = uri
    @listener = listener
    @open = false
  end
  
  def connect
    WebSocket.debug = true
    web_socket
  end
  
  def disconnect
    web_socket.close
    @web_socket = nil
  end
  
  def web_socket
    @web_socket ||= begin
      ws = WebSocket.new(@uri)
      @open = true
      ws
    end
  end
  
  def _on_message(data)
    messages = decode(data);
    if (messages === false)
      puts 'Bad message received from client'
      return
    end
    messages.each do |message|
      frame = message[0..2]
      case frame
      when '~h~'
        on_heartbeat(message[3..-1])
        next
      when '~j~'
        message = JSON.parse(message[3..-1]);
        break
      end
      next if message.is_a?(String) && message =~ /^\d+$/
      @listener.on_client_message(message);
    end
  end

  def on_heartbeat(h)
    # no-op for now
  end
  
  def send(message)
    # actual socket.io client supports queueing here in absence of connection. we don't currently
    web_socket.send(encode(message))
  end
  
  def receive
    _on_message(web_socket.receive)
  end
  
  def queue(message)
    @write_queue ||= []
    @write_queue.push(message)
  end
  
  def decode(data)
    messages = []
    number = nil
    begin
      return messages unless data[0..2] == FRAME
      data = data[3..-1] # pop off the frame
      message_length_str = ''
      data.chars.each_with_index do |char, i|
        if (char =~ /\d/)
          message_length_str << char
        else  
          data = data[i + FRAME.length..-1]
          break
        end
      end
      message_length = message_length_str.to_i
      messages.push(data[0, message_length])
      data = data[message_length..-1]
    end while data != ''
    return messages
  end
  
  def encode(messages)
    messages = [''] if messages.nil? || messages == ''
    Array(messages).
      map{ |m| m.nil? ? '' : m }.
      map{ |m| stringify(m) }.
      map{ |m| "#{FRAME}#{m.length}#{FRAME}#{m}"}.
      join
  end
  
  def stringify(message)
    if !message.is_a?(String) && message.respond_to?(:to_json)
      return '~j~' + message.to_json
    else
      message.to_s
    end
  end
end