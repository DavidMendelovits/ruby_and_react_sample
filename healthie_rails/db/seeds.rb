# Providers
dr_smith = Provider.create!(name: "Dr. Sarah Smith", email: "sarah.smith@example.com")
dr_jones = Provider.create!(name: "Dr. Michael Jones", email: "michael.jones@example.com")
dr_patel = Provider.create!(name: "Dr. Priya Patel", email: "priya.patel@example.com")

# Clients
alice = Client.create!(name: "Alice Johnson", email: "alice@example.com")
bob = Client.create!(name: "Bob Williams", email: "bob@example.com")
carol = Client.create!(name: "Carol Davis", email: "carol@example.com")
dan = Client.create!(name: "Dan Martinez", email: "dan@example.com")
eve = Client.create!(name: "Eve Thompson", email: "eve@example.com")

# Provider-Client relationships with plans
ProviderClient.create!(provider: dr_smith, client: alice, plan: :premium)
ProviderClient.create!(provider: dr_smith, client: bob, plan: :basic)
ProviderClient.create!(provider: dr_smith, client: carol, plan: :premium)
ProviderClient.create!(provider: dr_jones, client: alice, plan: :basic)
ProviderClient.create!(provider: dr_jones, client: dan, plan: :premium)
ProviderClient.create!(provider: dr_patel, client: bob, plan: :basic)
ProviderClient.create!(provider: dr_patel, client: eve, plan: :premium)
ProviderClient.create!(provider: dr_patel, client: carol, plan: :basic)

# Journal entries (with varied timestamps for sorting demo)
JournalEntry.create!(client: alice, body: "Started new meal plan today. Feeling optimistic about the changes.", created_at: 3.days.ago)
JournalEntry.create!(client: alice, body: "Had a tough day sticking to the plan. Stress eating in the evening.", created_at: 1.day.ago)
JournalEntry.create!(client: alice, body: "Back on track. Prepped meals for the whole week.", created_at: 2.hours.ago)
JournalEntry.create!(client: bob, body: "First session went well. Learned about portion sizes.", created_at: 5.days.ago)
JournalEntry.create!(client: bob, body: "Tried the recommended smoothie recipe. Delicious!", created_at: 2.days.ago)
JournalEntry.create!(client: carol, body: "Blood sugar levels have been more stable this week.", created_at: 4.days.ago)
JournalEntry.create!(client: carol, body: "Added 30 minutes of walking daily. Energy levels improving.", created_at: 1.day.ago)
JournalEntry.create!(client: dan, body: "Completed my first week of the elimination diet.", created_at: 6.days.ago)
JournalEntry.create!(client: dan, body: "Reintroduced dairy — no adverse reactions so far.", created_at: 1.day.ago)
JournalEntry.create!(client: eve, body: "Feeling much better after adjusting my hydration goals.", created_at: 3.days.ago)

puts "Seeded: #{Provider.count} providers, #{Client.count} clients, #{ProviderClient.count} relationships, #{JournalEntry.count} journal entries"
