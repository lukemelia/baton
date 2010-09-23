require 'spec_helper'

describe "subscriber endpoint" do
  before(:each) do
    start_server(:store_messages => true, :max_messages => 5)
    put('/publish/42')
  end
  after(:each) do
    stop_server
  end
  
  it "should respect a client's SINCE timestamp" do
    start_time = Time.now - 1
    post('/publish/42', 'Message 1')
    post('/publish/42', 'Message 2')
    post('/publish/42', 'Message 3')
    
    client, listener = new_client_and_listener
    thread = Thread.new do
      subscribe("42", client, listener)
      listener.wait_for_message(client, /Message 1/)
      listener.wait_for_message(client, /Message 2/)
      listener.wait_for_message(client, /Message 3/)
    end
    thread.join
    
    client.disconnect
    listener.clear_message
    
    post('/publish/42', 'Message 4')
    post('/publish/42', 'Message 5')
  
    thread = Thread.new do
      subscribe("42", client, listener)
      listener.wait_for_message(client, /Message 4/)
      listener.wait_for_message(client, /Message 5/)
      listener.message.should_not =~ /Message [123]/
    end
  
    thread.join
  end
  
  # it "should have an ETag header in the response" do
  #   post('/publish/42', 'Hi Mom')
  #   subscriber_result = subscribe('/subscribe/42')
  #   subscriber_result.thread_join
  #   subscriber_result.code.should == 200
  #   subscriber_result.response.header['ETag'].should_not be_nil
  # end
  # 
  # it "should respect the If-Modified-Since request header" do
  #   post('/publish/42', 'Hi Mom')
  #   post('/publish/42', 'Hi Dad')
  # 
  #   subscriber_result = subscribe('/subscribe/42')
  #   subscriber_result.thread_join
  #   subscriber_result.code.should == 200
  #   subscriber_result.body.should == 'Hi Mom'
  #   last_modified_header_value = subscriber_result.response.header['Last-Modified']
  #   
  #   subscriber_result = subscribe('/subscribe/42', :if_modified_since => last_modified_header_value)
  #   subscriber_result.thread_join
  #   subscriber_result.code.should == 200
  #   subscriber_result.body.should == 'Hi Dad'
  # 
  #   subscriber_result = subscribe('/subscribe/42')
  #   subscriber_result.thread_join
  #   subscriber_result.code.should == 200
  #   subscriber_result.body.should == 'Hi Mom'
  # end
  # 
  # it "should respect the If-None-Match request header" do
  #   post('/publish/42', 'Hi Mom')
  #   post('/publish/42', 'Hi Dad')
  # 
  #   subscriber_result = subscribe('/subscribe/42')
  #   subscriber_result.thread_join
  #   subscriber_result.code.should == 200
  #   subscriber_result.body.should == 'Hi Mom'
  #   etag_header_value = subscriber_result.response.header['ETag']
  #   
  #   subscriber_result = subscribe('/subscribe/42', :if_none_match => etag_header_value)
  #   subscriber_result.thread_join
  #   subscriber_result.code.should == 200
  #   subscriber_result.body.should == 'Hi Dad'
  # 
  #   subscriber_result = subscribe('/subscribe/42')
  #   subscriber_result.thread_join
  #   subscriber_result.code.should == 200
  #   subscriber_result.body.should == 'Hi Mom'
  # end
  # 
end
