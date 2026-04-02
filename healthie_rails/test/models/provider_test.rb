require "test_helper"

class ProviderTest < ActiveSupport::TestCase
  test "requires name" do
    provider = Provider.new(email: "test@example.com")
    assert_not provider.valid?
    assert_includes provider.errors[:name], "can't be blank"
  end

  test "requires email" do
    provider = Provider.new(name: "Dr. Test")
    assert_not provider.valid?
    assert_includes provider.errors[:email], "can't be blank"
  end

  test "requires unique email" do
    Provider.create!(name: "Dr. A", email: "same@example.com")
    duplicate = Provider.new(name: "Dr. B", email: "same@example.com")
    assert_not duplicate.valid?
  end

  test "has many clients through provider_clients" do
    provider = Provider.create!(name: "Dr. Test", email: "test@example.com")
    client = Client.create!(name: "Client A", email: "a@example.com")
    ProviderClient.create!(provider: provider, client: client, plan: :basic)

    assert_includes provider.clients, client
  end

  test "client_journal_entries returns entries across all clients sorted desc" do
    provider = Provider.create!(name: "Dr. Test", email: "test@example.com")
    client1 = Client.create!(name: "C1", email: "c1@example.com")
    client2 = Client.create!(name: "C2", email: "c2@example.com")
    ProviderClient.create!(provider: provider, client: client1, plan: :basic)
    ProviderClient.create!(provider: provider, client: client2, plan: :premium)

    old_entry = JournalEntry.create!(client: client1, provider: provider, body: "Old entry", created_at: 2.days.ago)
    new_entry = JournalEntry.create!(client: client2, provider: provider, body: "New entry", created_at: 1.hour.ago)

    entries = provider.client_journal_entries
    assert_equal 2, entries.count
    assert_equal new_entry, entries.first
    assert_equal old_entry, entries.last
  end
end
