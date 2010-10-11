require 'spec_helper'

describe "publisher endpoint" do
  include Poller
  context "GET requests" do
     context "when the specified channel does not exist" do
       before(:each) do
         start_server
       end
       after(:each) do
         stop_server
       end
       it "should respond with 404" do
         get('/publish/42').code.to_i.should == 404
       end
     end
     context "when the specified channel exists" do
       before(:each) do
         start_server({:store_messages => true, :max_messages => 5})
         put('/publish/42')
       end
       after(:each) do
         stop_server
       end
  
       it "should respond with 200" do
         get('/publish/42').code.to_i.should == 200
       end
  
       it "should include the number of subscribers in an X-Channel-Subscribers header" do
         get('/publish/42').header['x-channel-subscribers'].should == '0'
  
         thread = Thread.new do
           sleep 1
           subscribe('42')
         end
  
         poll_until {
           response = get('/publish/42').response
           response.header['x-channel-subscribers'] == '1'
         }
         delete('/publish/42')
  
         thread.join
       end
  
       it "should include the number of messages in an X-Channel-Messages header" do
         get('/publish/42').header['x-channel-messages'].should == '0'
         post('/publish/42', 'Hi Mom')
         get('/publish/42').header['x-channel-messages'].should == '1'
         post('/publish/42', 'Hi Dad')
         get('/publish/42').header['x-channel-messages'].should == '2'
       end
     end
   end
  
   context "PUT requests" do
     context "when the specified channel does not exist" do
       before(:each) do
         start_server({:store_messages => true, :max_messages => 5})
         get('/publish/42').code.to_i.should == 404
       end
       after(:each) do
         stop_server
       end
  
       it "should respond with a 200" do
         response = put('/publish/42')
         response.code.to_i.should == 200
       end
  
       it "should create the channel" do
         put('/publish/42')
         get('/publish/42').code.to_i.should == 200
       end
  
       it "should include the number of subscribers in an X-Channel-Subscribers header" do
         put('/publish/42').header['x-channel-subscribers'].should == '0'
  
         thread = Thread.new do
           sleep 1
           subscribe('42')
         end
  
         poll_until {
           response = get('/publish/42').response
           response.header['x-channel-subscribers'] == '1'
         }
         delete('/publish/42')
  
         thread.join
       end
  
       it "should include the number of messages in an X-Channel-Messages header" do
         put('/publish/42').header['x-channel-messages'].should == '0'
         post('/publish/42', 'Hi Mom')
         put('/publish/42').header['x-channel-messages'].should == '1'
       end
     end
  
     context "when the specified channel exists" do
       before(:each) do
         start_server({:store_messages => true, :max_messages => 5})
         put('/publish/42')
       end
       after(:each) do
         stop_server
       end
  
       it "should respond with a 200" do
         response = put('/publish/42')
         response.code.to_i.should == 200
       end
  
       it "should leave the existing channel as-is" do
         put('/publish/42')
         get('/publish/42').code.to_i.should == 200
       end
  
       it "should include the number of subscribers in an X-Channel-Subscribers header" do
         put('/publish/42').header['x-channel-subscribers'].should == '0'
  
         thread = Thread.new do
           sleep 1
           subscribe('42')
         end
  
         poll_until {
           response = get('/publish/42').response
           response.header['x-channel-subscribers'] == '1'
         }
         delete('/publish/42')
  
         thread.join
       end
  
       it "should include the number of messages in an X-Channel-Messages header" do
         put('/publish/42').header['x-channel-messages'].should == '0'
         post('/publish/42', 'Hi Mom')
         put('/publish/42').header['x-channel-messages'].should == '1'
       end
     end
  
   end
 
  context "DELETE requests" do
    context "when the specified channel does not exist" do
      before(:each) do
        start_server
        get('/publish/42').code.to_i.should == 404
      end
      after(:each) do
        stop_server
      end
      it "should respond with a 404" do
        delete('/publish/42').code.to_i.should == 404
      end
    end
    context "when the specified channel exists" do
      before(:each) do
        start_server
        put('/publish/42')
        get('/publish/42').code.to_i.should == 200
      end
      after(:each) do
        stop_server
      end

      it "should respond with a 200" do
        delete('/publish/42').code.to_i.should == 200
      end

      it "should delete the channel" do
        delete('/publish/42')
        get('/publish/42').code.to_i.should == 404
      end

      it "should include the number of subscribers in an X-Channel-Subscribers header" do
        delete('/publish/42').header['x-channel-subscribers'].should == '0'
      end

      it "should include the number of messages in an X-Channel-Messages header" do
        delete('/publish/42').header['x-channel-messages'].should == '0'
      end

      it "should trigger unsubscribes for open subscriber connections" do
        client, listener = new_client_and_listener
        subscribe("42", client, listener)

        delete('/publish/42')

        listener.wait_for_unsubscribed(client, '42', 'CHANNEL DELETED')
      end
    end
  end
  
   context "POST requests" do
   
     describe "message delivery" do
       before(:each) do
         start_server
         put('/publish/42')
       end
       after(:each) do
         stop_server
       end
   
       specify "The message MUST be immediately delivered to all currently long-held subscriber requests" do
         client_1, listener_1 = new_client_and_listener
         thread_1 = subscribe_on_thread("42", client_1, listener_1) do
           listener_1.wait_for_message(client_1, /Hi Mom/)
         end
   
         client_2, listener_2 = new_client_and_listener
         thread_2 = subscribe_on_thread("42", client_2, listener_2) do
           listener_2.wait_for_message(client_2, /Hi Mom/)
         end
   
         sleep 1
         post('/publish/42', 'Hi Mom')
   
         [thread_1, thread_2].each &:join
       end
     end
   
     describe "HTTP response" do
       before(:each) do
         start_server({:store_messages => true, :max_messages => 5})
         put('/publish/42')
       end
       after(:each) do
         stop_server
       end
   
       it "MUST be 201 Created if there were any long-held subscribers that have been sent this message" do
         subscribe('42')
         post('/publish/42', 'Hi Mom').response.code.to_i.should == 201
       end
   
       it "MUST be 202 Accepted if there were no long-held subscribers" do
         post('/publish/42', 'Hi Mom').response.code.to_i.should == 202
       end
   
       it "should include the number of subscribers in an X-Channel-Subscribers header" do
         get('/publish/42').header['x-channel-subscribers'].should == '0'
   
         subscribe('42')
   
         poll_until {
           response = get('/publish/42').response
           response.header['x-channel-subscribers'] == '1'
         }
         post('/publish/42', 'Hi Mom').header['x-channel-subscribers'].should == '1'
       end
   
       it "should include the number of messages in an X-Channel-Messages header" do
         get('/publish/42').header['x-channel-messages'].should == '0'
         post('/publish/42', 'Hi Mom')
         get('/publish/42').header['x-channel-messages'].should == '1'
         post('/publish/42', 'Hi Dad').header['x-channel-messages'].should == '2'
       end
     end
   
     context "message storage is configured to store at most 1 message" do
       before(:each) do
         start_server({:store_messages => true, :max_messages => 1})
         put('/publish/42')
       end
       after(:each) do
         stop_server
       end
   
       specify "the message MAY be stored for future retrieval" do
         post('/publish/42', 'Hi Mom')
   
         client, listener = new_client_and_listener
   
         get('/publish/42').header['x-channel-messages'].should == '1'
   
         subscribe("42", client, listener)
         listener.wait_for_message(client, /Hi Mom/)
       end
   
       specify "the oldest message stored for the channel MAY be deleted" do
         post('/publish/42', 'First message')
         post('/publish/42', 'Second message')
         get('/publish/42').header['x-channel-messages'].should == '1'
          
         client, listener = new_client_and_listener
         subscribe("42", client, listener)
         listener.wait_for_message(client, /Second message/)
       end
     end
   
     context "message storage is disabled" do
       before(:each) do
         start_server({:store_messages => false})
         put('/publish/42')
       end
       after(:each) do
         stop_server
       end
       specify "messages are not stored for future retrieval" do
         post('/publish/42', 'Hi Mom')
   
         client, listener = new_client_and_listener
         subscribe("42", client, listener)
   
         get('/publish/42').header['x-channel-messages'].should == '0'
         delete('/publish/42')
         
         listener.message.should_not =~ /Hi Mom/
       end
     end
   
   end
   
  # TODO: Not sure of the best way to make this happen with node-router
  # context "other HTTP requests" do
  #   before(:each) do
  #     start_server
  #   end
  #   after(:each) do
  #     stop_server
  #   end
  #   it "should respond with a 405" do
  #     send_options_request('/publish/42').code.to_i.should == 405
  #   end
  # end
  
  context "with custom publish endpoint" do
    before(:each) do
      start_server({:store_messages => true, :publish_path => '/custom/pub/:channel_id'})
    end
    after(:each) do
      stop_server
    end
  
    it "should work as expected" do
      put('/custom/pub/42')
      get('/custom/pub/42').code.to_i.should == 200
    end
  end
end