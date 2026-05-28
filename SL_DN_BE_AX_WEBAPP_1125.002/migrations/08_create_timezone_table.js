import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function up() {
  console.log("Running migration: Create timezone table");

  try {
    const hasTable = await knex.schema.hasTable("timezone_settings");
    if (!hasTable) {
      await knex.schema.createTable("timezone_settings", (table) => {
        table.increments("id").primary();
        table.string("timezone_name", 100).notNullable().unique();
        table.string("timezone_code", 50).notNullable().unique();
        table.text("description").nullable();
        table.string("utc_offset", 20).notNullable();
        table.boolean("is_active").defaultTo(true);
        table.timestamps(true, true);
      });
      console.log("✓ Created timezone_settings table");
    } else {
      console.log("✓ timezone_settings table already exists");
    }

    console.log("✓ Migration completed successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    throw error;
  }
}

export async function down() {
  console.log("Rolling back migration: Drop timezone table");

  try {
    const hasTable = await knex.schema.hasTable("timezone_settings");
    if (hasTable) {
      await knex.schema.dropTable("timezone_settings");
      console.log("✓ Dropped timezone_settings table");
    }

    console.log("✓ Rollback completed successfully");
  } catch (error) {
    console.error("✗ Rollback failed:", error.message);
    throw error;
  }
}
