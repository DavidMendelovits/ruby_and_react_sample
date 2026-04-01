# Provider-Client Management API

A Rails 8 API backend for managing healthcare provider-client relationships and client journal entries. The data model is fully built with validations, associations, and constraints — ready for API endpoint development.

## Data Model

```
Provider ──< ProviderClient >── Client ──< JournalEntry
              (plan: basic|premium)
```

- **Providers** — healthcare professionals (doctors, nurses, etc.)
- **Clients** — patients managed by one or more providers
- **ProviderClients** — many-to-many join with a `plan` enum (`basic` / `premium`)
- **JournalEntries** — timestamped notes on a client (nutrition, exercise, vitals, mental health)

## Prerequisites

- **Ruby 3.4.2** (see `.ruby-version`)
- **Bundler**
- **SQLite3**

## Getting Started

```bash
bundle install
bin/rails db:setup      # creates, migrates, and seeds the database
bin/rails server        # starts on http://localhost:3000
```

The seed data is deterministic and generates 10 providers, 200 clients, ~600 relationships, and ~1,200 journal entries with realistic healthcare content.

## Running Tests

```bash
bin/rails test                              # all tests (22 model tests)
bin/rails test test/models/provider_test.rb # single file
bin/rails test --verbose                    # verbose output
```

Tests cover validations, associations, enum constraints, uniqueness, and query scopes across all four models.

## Project Structure

```
app/models/
  provider.rb            # has_many :clients through :provider_clients
  client.rb              # has_many :providers, :journal_entries
  provider_client.rb     # plan enum with DB check constraint
  journal_entry.rb       # belongs_to :client, .recent scope

db/
  schema.rb              # 4 tables with NOT NULL, unique, and check constraints
  seeds.rb               # deterministic seed data (seed 42)

test/models/             # minitest unit tests for all models
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Rails 8.1 |
| Database | SQLite3 |
| Server | Puma |
| Assets | Propshaft |
| Tests | Minitest |
