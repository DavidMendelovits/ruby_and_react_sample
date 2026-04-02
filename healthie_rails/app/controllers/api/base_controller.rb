module Api
  class BaseController < ActionController::API
    rescue_from ActiveRecord::RecordNotFound, with: :not_found

    private

    def not_found
      render json: { errors: ["Record not found"] }, status: :not_found
    end
  end
end
