# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_02_172701) do
  create_table "clients", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_clients_on_email", unique: true
  end

  create_table "journal_entries", force: :cascade do |t|
    t.datetime "archived_at"
    t.text "body"
    t.integer "client_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["archived_at"], name: "index_journal_entries_on_archived_at"
    t.index ["client_id"], name: "index_journal_entries_on_client_id"
  end

  create_table "provider_clients", force: :cascade do |t|
    t.integer "client_id", null: false
    t.datetime "created_at", null: false
    t.string "plan", default: "basic", null: false
    t.integer "provider_id", null: false
    t.datetime "updated_at", null: false
    t.index ["client_id"], name: "index_provider_clients_on_client_id"
    t.index ["provider_id", "client_id"], name: "index_provider_clients_on_provider_id_and_client_id", unique: true
    t.index ["provider_id"], name: "index_provider_clients_on_provider_id"
    t.check_constraint "plan IN ('basic', 'premium')", name: "chk_provider_clients_plan"
  end

  create_table "providers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_providers_on_email", unique: true
  end

  add_foreign_key "journal_entries", "clients"
  add_foreign_key "provider_clients", "clients"
  add_foreign_key "provider_clients", "providers"
end
