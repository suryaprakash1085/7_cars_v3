/**
 * Migration Script: Support multiple company codes per user
 * 
 * This migration updates the company_code column in UsersCollection to support
 * JSON array format (storing multiple company codes instead of just one).
 * 
 * Old format: company_code = '1001'
 * New format: company_code = '["1001", "1002"]'
 * 
 * Run: node migrations/run.js up
 */

import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function up() {
  console.log("Running migration: Add support for multiple company codes");

  try {
    // Step 1: Always check and create company_codes column if it doesn't exist
    const usersHasCompanyCodes = await knex.schema.hasColumn("UsersCollection", "company_codes");

    if (!usersHasCompanyCodes) {
      console.log("Adding company_codes column to UsersCollection...");
      await knex.schema.table("UsersCollection", (table) => {
        table.json("company_codes").nullable().after("user_id");
        table.index("company_codes");
      });
      console.log("✓ Added company_codes column (JSON) to UsersCollection");
    } else {
      console.log("✓ company_codes column already exists in UsersCollection");
    }

    // Step 2: Migrate data from company_code to company_codes if company_code exists
    const usersHasCompanyCode = await knex.schema.hasColumn("UsersCollection", "company_code");
    if (usersHasCompanyCode) {
      console.log("Migrating data from company_code (string) to company_codes (JSON array)...");

      // Get all users with company_code
      const users = await knex('UsersCollection').whereNotNull('company_code');

      // Convert each user's company_code string to an array
      for (const user of users) {
        const companyCodes = user.company_code ? [user.company_code] : [];
        await knex('UsersCollection')
          .where({ user_id: user.user_id })
          .update({ company_codes: JSON.stringify(companyCodes) });
      }

      console.log("✓ Migrated data from company_code to company_codes");
    } else {
      console.log("✓ company_code column does not exist, skipping migration");
    }

    // Step 3: Ensure company_code column exists in appointments table
    const appointmentsHasCompanyCode = await knex.schema.hasColumn("appointments", "company_code");
    if (!appointmentsHasCompanyCode) {
      await knex.schema.table("appointments", (table) => {
        table.string("company_code", 50).nullable().after("appointment_id");
        table.index("company_code");
      });
      console.log("✓ Added company_code column to appointments");
    } else {
      console.log("✓ company_code column already exists in appointments");
    }

    console.log("✓ Migration completed successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    throw error;
  }
}

export async function down() {
  console.log("Rolling back migration: Remove multiple company codes support");

  try {
    const usersHasCompanyCodes = await knex.schema.hasColumn("UsersCollection", "company_codes");
    if (usersHasCompanyCodes) {
      await knex.schema.table("UsersCollection", (table) => {
        table.dropColumn("company_codes");
      });
      console.log("✓ Dropped company_codes column from UsersCollection");
    }

    console.log("✓ Rollback completed successfully");
  } catch (error) {
    console.error("✗ Rollback failed:", error.message);
    throw error;
  }
}
