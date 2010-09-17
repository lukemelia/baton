require 'spec_helper'

describe "Socket.IO ruby client" do
  before(:each) do
    @client = SocketIoClient.new('', {})
  end
  
  it "should decode properly" do
    decoded = @client.decode('~m~5~m~abcde' + '~m~9~m~123456789')
    decoded.length.should == 2
    decoded[0].should == 'abcde'
    decoded[1].should == '123456789'
  end
  
  it "should decode bad framed messages" do
    decoded = @client.decode('~m~5~m~abcde' + '~m\uffsdaasdfd9~m~1aaa23456789')
    decoded.length.should == 1
    decoded[0].should == 'abcde'
    decoded[1].should == nil
  end
  
  it "should decode typical heartbeat message" do
    decoded = @client.decode('~m~4~m~~h~1')
    decoded.length.should == 1
    decoded[0].should == '~h~1'
  end
  
  it "should encode properly" do
    @client.encode(['abcde', '123456789']).should == '~m~5~m~abcde' + '~m~9~m~123456789'
    @client.encode('asdasdsad').should == '~m~9~m~asdasdsad'
    @client.encode('').should == '~m~0~m~'
    @client.encode(nil).should == '~m~0~m~'
  end
end
