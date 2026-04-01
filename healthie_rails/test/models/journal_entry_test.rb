require "test_helper"

class JournalEntryTest < ActiveSupport::TestCase
  setup do
    @client = Client.create!(name: "Test", email: "test@example.com")
  end

  test "requires body" do
    entry = JournalEntry.new(client: @client)
    assert_not entry.valid?
    assert_includes entry.errors[:body], "can't be blank"
  end

  test "requires client" do
    entry = JournalEntry.new(body: "Some text")
    assert_not entry.valid?
  end

  test "belongs to client" do
    entry = JournalEntry.create!(client: @client, body: "Test entry")
    assert_equal @client, entry.client
  end

  test "recent scope orders by created_at desc" do
    old = JournalEntry.create!(client: @client, body: "Old", created_at: 3.days.ago)
    mid = JournalEntry.create!(client: @client, body: "Mid", created_at: 1.day.ago)
    recent = JournalEntry.create!(client: @client, body: "Recent", created_at: 1.hour.ago)

    entries = @client.journal_entries.recent
    assert_equal [recent, mid, old], entries.to_a
  end
end
