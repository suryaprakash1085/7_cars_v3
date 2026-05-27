/**
 * Migration Script: Add selling_price column to procurement_items
 * 
 * This script adds the selling_price column to the procurement_items table
 * to store the selling price of items during goods receipt.
 * 
 * Run this before deploying the changes:
 * node migrations/run.js
 */

import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function up() {
  console.log("Running migration: Add selling_price to procurement_items");

  try {
    // Check if selling_price column exists in procurement_items
    const hasSellingPrice = await knex.schema.hasColumn("procurement_items", "selling_price");
    if (!hasSellingPrice) {
      await knex.schema.table("procurement_items", (table) => {
        table.decimal("selling_price", 12, 2).nullable().defaultTo(null);
      });
      console.log("✓ Added selling_price column to procurement_items");
    } else {
      console.log("✓ selling_price column already exists in procurement_items");
    }

    console.log("✓ Migration completed successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    throw error;
  }
}

export async function down() {
  console.log("Rolling back migration: Remove selling_price column");

  try {
    // Drop selling_price from procurement_items
    const hasSellingPrice = await knex.schema.hasColumn("procurement_items", "selling_price");
    if (hasSellingPrice) {
      await knex.schema.table("procurement_items", (table) => {
        table.dropColumn("selling_price");
      });
      console.log("✓ Dropped selling_price column from procurement_items");
    }

    console.log("✓ Rollback completed successfully");
  } catch (error) {
    console.error("✗ Rollback failed:", error.message);
    throw error;
  }
}
