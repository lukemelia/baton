require 'spec_helper'

describe "subscriber endpoint" do
  # before(:each) do
  #   start_server(RedBaton.new(:store_messages => true, :max_messages => 5))
  #   put('/publish/42')
  # end
  # after(:each) do
  #   stop_server
  # end
  # 
  # it "should have a Last-Modified header in the response" do
  #   start_time = Time.now - 1
  #   post('/publish/42', 'Hi Mom')
  # 
  #   subscriber_result = subscribe('/subscribe/42')
  #   subscriber_result.thread_join
  #   subscriber_result.code.should == 200
  #   last_modified_header_value = subscriber_result.response.header['Last-Modified']
  # 
  #   end_time = Time.now
  #   last_modified_header_value.should_not be_nil
  #   last_modified_from_header = Time.parse(last_modified_header_value)
  #   last_modified_from_header.should be > start_time
  #   last_modified_from_header.should be < end_time
  # end
  # 
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
