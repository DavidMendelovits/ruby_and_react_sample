class ProviderClient < ApplicationRecord
  belongs_to :provider
  belongs_to :client

  enum :plan, { basic: "basic", premium: "premium" }

  validates :plan, presence: true
  validates :provider_id, uniqueness: { scope: :client_id, message: "already has this client" }
end
