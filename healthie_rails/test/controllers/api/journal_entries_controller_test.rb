require "test_helper"

class Api::JournalEntriesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @provider = Provider.create!(name: "Dr. Test", email: "drtest-api@example.com")
    @client = Client.create!(name: "Test Client", email: "client-api@example.com")
    @provider_client = ProviderClient.create!(provider: @provider, client: @client, plan: :basic)
  end

  # --- CREATE tests ---

  test "POST create returns 201 for basic plan under limit" do
    post api_provider_journal_entries_url(@provider),
      params: { client_id: @client.id, body: "My journal entry" },
      as: :json

    assert_response :created
    json = JSON.parse(response.body)
    assert_equal "My journal entry", json["body"]
    assert_equal @client.id, json["client_id"]
    assert_equal @provider.id, json["provider_id"]
  end

  test "POST create returns 422 when basic plan limit exceeded" do
    JournalEntry::BASIC_MONTHLY_LIMIT.times do |i|
      JournalEntry.create!(client: @client, provider: @provider, body: "Entry #{i + 1}")
    end

    post api_provider_journal_entries_url(@provider),
      params: { client_id: @client.id, body: "Over limit" },
      as: :json

    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert_includes json["errors"], "Basic plan limit of #{JournalEntry::BASIC_MONTHLY_LIMIT} journal entries per month reached"
  end

  test "POST create returns 201 for premium plan" do
    @provider_client.update!(plan: :premium)

    # Create more than basic limit
    12.times do |i|
      post api_provider_journal_entries_url(@provider),
        params: { client_id: @client.id, body: "Premium entry #{i + 1}" },
        as: :json

      assert_response :created, "Entry #{i + 1} should succeed for premium plan"
    end
  end

  test "POST create returns 422 for missing body" do
    post api_provider_journal_entries_url(@provider),
      params: { client_id: @client.id },
      as: :json

    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert_includes json["errors"], "Body can't be blank"
  end

  test "POST create returns 404 for invalid provider" do
    post api_provider_journal_entries_url(999999),
      params: { client_id: @client.id, body: "Test" },
      as: :json

    assert_response :not_found
  end

  test "POST create returns 422 when no provider-client relationship" do
    other_provider = Provider.create!(name: "Dr. Other", email: "other-api@example.com")

    post api_provider_journal_entries_url(other_provider),
      params: { client_id: @client.id, body: "Orphan entry" },
      as: :json

    assert_response :unprocessable_entity
    json = JSON.parse(response.body)
    assert_includes json["errors"], "Provider is not associated with this client"
  end

  # --- INDEX tests ---

  test "GET index returns entries for provider" do
    entry1 = JournalEntry.create!(client: @client, provider: @provider, body: "Entry 1")
    entry2 = JournalEntry.create!(client: @client, provider: @provider, body: "Entry 2")

    get api_provider_journal_entries_url(@provider), as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal 2, json.length
    assert_equal entry2.id, json.first["id"] # recent first
  end

  test "GET index returns empty array when no entries" do
    get api_provider_journal_entries_url(@provider), as: :json

    assert_response :ok
    json = JSON.parse(response.body)
    assert_equal [], json
  end
end
