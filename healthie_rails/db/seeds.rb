# frozen_string_literal: true

# ---------------------------------------------------------------------------
# Deterministic seed data – re-runnable (idempotent via truncate)
# Targets: 10 providers, 200 clients, ~600 provider_clients, ~1 200 journal entries
# ---------------------------------------------------------------------------

puts "Clearing existing data…"
JournalEntry.delete_all
ProviderClient.delete_all
Client.delete_all
Provider.delete_all

# --- helpers ----------------------------------------------------------------

FIRST_NAMES = %w[
  Alice Bob Carol Dan Eve Frank Grace Hank Iris Jack Kate Leo Mia Nate Olivia
  Pat Quinn Rosa Sam Tina Uma Vic Wendy Xena Yuri Zoe Amir Bao Chen Devi Emil
  Fatima Gael Hana Ines Jorge Kira Liam Maya Nico Omar Priya Raj Sara Tariq
  Uma Vlad Wei Xin Yuki Zara Amara Bjorn Cleo Dara Eshan Fern Gita Hugo Isla
  Jada Kai Luna Milo Noor Opal Petra Quill Remy Sage Thea Umi Vera Wren Xander
  Yael Zion Adele Boris Clara Dante Elise Felix Gwen Harlan Ivy Jasper
].freeze

LAST_NAMES = %w[
  Smith Johnson Williams Brown Jones Garcia Miller Davis Rodriguez Martinez
  Hernandez Lopez Wilson Anderson Thomas Taylor Moore Jackson White Harris
  Martin Thompson Robinson Clark Lewis Lee Walker Hall Allen Young King Wright
  Scott Torres Nguyen Hill Flores Green Adams Nelson Baker Gonzalez Carter
  Mitchell Perez Roberts Turner Phillips Campbell Parker Evans Edwards Collins
  Stewart Sanchez Morris Rogers Reed Cook Morgan Bell Murphy Bailey Rivera
  Cooper Richardson Cox Howard Ward Brooks Gray James Watson Price Bennett
].freeze

SPECIALTIES = [
  "Dr.", "Dr.", "Dr.", "Dr.", "Dr.",  # weight toward Dr.
  "NP", "RD", "LCSW", "PA",
].freeze

JOURNAL_TEMPLATES = [
  # Nutrition
  "Followed my meal plan today. %s",
  "Struggled with cravings for %s — used the coping strategies we discussed.",
  "Prepped meals for the week: %s.",
  "Tried a new recipe: %s. Turned out great!",
  "Skipped breakfast again. Need to work on morning routine.",
  "Logged all meals today. Total calories felt right.",
  "Drank %d glasses of water today — %s my goal.",
  # Exercise
  "Walked %d minutes today. %s",
  "Did a %d-minute yoga session. Feeling %s afterward.",
  "Went for a run — %s miles. New personal best!",
  # Mental health
  "Feeling %s today. %s",
  "Sleep was %s last night — got about %d hours.",
  "Anxiety was %s today. Journaling helped.",
  "Had a productive therapy session. Key takeaway: %s.",
  # Medical
  "Blood pressure reading: %d/%d. %s",
  "Blood sugar was %d mg/dL this morning. %s",
  "Took all medications on time today.",
  "Missed my evening dose. Set a reminder for tomorrow.",
  "Weight this morning: %d lbs. %s from last week.",
  # General
  "Good day overall. %s",
  "Tough day. %s",
  "Noticed %s. Will bring it up at next appointment.",
  "Followed up on lab results — %s.",
].freeze

