class JournalEntry < ApplicationRecord
  belongs_to :client

  validates :body, presence: true

  default_scope { order(created_at: :desc) }
end
