require "test_helper"

class ProviderClientTest < ActiveSupport::TestCase
  setup do
    @provider = Provider.create!(name: "Dr. Test", email: "dr@example.com")
    @client = Client.create!(name: "Test Client", email: "client@example.com")
  end

  test "valid with basic plan" do
    pc = ProviderClient.new(provider: @provider, client: @client, plan: :basic)
    assert pc.valid?
  end

  test "valid with premium plan" do
    pc = ProviderClient.new(provider: @provider, client: @client, plan: :premium)
    assert pc.valid?
  end

  test "rejects invalid plan value" do
    assert_raises(ArgumentError) do
      ProviderClient.new(provider: @provider, client: @client, plan: "gold")
    end
  end

  test "enforces unique provider-client pair" do
    ProviderClient.create!(provider: @provider, client: @client, plan: :basic)
    duplicate = ProviderClient.new(provider: @provider, client: @client, plan: :premium)
    assert_not duplicate.valid?
  end

  test "same client can have different providers" do
    other_provider = Provider.create!(name: "Dr. Other", email: "other@example.com")
    ProviderClient.create!(provider: @provider, client: @client, plan: :basic)
    pc2 = ProviderClient.new(provider: other_provider, client: @client, plan: :premium)
    assert pc2.valid?
  end
end
