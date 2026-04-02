require "test_helper"

class Api::V1::Provider::JournalEntriesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @provider = Provider.create!(name: "Dr. Test", email: "provider@example.com")
    @client = Client.create!(name: "Test Client", email: "client@example.com")
    ProviderClient.create!(provider: @provider, client: @client, plan: :basic)
    @active_entry = JournalEntry.create!(client: @client, body: "Active entry")
    @archived_entry = JournalEntry.create!(client: @client, body: "Archived entry", archived_at: 1.day.ago)
  end

  test "index returns all entries including archived for authenticated provider" do
    get api_v1_provider_journal_entries_url, headers: { "X-Provider-Id" => @provider.id }

    assert_response :ok
    entries = JSON.parse(response.body)
    assert_equal 2, entries.length
    ids = entries.map { |e| e["id"] }
    assert_includes ids, @active_entry.id
    assert_includes ids, @archived_entry.id
  end

  test "index returns 401 without provider header" do
    get api_v1_provider_journal_entries_url

    assert_response :unauthorized
  end
end
