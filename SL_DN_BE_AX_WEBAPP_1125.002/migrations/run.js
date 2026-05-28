/**
 * Migration Runner
 *
 * Usage:
 * node migrations/run.js up      - Run all pending migrations
 * node migrations/run.js down    - Rollback last migration
 */

import dotenv from "dotenv";
import * as migration01 from "./01_add_company_code.js";
import * as migration02 from "./02_add_multiple_company_codes.js";
import * as migration03 from "./03_add_company_code_to_number_range.js";
import * as migration04 from "./04_add_purchase_price_to_procurement_items.js";
import * as migration05 from "./05_add_buying_price_to_inventory.js";
import * as migration06 from "./06_add_selling_price_to_procurement_items.js";
import * as migration07 from "./07_add_next_service_km_to_appointments.js";
import * as migration08 from "./08_create_timezone_table.js";
import * as migration09 from "./09_add_gst_conversion_fields.js";

dotenv.config();

const command = process.argv[2];
const migrations = [
  { name: "01_add_company_code", ...migration01 },
  { name: "02_add_multiple_company_codes", ...migration02 },
  { name: "03_add_company_code_to_number_range", ...migration03 },
  { name: "04_add_purchase_price_to_procurement_items", ...migration04 },
  { name: "05_add_buying_price_to_inventory", ...migration05 },
  { name: "06_add_selling_price_to_procurement_items", ...migration06 },
  { name: "07_add_next_service_km_to_appointments", ...migration07 },
  { name: "08_create_timezone_table", ...migration08 },
  { name: "09_add_gst_conversion_fields", ...migration09 },
];

async function runMigration() {
  try {
    if (command === "up") {
      console.log("Running migrations...");
      for (const migration of migrations) {
        console.log(`\nRunning migration: ${migration.name}`);
        await migration.up();
      }
      process.exit(0);
    } else if (command === "down") {
      console.log("Rolling back migrations...");
      // Rollback in reverse order
      for (let i = migrations.length - 1; i >= 0; i--) {
        console.log(`\nRolling back migration: ${migrations[i].name}`);
        await migrations[i].down();
      }
      process.exit(0);
    } else {
      console.log("Usage: node migrations/run.js [up|down]");
      console.log("  up   - Run all pending migrations");
      console.log("  down - Rollback last migration");
      process.exit(1);
    }
  } catch (error) {
    console.error("Migration error:", error);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runMigration();