FILLERS = {
  food: ["sweets", "salty snacks", "fast food", "carbs", "sugary drinks"],
  meals: ["chicken + rice + broccoli", "salmon bowls", "overnight oats", "salads and wraps"],
  recipes: ["cauliflower fried rice", "protein smoothie bowl", "lentil soup", "zucchini noodles"],
  feelings: ["optimistic", "anxious", "calm", "frustrated", "energized", "drained", "hopeful"],
  sleep: ["restless", "solid", "interrupted", "deep", "light"],
  exercise_notes: ["Knees felt good.", "A bit sore but manageable.", "Pushed through fatigue.", "Felt easy today."],
  takeaways: [
    "boundaries are a skill, not a wall",
    "progress isn't linear",
    "self-compassion is part of the process",
    "small wins compound over time",
    "I can't control everything, but I can control my response",
  ],
  bp_notes: ["Within normal range.", "Slightly elevated — monitoring.", "Improved from last reading."],
  bg_notes: ["On target!", "A bit high — adjusting dinner portions.", "Stable all week."],
  weight_direction: ["down 1 lb", "up 2 lbs", "unchanged"],
  general_good: ["Energy levels are up.", "Stuck to all my goals.", "Felt present and focused."],
  general_tough: ["Emotional eating in the evening.", "Didn't sleep well.", "Skipped my walk."],
  symptoms: ["some joint stiffness in the morning", "mild headaches after lunch", "improved digestion"],
  lab_results: ["everything within normal limits", "vitamin D still low — increasing supplement", "cholesterol improving"],
}.freeze

rng = Random.new(42) # deterministic seed for reproducibility

def pick(rng, arr)
  arr[rng.rand(arr.length)]
end

def generate_journal_body(rng)
  template = pick(rng, JOURNAL_TEMPLATES)

  # Count format specifiers to know what to inject
  specs = template.scan(/%[ds]/)

  case template
  when /cravings/    then template % pick(rng, FILLERS[:food])
  when /Prepped/     then template % pick(rng, FILLERS[:meals])
  when /new recipe/  then template % pick(rng, FILLERS[:recipes])
  when /water/       then template % [rng.rand(4..12), rng.rand(2) == 0 ? "below" : "above"]
  when /Walked/      then template % [rng.rand(15..60), pick(rng, FILLERS[:exercise_notes])]
  when /yoga/        then template % [rng.rand(10..45), pick(rng, FILLERS[:feelings])]
  when /run/         then template % format("%.1f", rng.rand(1.0..6.0))
  when /Feeling/     then template % [pick(rng, FILLERS[:feelings]), pick(rng, FILLERS[:general_good])]
  when /Sleep/       then template % [pick(rng, FILLERS[:sleep]), rng.rand(4..9)]
  when /Anxiety/     then template % pick(rng, FILLERS[:feelings])
  when /therapy/     then template % pick(rng, FILLERS[:takeaways])
  when /pressure/    then template % [rng.rand(110..145), rng.rand(65..95), pick(rng, FILLERS[:bp_notes])]
  when /sugar/       then template % [rng.rand(70..180), pick(rng, FILLERS[:bg_notes])]
  when /Weight/      then template % [rng.rand(120..250), pick(rng, FILLERS[:weight_direction])]
  when /Good day/    then template % pick(rng, FILLERS[:general_good])
  when /Tough day/   then template % pick(rng, FILLERS[:general_tough])
  when /Noticed/     then template % pick(rng, FILLERS[:symptoms])
  when /lab results/ then template % pick(rng, FILLERS[:lab_results])
  else
    # Templates with no interpolation (medications, breakfast, etc.)
    template
  end
end

# --- providers (10) --------------------------------------------------------

providers = 10.times.map do |i|
  first = FIRST_NAMES[i]
  last  = LAST_NAMES[i]
  title = SPECIALTIES[i % SPECIALTIES.length]
  Provider.create!(
    name:  "#{title} #{first} #{last}",
    email: "#{first.downcase}.#{last.downcase}@healthie-demo.com",
  )
end

puts "  Created #{providers.size} providers"

# --- clients (200) ---------------------------------------------------------

