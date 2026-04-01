class CreateProviderClients < ActiveRecord::Migration[8.1]
  def change
    create_table :provider_clients do |t|
      t.references :provider, null: false, foreign_key: true
      t.references :client, null: false, foreign_key: true
      t.string :plan, null: false, default: "basic"

      t.timestamps
    end

    add_index :provider_clients, [:provider_id, :client_id], unique: true
  end
end
