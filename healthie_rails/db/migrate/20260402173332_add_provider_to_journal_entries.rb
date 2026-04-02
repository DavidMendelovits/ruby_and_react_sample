class AddProviderToJournalEntries < ActiveRecord::Migration[8.1]
  def change
    add_reference :journal_entries, :provider, null: false, foreign_key: true
  end
end