clients = 200.times.map do |i|
  first = FIRST_NAMES[i % FIRST_NAMES.length]
  last  = LAST_NAMES[i % LAST_NAMES.length]
  # Ensure unique emails by appending index
  Client.create!(
    name:  "#{first} #{last}",
    email: "#{first.downcase}.#{last.downcase}.#{i}@example.com",
  )
end

puts "  Created #{clients.size} clients"

# --- provider_clients (~600) ------------------------------------------------
# Each client gets 1-5 providers (weighted toward 2-3). Plans split ~60/40.

provider_client_count = 0
clients.each do |client|
  num_providers = [1, 2, 2, 3, 3, 3, 4, 5][rng.rand(8)]
  assigned = providers.shuffle(random: rng).first(num_providers)

  assigned.each do |provider|
    plan = rng.rand(10) < 6 ? :basic : :premium
    ProviderClient.create!(provider: provider, client: client, plan: plan)
    provider_client_count += 1
  end
end

puts "  Created #{provider_client_count} provider_clients"

# --- journal entries (~1200) ------------------------------------------------
# Distribute over last 90 days. Some clients are prolific journalers, some barely write.

journal_count = 0
clients.each do |client|
  # QA edge cases baked in:
  #   - ~5% of clients have 0 entries (tests empty states)
  #   - ~10% have 1 entry (boundary)
  #   - rest get 3-15 entries
  roll = rng.rand(100)
  num_entries = if roll < 5
                  0
                elsif roll < 15
                  1
                else
                  rng.rand(3..15)
                end

  num_entries.times do
    days_ago = rng.rand(0..89)
    hours    = rng.rand(0..23)
    minutes  = rng.rand(0..59)
    timestamp = days_ago.days.ago.change(hour: hours, min: minutes)

    JournalEntry.create!(
      client:     client,
      body:       generate_journal_body(rng),
      created_at: timestamp,
      updated_at: timestamp,
    )
    journal_count += 1
  end
end

puts "  Created #{journal_count} journal entries"

# --- QA edge-case records ---------------------------------------------------
# Explicit edge cases a QA engineer would want:

# Long name (boundary testing)
long_client = Client.create!(name: "A" * 255, email: "longname@example.com")
ProviderClient.create!(provider: providers.first, client: long_client, plan: :basic)
JournalEntry.create!(client: long_client, body: "Testing with a very long client name.", created_at: 1.day.ago)

# Unicode / international characters
unicode_client = Client.create!(name: "José María García-López", email: "jose.garcia@example.com")
ProviderClient.create!(provider: providers.first, client: unicode_client, plan: :premium)
JournalEntry.create!(client: unicode_client, body: "Empecé mi plan de alimentación hoy. Feeling hopeful! 🌮", created_at: 2.days.ago)

# Special characters in journal body
special_client = Client.create!(name: "O'Brien-Smith", email: "obrien@example.com")
ProviderClient.create!(provider: providers.last, client: special_client, plan: :basic)
JournalEntry.create!(
  client: special_client,
  body: "Entry with <html> tags & \"quotes\" and 'apostrophes'. Also: backslash-n \\n chars?",
  created_at: 1.hour.ago,
)

# Very long journal entry
JournalEntry.create!(
  client: clients.first,
  body: "Today was intense. " + ("I reflected on my progress and how far I've come. " * 50),
  created_at: 30.minutes.ago,
)

# Entry created at exact midnight (boundary)
JournalEntry.create!(
  client: clients.second,
  body: "Midnight journal entry — can't sleep.",
  created_at: Time.current.beginning_of_day,
)

# Entry from far in the past
JournalEntry.create!(
  client: clients.third,
  body: "Imported from old system.",
  created_at: 2.years.ago,
)

puts "\n✅ Seed complete!"
puts "   Providers:        #{Provider.count}"
puts "   Clients:          #{Client.count}"
puts "   ProviderClients:  #{ProviderClient.count}"
puts "   JournalEntries:   #{JournalEntry.count}"
