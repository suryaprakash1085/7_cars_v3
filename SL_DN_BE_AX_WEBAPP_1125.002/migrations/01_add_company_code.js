/**
 * Migration Script: Add company_code support to users and appointments tables
 * 
 * This script adds the necessary columns to support company code-based access control
 * for appointments.
 * 
 * Run this before deploying the changes:
 * node migrations/run.js
 */

import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function up() {
  console.log("Running migration: Add company_code to users and appointments");

  try {
    // Check if company_code column exists in UsersCollection
    const usersHasCompanyCode = await knex.schema.hasColumn("UsersCollection", "company_code");
    if (!usersHasCompanyCode) {
      await knex.schema.table("UsersCollection", (table) => {
        table.string("company_code", 50).nullable().after("user_id");
        table.index("company_code");
      });
      console.log("✓ Added company_code column to UsersCollection");
    } else {
      console.log("✓ company_code column already exists in UsersCollection");
    }

    // Check if company_code column exists in appointments
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
  console.log("Rolling back migration: Remove company_code columns");

  try {
    // Drop company_code from UsersCollection
    const usersHasCompanyCode = await knex.schema.hasColumn("UsersCollection", "company_code");
    if (usersHasCompanyCode) {
      await knex.schema.table("UsersCollection", (table) => {
        table.dropColumn("company_code");
      });
      console.log("✓ Dropped company_code column from UsersCollection");
    }

    // Drop company_code from appointments
    const appointmentsHasCompanyCode = await knex.schema.hasColumn("appointments", "company_code");
    if (appointmentsHasCompanyCode) {
      await knex.schema.table("appointments", (table) => {
        table.dropColumn("company_code");
      });
      console.log("✓ Dropped company_code column from appointments");
    }

    console.log("✓ Rollback completed successfully");
  } catch (error) {
    console.error("✗ Rollback failed:", error.message);
    throw error;
  }
}
