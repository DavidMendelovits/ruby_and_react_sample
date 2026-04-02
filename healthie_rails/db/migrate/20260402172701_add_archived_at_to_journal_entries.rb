class AddArchivedAtToJournalEntries < ActiveRecord::Migration[8.1]
  def change
    add_column :journal_entries, :archived_at, :datetime
    add_index :journal_entries, :archived_at
  end
end
