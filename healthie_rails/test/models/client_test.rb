require "test_helper"

class ClientTest < ActiveSupport::TestCase
  test "requires name" do
    client = Client.new(email: "test@example.com")
    assert_not client.valid?
  end

  test "requires email" do
    client = Client.new(name: "Test")
    assert_not client.valid?
  end

  test "requires unique email" do
    Client.create!(name: "A", email: "same@example.com")
    duplicate = Client.new(name: "B", email: "same@example.com")
    assert_not duplicate.valid?
  end

  test "has many providers through provider_clients" do
    client = Client.create!(name: "Test", email: "test@example.com")
    provider = Provider.create!(name: "Dr. Test", email: "dr@example.com")
    ProviderClient.create!(provider: provider, client: client, plan: :basic)

    assert_includes client.providers, provider
  end

  test "has many journal entries" do
    client = Client.create!(name: "Test", email: "test@example.com")
    provider = Provider.create!(name: "Dr. Test", email: "drtest@example.com")
    ProviderClient.create!(provider: provider, client: client, plan: :basic)
    JournalEntry.create!(client: client, provider: provider, body: "Entry 1")
    JournalEntry.create!(client: client, provider: provider, body: "Entry 2")

    assert_equal 2, client.journal_entries.count
  end

  test "journal entries sorted by date descending" do
    client = Client.create!(name: "Test", email: "test@example.com")
    provider = Provider.create!(name: "Dr. Test", email: "drtest@example.com")
    ProviderClient.create!(provider: provider, client: client, plan: :basic)
    old = JournalEntry.create!(client: client, provider: provider, body: "Old", created_at: 2.days.ago)
    recent = JournalEntry.create!(client: client, provider: provider, body: "Recent", created_at: 1.hour.ago)

    assert_equal recent, client.journal_entries.recent.first
    assert_equal old, client.journal_entries.recent.last
  end
end
