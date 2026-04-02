require "test_helper"

class JournalEntryTest < ActiveSupport::TestCase
  setup do
    @provider = Provider.create!(name: "Dr. Test", email: "drtest@example.com")
    @client = Client.create!(name: "Test", email: "test@example.com")
    @provider_client = ProviderClient.create!(provider: @provider, client: @client, plan: :basic)
  end

  test "requires body" do
    entry = JournalEntry.new(client: @client, provider: @provider)
    assert_not entry.valid?
    assert_includes entry.errors[:body], "can't be blank"
  end

  test "requires client" do
    entry = JournalEntry.new(body: "Some text", provider: @provider)
    assert_not entry.valid?
  end

  test "requires provider" do
    entry = JournalEntry.new(body: "Some text", client: @client)
    assert_not entry.valid?
  end

  test "belongs to client" do
    entry = JournalEntry.create!(client: @client, provider: @provider, body: "Test entry")
    assert_equal @client, entry.client
  end

  test "belongs to provider" do
    entry = JournalEntry.create!(client: @client, provider: @provider, body: "Test entry")
    assert_equal @provider, entry.provider
  end

  test "recent scope orders by created_at desc" do
    old = JournalEntry.create!(client: @client, provider: @provider, body: "Old", created_at: 3.days.ago)
    mid = JournalEntry.create!(client: @client, provider: @provider, body: "Mid", created_at: 1.day.ago)
    recent = JournalEntry.create!(client: @client, provider: @provider, body: "Recent", created_at: 1.hour.ago)

    entries = @client.journal_entries.recent
    assert_equal [recent, mid, old], entries.to_a
  end

  # --- Plan enforcement tests ---

  test "BASIC_MONTHLY_LIMIT is 10" do
    assert_equal 10, JournalEntry::BASIC_MONTHLY_LIMIT
  end

  test "rejects entry when no provider-client relationship exists" do
    other_provider = Provider.create!(name: "Dr. Other", email: "other@example.com")
    entry = JournalEntry.new(client: @client, provider: other_provider, body: "Test")
    assert_not entry.valid?
    assert_includes entry.errors[:base], "Provider is not associated with this client"
  end

  test "basic plan allows entries up to limit" do
    JournalEntry::BASIC_MONTHLY_LIMIT.times do |i|
      entry = JournalEntry.create!(client: @client, provider: @provider, body: "Entry #{i + 1}")
      assert entry.persisted?, "Entry #{i + 1} should have been saved"
    end
  end

  test "basic plan rejects entry at limit" do
    JournalEntry::BASIC_MONTHLY_LIMIT.times do |i|
      JournalEntry.create!(client: @client, provider: @provider, body: "Entry #{i + 1}")
    end

    over_limit = JournalEntry.new(client: @client, provider: @provider, body: "Over limit")
    assert_not over_limit.valid?
    assert_includes over_limit.errors[:base], "Basic plan limit of #{JournalEntry::BASIC_MONTHLY_LIMIT} journal entries per month reached"
  end

  test "premium plan allows unlimited entries" do
    @provider_client.update!(plan: :premium)

    15.times do |i|
      entry = JournalEntry.create!(client: @client, provider: @provider, body: "Entry #{i + 1}")
      assert entry.persisted?
    end
  end

  test "previous month entries do not count toward limit" do
    # Create entries last month
    travel_to 1.month.ago do
      JournalEntry::BASIC_MONTHLY_LIMIT.times do |i|
        JournalEntry.create!(client: @client, provider: @provider, body: "Old entry #{i + 1}")
      end
    end

    # Should still be able to create entries this month
    entry = JournalEntry.new(client: @client, provider: @provider, body: "New month entry")
    assert entry.valid?
  end

  test "entries for different provider do not count toward limit" do
    other_provider = Provider.create!(name: "Dr. Other", email: "other@example.com")
    ProviderClient.create!(provider: other_provider, client: @client, plan: :basic)

    # Fill up limit for other provider
    JournalEntry::BASIC_MONTHLY_LIMIT.times do |i|
      JournalEntry.create!(client: @client, provider: other_provider, body: "Other entry #{i + 1}")
    end

    # Should still be able to create entries for original provider
    entry = JournalEntry.new(client: @client, provider: @provider, body: "My entry")
    assert entry.valid?
  end
end
