module Node
  class Server
    attr_reader :pid
    
    def initialize(options = {})
      if ENV['DEBUG']
        @debug = true
        options["debug"] = true
      end

      @node_thread = Thread.new do
        options_string = options.map{ |k,v|
          if v == false
            nil
          elsif v == true
            "--#{k}"
          else
            "--#{k} #{v}"
          end
        }.compact.join(" ")
        
        @pid = fork do
          cmd = "node server.js #{options_string}"
          puts "\n" + cmd + "\n"
          exec cmd
        end
      end
    end
    
    def stop!
      Process.kill "TERM", pid
      Process.wait pid
    end

    def debug?
      @debug == true
    end
  end
end

def start_server(options = {})
  stop_server if @node_server
  @node_server = Node::Server.new(options)
  wait_for_server_to_start
end

def stop_server
  @node_server.stop!
  @node_server = nil
end

def wait_for_server_to_start
  $stdout.write "Waiting for server to start" if @node_server.debug?
  sleep 1
  server_is_starting = true
  server_start_time = Time.now
  while server_is_starting && (Time.now - server_start_time < 30)
    if @node_server.debug?
      $stdout.write "."
      $stdout.flush
    end
    begin
      if get('/foo').code.to_i == 404
        server_is_starting = false
      end
    rescue
      sleep 5
    end
  end
  if @node_server.debug?
    puts " Ready!"
    $stdout.flush
  end
end
