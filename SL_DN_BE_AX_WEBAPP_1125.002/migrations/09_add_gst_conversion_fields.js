import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function up() {
  console.log("Running migration: Add GST conversion fields to appointments");

  try {
    const hasColumn1 = await knex.schema.hasColumn("appointments", "is_gst_converted");
    const hasColumn2 = await knex.schema.hasColumn("appointments", "gst_conversion_date");
    const hasColumn3 = await knex.schema.hasColumn("items_required", "item_gst_percent");
    const hasColumn4 = await knex.schema.hasColumn("items_required", "item_gst_amount");
    const hasColumn5 = await knex.schema.hasColumn("services_actual", "labour_gst_percent");
    const hasColumn6 = await knex.schema.hasColumn("services_actual", "labour_gst_amount");

    if (!hasColumn1) {
      await knex.schema.table("appointments", (table) => {
        table.boolean("is_gst_converted").defaultTo(false).nullable();
      });
      console.log("✓ Added is_gst_converted column to appointments");
    }

    if (!hasColumn2) {
      await knex.schema.table("appointments", (table) => {
        table.date("gst_conversion_date").nullable();
      });
      console.log("✓ Added gst_conversion_date column to appointments");
    }

    if (!hasColumn3) {
      await knex.schema.table("items_required", (table) => {
        table.decimal("item_gst_percent", 5, 2).defaultTo(0).nullable();
      });
      console.log("✓ Added item_gst_percent column to items_required");
    }

    if (!hasColumn4) {
      await knex.schema.table("items_required", (table) => {
        table.decimal("item_gst_amount", 12, 2).defaultTo(0).nullable();
      });
      console.log("✓ Added item_gst_amount column to items_required");
    }

    if (!hasColumn5) {
      await knex.schema.table("services_actual", (table) => {
        table.decimal("labour_gst_percent", 5, 2).defaultTo(0).nullable();
      });
      console.log("✓ Added labour_gst_percent column to services_actual");
    }

    if (!hasColumn6) {
      await knex.schema.table("services_actual", (table) => {
        table.decimal("labour_gst_amount", 12, 2).defaultTo(0).nullable();
      });
      console.log("✓ Added labour_gst_amount column to services_actual");
    }

    console.log("✓ Migration completed successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    throw error;
  }
}

export async function down() {
  console.log("Rolling back migration: Remove GST conversion fields from appointments");

  try {
    await knex.schema.table("appointments", (table) => {
      table.dropColumnIfExists("is_gst_converted");
      table.dropColumnIfExists("gst_conversion_date");
    });
    console.log("✓ Dropped GST columns from appointments");

    await knex.schema.table("items_required", (table) => {
      table.dropColumnIfExists("item_gst_percent");
      table.dropColumnIfExists("item_gst_amount");
    });
    console.log("✓ Dropped GST columns from items_required");

    await knex.schema.table("services_actual", (table) => {
      table.dropColumnIfExists("labour_gst_percent");
      table.dropColumnIfExists("labour_gst_amount");
    });
    console.log("✓ Dropped GST columns from services_actual");

    console.log("✓ Rollback completed successfully");
  } catch (error) {
    console.error("✗ Rollback failed:", error.message);
    throw error;
  }
}
