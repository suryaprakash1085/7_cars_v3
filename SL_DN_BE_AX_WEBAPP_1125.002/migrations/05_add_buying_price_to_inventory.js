/**
 * Migration Script: Add buying_price to inventory table
 * 
 * This script adds the buying_price column to track the cost price of inventory items.
 * 
 * Run this before deploying the changes:
 * node migrations/run.js
 */

import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function up() {
  console.log("Running migration: Add buying_price to inventory");

  try {
    const hasColumn = await knex.schema.hasColumn("inventory", "buying_price");
    if (!hasColumn) {
      await knex.schema.table("inventory", (table) => {
        table.decimal("buying_price", 10, 2).nullable().defaultTo(0);
      });
      console.log("✓ Added buying_price column to inventory");
    } else {
      console.log("✓ buying_price column already exists in inventory");
    }
    console.log("✓ Migration completed successfully");
  } catch (error) {
    console.error("Error during migration:", error.message);
    throw error;
  }
}

export async function down() {
  console.log("Rolling back migration: Add buying_price to inventory");

  try {
    const hasColumn = await knex.schema.hasColumn("inventory", "buying_price");
    if (hasColumn) {
      await knex.schema.table("inventory", (table) => {
        table.dropColumn("buying_price");
      });
      console.log("✓ Removed buying_price column from inventory");
    }
    console.log("✓ Rollback completed successfully");
  } catch (error) {
    console.error("Error during rollback:", error.message);
    throw error;
  }
}
