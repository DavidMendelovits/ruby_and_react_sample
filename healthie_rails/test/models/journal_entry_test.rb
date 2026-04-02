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

  test "active scope excludes archived entries" do
    active = JournalEntry.create!(client: @client, body: "Active")
    JournalEntry.create!(client: @client, body: "Archived", archived_at: 1.day.ago)

    assert_equal [active], @client.journal_entries.active.to_a
  end

  test "archived scope returns only archived entries" do
    JournalEntry.create!(client: @client, body: "Active")
    archived = JournalEntry.create!(client: @client, body: "Archived", archived_at: 1.day.ago)

    assert_equal [archived], @client.journal_entries.archived.to_a
  end

  test "archive! sets archived_at" do
    entry = JournalEntry.create!(client: @client, body: "Test")
    assert_nil entry.archived_at

    entry.archive!
    assert_not_nil entry.reload.archived_at
  end

  test "unarchive! clears archived_at" do
    entry = JournalEntry.create!(client: @client, body: "Test", archived_at: 1.day.ago)
    assert_not_nil entry.archived_at

    entry.unarchive!
    assert_nil entry.reload.archived_at
  end

  test "archived? returns true when archived_at present" do
    entry = JournalEntry.new(archived_at: Time.current)
    assert entry.archived?

    entry.archived_at = nil
    assert_not entry.archived?
  end

  test "active and recent scopes chain correctly" do
    old_active = JournalEntry.create!(client: @client, body: "Old active", created_at: 2.days.ago)
    new_active = JournalEntry.create!(client: @client, body: "New active", created_at: 1.hour.ago)
    JournalEntry.create!(client: @client, body: "Archived", created_at: 1.day.ago, archived_at: 1.hour.ago)

    entries = @client.journal_entries.active.recent
    assert_equal [new_active, old_active], entries.to_a
  end
end
