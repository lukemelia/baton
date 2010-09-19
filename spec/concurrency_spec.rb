require 'spec_helper'

describe "when multiple subscribers on a single channel" do
  before(:each) do
    start_server
  end
  after(:each) do
    stop_server
  end
  
  it "should publish messages to all the subscribers" do
    client_1, listener_1 = new_client_and_listener
    thread_1 = subscribe_on_thread("42", client_1, listener_1) do
      listener_1.wait_for_message(client_1, /Hi Mom/)
    end
    
    client_2, listener_2 = new_client_and_listener
    thread_2 = subscribe_on_thread("42", client_2, listener_2) do
      listener_2.wait_for_message(client_2, /Hi Mom/)
    end

    sleep 1
    post('/publish/42', 'Hi Mom').response.code.to_i.should == 201

    [thread_1, thread_2].each &:join
  end
end