/**
 * Migration Script: Add company_code support to number_range table
 * 
 * This migration allows linking company codes with number ranges.
 * Each company can have its own ID number ranges.
 * 
 * Run this migration to enable company-specific number ranges
 */

import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function up() {
  console.log("Running migration: Add company_code to number_range table");

  try {
    // Check if company_code column exists in number_range
    const hasCompanyCode = await knex.schema.hasColumn("number_range", "company_code");
    
    if (!hasCompanyCode) {
      await knex.schema.table("number_range", (table) => {
        table.string("company_code", 50).nullable().after("id");
        table.index("company_code");
      });
      console.log("✓ Added company_code column to number_range");
    } else {
      console.log("✓ company_code column already exists in number_range");
    }

    console.log("✓ Migration completed successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    throw error;
  }
}

export async function down() {
  console.log("Rolling back migration: Remove company_code from number_range");

  try {
    const hasCompanyCode = await knex.schema.hasColumn("number_range", "company_code");
    if (hasCompanyCode) {
      await knex.schema.table("number_range", (table) => {
        table.dropColumn("company_code");
      });
      console.log("✓ Dropped company_code column from number_range");
    }

    console.log("✓ Rollback completed successfully");
  } catch (error) {
    console.error("✗ Rollback failed:", error.message);
    throw error;
  }
}
