class JournalEntry < ApplicationRecord
  belongs_to :client

  validates :body, presence: true

  scope :recent, -> { order(created_at: :desc) }
end
