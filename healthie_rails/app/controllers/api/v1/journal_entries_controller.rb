module Api
  module V1
    class JournalEntriesController < BaseController
      before_action :require_client!
      before_action :set_journal_entry, only: [ :archive, :unarchive ]

      # GET /api/v1/journal_entries
      def index
        entries = current_client.journal_entries.active.recent
        render json: entries
      end

      # PATCH /api/v1/journal_entries/:id/archive
      def archive
        if @journal_entry.archived?
          render json: { error: "Already archived" }, status: :unprocessable_entity
          return
        end

        @journal_entry.archive!
        render json: @journal_entry
      end

      # PATCH /api/v1/journal_entries/:id/unarchive
      def unarchive
        unless @journal_entry.archived?
          render json: { error: "Not archived" }, status: :unprocessable_entity
          return
        end

        @journal_entry.unarchive!
        render json: @journal_entry
      end

      private

      def set_journal_entry
        @journal_entry = current_client.journal_entries.find(params[:id])
      end
    end
  end
end
