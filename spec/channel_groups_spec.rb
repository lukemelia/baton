require 'spec_helper'

describe "channel groups" do
  # context "with multiple configs, including with channel group specified and unspecified" do
  #   before(:each) do
  #     start_server(RedBaton.new([
  #       {:channel_group => :group_a, :publish_path => '/a/pub/:channel_id', :subscribe_path => '/a/sub/:channel_id'},
  #       {:channel_group => :group_b, :publish_path => '/b/pub/:channel_id', :subscribe_path => '/b/sub/:channel_id'},
  #       {:publish_path => '/pub/:channel_id', :subscribe_path => '/sub/:channel_id'}
  #     ]))
  #   end
  #   after(:each) do
  #     stop_server
  #   end
  #   
  #   it "each channel group should have its own keyspace of channel IDs" do
  #     subscribe_default_result = subscribe('/sub/42')
  #     subscribe_a_result = subscribe('/a/sub/42')
  #     subscribe_b_result = subscribe('/b/sub/42')
  # 
  #     publish_default_response = post('/pub/42', 'On default channel group')
  #     publish_b_response = post('/b/pub/42', 'On channel group B')
  #     publish_a_response = post('/a/pub/42', 'On channel group A')
  #     
  #     [subscribe_default_result, subscribe_a_result, subscribe_b_result].each &:thread_join
  # 
  #     subscribe_default_result.response.code.to_i.should == 200
  #     subscribe_default_result.response.body.should == 'On default channel group'
  #     subscribe_a_result.response.code.to_i.should == 200
  #     subscribe_a_result.response.body.should == 'On channel group A'
  #     subscribe_b_result.response.code.to_i.should == 200
  #     subscribe_b_result.response.body.should == 'On channel group B'
  #     publish_default_response.code.to_i.should == 201
  #     publish_a_response.code.to_i.should == 201
  #     publish_b_response.code.to_i.should == 201
  #   end
  # end
end