class AddDatabaseConstraints < ActiveRecord::Migration[8.0]
  def change
    change_column_null :providers, :name, false
    change_column_null :providers, :email, false
    change_column_null :clients, :name, false
    change_column_null :clients, :email, false

    add_index :providers, :email, unique: true
    add_index :clients, :email, unique: true

    add_check_constraint :provider_clients, "plan IN ('basic', 'premium')", name: "chk_provider_clients_plan"
  end
end
