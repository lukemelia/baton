require 'spec_helper'

describe "concurrency modes" do
  
  # describe ":broadcast" do
  #   before(:each) do
  #     @config = { :concurrency => :broadcast }
  #   end
  #   
  #   it "should publish a message to multiple subscribers on a single channel" do
  #     start_server(@config)
  #     
  #     subscribe_result_1 = subscribe('/subscribe/42')
  #     subscribe_result_2 = subscribe('/subscribe/42')
  # 
  #     publish_response = post('/publish/42', 'I think I can')
  #     
  #     [subscribe_result_1, subscribe_result_2].each &:thread_join
  # 
  #     subscribe_result_1.response.code.to_i.should == 200
  #     subscribe_result_1.response.body.should == 'I think I can'
  #     subscribe_result_2.response.code.to_i.should == 200
  #     subscribe_result_2.response.body.should == 'I think I can'
  #     publish_response.code.to_i.should == 201
  #     
  #     stop_server
  #   end
  # end
  # 
  # describe ":first" do
  #   before(:each) do
  #     @config = { :concurrency => :first }
  #   end
  #   
  #   it "should publish a message to a channel" do
  #     start_server(@config)
  #     
  #     subscribe_result = subscribe('/subscribe/42')
  #     publish_response = post('/publish/42', 'I think I can')
  #     
  #     subscribe_result.thread_join
  # 
  #     subscribe_result.response.code.to_i.should == 200
  #     subscribe_result.response.body.should == 'I think I can'
  #     publish_response.code.to_i.should == 201
  #     
  #     stop_server
  #   end
  #   
  #   
  #   it "should close connections on a channel subsequent to the first connection with a 409" do
  #     start_server(@config)
  #     
  #     response_1, response_2 = nil, nil
  #     conn_thread_1 = Thread.new do
  #       response_1 = get('/subscribe/42')
  #     end
  #     conn_thread_2 = Thread.new do
  #       response_2 = get('/subscribe/42')
  #     end
  #     
  #     conn_thread_2.join
  #     response_2.code.to_i.should == 409
  # 
  #     stop_server
  #     conn_thread_1.join
  #   end    
  # end
  # 
  # describe ":last" do
  #   before(:each) do
  #     @config = { :concurrency => :last }
  #   end
  #   
  #   it "should publish a message to a channel" do
  #     start_server(@config)
  #     
  #     subscribe_result = subscribe('/subscribe/42')
  #     publish_response = post('/publish/42', 'I think I can')
  #     
  #     subscribe_result.thread_join
  # 
  #     subscribe_result.response.code.to_i.should == 200
  #     subscribe_result.response.body.should == 'I think I can'
  #     publish_response.code.to_i.should == 201
  #     
  #     stop_server
  #   end
  #   
  #   it "should close the original connection with a 409 when a new connection is opened on the same channel" do
  #     start_server(@config)
  #     
  #     response_1, response_2 = nil, nil
  #     conn_thread_1 = Thread.new do
  #       response_1 = get('/subscribe/42')
  #     end
  #     conn_thread_2 = Thread.new do
  #       response_2 = get('/subscribe/42')
  #     end
  #     
  #     conn_thread_1.join
  #     response_1.should_not be_nil
  #     response_1.code.to_i.should == 409
  # 
  #     stop_server
  #     conn_thread_2.join
  #   end
  # end
end