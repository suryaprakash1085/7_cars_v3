import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

// Add a timeout wrapper for the database operations
const withTimeout = (promise, timeoutMs = 10000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export async function setupUDVTable() {
  try {
    // Test database connection first
    try {
      await withTimeout(knex.raw("SELECT 1"), 5000);
      console.log("✅ Database connection verified");
    } catch (connError) {
      console.warn("⚠️  Database connection issue:", connError.message);
      throw connError;
    }

    const exists = await withTimeout(knex.schema.hasTable("udv_items"), 5000);

    if (!exists) {
      console.log("Creating udv_items table...");

      await withTimeout(
        knex.schema.createTable("udv_items", (table) => {
          table.increments("id").primary();
          table.string("entity", 50).notNullable();
          table.string("file_name", 255).notNullable();
          table.text("data_json").notNullable();
          table.enum("status", ["added", "duplicate", "failed", "updated"]).notNullable().defaultTo("added");
          table.string("failure_reason", 500).nullable();
          table.string("unique_key_hash", 255).nullable();
          table.timestamps(true, true);

          table.index("entity");
          table.index("status");
          table.index("file_name");
          table.index("created_at");
        }),
        5000
      );

      console.log("✅ udv_items table created successfully");
    } else {
      // Check if table needs migration for new status
      const hasUpdatedStatus = await withTimeout(knex.schema.hasColumn("udv_items", "failure_reason"), 5000);
      if (hasUpdatedStatus) {
        console.log("✅ udv_items table already exists and is properly configured");
      }
    }
  } catch (error) {
    console.error("⚠️  Error setting up udv_items table:", error.message);
    // Don't throw - allow server to start without UDV table
    return Promise.resolve();
  } finally {
    // Close the connection
    try {
      await knex.destroy();
    } catch (destroyError) {
      // Silently fail if destroy has issues
    }
  }
}

export default setupUDVTable;
