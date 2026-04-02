module Api
  module V1
    class BaseController < ActionController::API
      rescue_from ActiveRecord::RecordNotFound, with: :not_found

      private

      def current_client
        @current_client ||= ::Client.find_by(id: request.headers["X-Client-Id"])
      end

      def current_provider
        @current_provider ||= ::Provider.find_by(id: request.headers["X-Provider-Id"])
      end

      def not_found
        render json: { error: "Not found" }, status: :not_found
      end

      def require_client!
        render json: { error: "Client authentication required" }, status: :unauthorized unless current_client
      end

      def require_provider!
        render json: { error: "Provider authentication required" }, status: :unauthorized unless current_provider
      end
    end
  end
end
