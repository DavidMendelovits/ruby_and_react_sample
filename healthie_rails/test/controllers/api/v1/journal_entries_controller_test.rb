require "test_helper"

class Api::V1::JournalEntriesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @client = Client.create!(name: "Test Client", email: "client@example.com")
    @other_client = Client.create!(name: "Other Client", email: "other@example.com")
    @active_entry = JournalEntry.create!(client: @client, body: "Active entry")
    @archived_entry = JournalEntry.create!(client: @client, body: "Archived entry", archived_at: 1.day.ago)
    @other_entry = JournalEntry.create!(client: @other_client, body: "Other client entry")
  end

  test "index returns only active entries for authenticated client" do
    get api_v1_journal_entries_url, headers: { "X-Client-Id" => @client.id }

    assert_response :ok
    entries = JSON.parse(response.body)
    assert_equal 1, entries.length
    assert_equal @active_entry.id, entries.first["id"]
  end

  test "index returns 401 without client header" do
    get api_v1_journal_entries_url

    assert_response :unauthorized
  end

  test "archive sets archived_at and returns 200" do
    patch archive_api_v1_journal_entry_url(@active_entry), headers: { "X-Client-Id" => @client.id }

    assert_response :ok
    @active_entry.reload
    assert_not_nil @active_entry.archived_at
  end

  test "archive returns 422 if already archived" do
    patch archive_api_v1_journal_entry_url(@archived_entry), headers: { "X-Client-Id" => @client.id }

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_equal "Already archived", body["error"]
  end

  test "archive returns 404 for another clients entry" do
    patch archive_api_v1_journal_entry_url(@other_entry), headers: { "X-Client-Id" => @client.id }

    assert_response :not_found
  end

  test "unarchive clears archived_at and returns 200" do
    patch unarchive_api_v1_journal_entry_url(@archived_entry), headers: { "X-Client-Id" => @client.id }

    assert_response :ok
    @archived_entry.reload
    assert_nil @archived_entry.archived_at
  end

  test "unarchive returns 422 if not archived" do
    patch unarchive_api_v1_journal_entry_url(@active_entry), headers: { "X-Client-Id" => @client.id }

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert_equal "Not archived", body["error"]
  end
end
