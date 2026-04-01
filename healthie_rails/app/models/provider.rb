class Provider < ApplicationRecord
  has_many :provider_clients, dependent: :destroy
  has_many :clients, through: :provider_clients

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

  def client_journal_entries
    JournalEntry.joins(client: :provider_clients)
                .where(provider_clients: { provider_id: id })
                .order(created_at: :desc)
  end
end
