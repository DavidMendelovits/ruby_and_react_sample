# Healthie Tech Interview

## Session 1: Rails Data Model

### Setup

```bash
cd healthie_rails

# Requires Ruby 3.x (brew install ruby if needed)
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/3.4.0/bin:$PATH"

bundle install
rails db:migrate
rails db:seed
```

### Run queries in console

```bash
rails console
```

```ruby
# All clients for a given provider
Provider.first.clients

# All providers for a given client
Client.first.providers

# Journal entries for a client, sorted by date
Client.first.journal_entries

# Journal entries across all of a provider's clients
Provider.first.client_journal_entries
```

### Run tests

```bash
rails test
```

### Schema

- **Provider** — name, email (has many clients through provider_clients)
- **Client** — name, email (has many providers through provider_clients, has many journal entries)
- **ProviderClient** — join table with plan enum (basic/premium), unique constraint on [provider_id, client_id]
- **JournalEntry** — body text, belongs to client, default ordered by created_at desc

---

## Session 2: React Kanban Board

### Setup

```bash
cd healthie_kanban
npm install
npm run dev
```

### Features

- Kanban board with To Do, Doing, Done columns
- Rick and Morty character assignment via GraphQL API
- Drag and drop between columns and reorder within columns (dnd-kit)
- Confetti animation when moving items to Done
- Character search with pagination

### Run tests

```bash
npm test
```
