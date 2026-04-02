module Api
  class JournalEntriesController < BaseController
    before_action :set_provider

    def create
      client = Client.find(params[:client_id])
      entry = JournalEntry.new(
        provider: @provider,
        client: client,
        body: params[:body]
      )

      if entry.save
        render json: entry, status: :created
      else
        render json: { errors: entry.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def index
      entries = JournalEntry.where(provider: @provider).recent
      render json: entries
    end

    private

    def set_provider
      @provider = Provider.find(params[:provider_id])
    end
  end
end
