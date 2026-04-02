module Api
  module V1
    module Provider
      class JournalEntriesController < BaseController
        before_action :require_provider!

        # GET /api/v1/provider/journal_entries
        def index
          entries = current_provider.client_journal_entries(include_archived: true)
          render json: entries
        end
      end
    end
  end
end
