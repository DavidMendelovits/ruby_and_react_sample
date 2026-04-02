class JournalEntry < ApplicationRecord
  BASIC_MONTHLY_LIMIT = 10

  belongs_to :client
  belongs_to :provider

  validates :body, presence: true
  validate :within_plan_limit, on: :create

  scope :recent, -> { order(created_at: :desc) }

  private

  def within_plan_limit
    return if provider.blank? || client.blank?

    provider_client = ProviderClient.find_by(provider: provider, client: client)

    if provider_client.nil?
      errors.add(:base, "Provider is not associated with this client")
      return
    end

    return if provider_client.premium?

    count = JournalEntry.where(
      client_id: client_id,
      provider_id: provider_id,
      created_at: Time.current.beginning_of_month..
    ).count

    if count >= BASIC_MONTHLY_LIMIT
      errors.add(:base, "Basic plan limit of #{BASIC_MONTHLY_LIMIT} journal entries per month reached")
    end
  end
end
