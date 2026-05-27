/**
 * Migration Script: Add purchase_price column to procurement_items
 * 
 * This script adds the purchase_price column to the procurement_items table
 * to store the cost price of items during goods receipt.
 * 
 * Run this before deploying the changes:
 * node migrations/run.js
 */

import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function up() {
  console.log("Running migration: Add purchase_price to procurement_items");

  try {
    // Check if purchase_price column exists in procurement_items
    const hasPurchasePrice = await knex.schema.hasColumn("procurement_items", "purchase_price");
    if (!hasPurchasePrice) {
      await knex.schema.table("procurement_items", (table) => {
        table.decimal("purchase_price", 12, 2).nullable().defaultTo(null);
      });
      console.log("✓ Added purchase_price column to procurement_items");
    } else {
      console.log("✓ purchase_price column already exists in procurement_items");
    }

    console.log("✓ Migration completed successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    throw error;
  }
}

export async function down() {
  console.log("Rolling back migration: Remove purchase_price column");

  try {
    // Drop purchase_price from procurement_items
    const hasPurchasePrice = await knex.schema.hasColumn("procurement_items", "purchase_price");
    if (hasPurchasePrice) {
      await knex.schema.table("procurement_items", (table) => {
        table.dropColumn("purchase_price");
      });
      console.log("✓ Dropped purchase_price column from procurement_items");
    }

    console.log("✓ Rollback completed successfully");
  } catch (error) {
    console.error("✗ Rollback failed:", error.message);
    throw error;
  }
}
