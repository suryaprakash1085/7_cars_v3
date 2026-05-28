/**
 * Migration Script: Add next_service_km column to appointments
 *
 * This script adds the next_service_km column to the appointments table
 * to store the next service kilometer value for PDF generation.
 *
 * Run this before deploying the changes:
 * node migrations/run.js
 */

import dotenv from "dotenv";
import knexLib from "knex";
import knexConfig from "../knexfile.js";
import { fileURLToPath } from "url";

dotenv.config();

const knex = knexLib(knexConfig);

export async function up() {
    console.log("Running migration: Add next_service_km to appointments");

    try {
        // Check if next_service_km column exists in appointments
        const hasNextServiceKm = await knex.schema.hasColumn("appointments", "next_service_km");
        if (!hasNextServiceKm) {
            await knex.schema.table("appointments", (table) => {
                table.integer("next_service_km").nullable().defaultTo(null);
            });
            console.log("  Added next_service_km column to appointments");
        } else {
            console.log("  next_service_km column already exists in appointments");
        }

        console.log("  Migration completed successfully");
    } catch (error) {
        console.error("❌ Migration failed:", error.message);
        throw error;
    }
}

export async function down() {
    console.log("Rolling back migration: Remove next_service_km column");

    try {
        // Drop next_service_km from appointments
        const hasNextServiceKm = await knex.schema.hasColumn("appointments", "next_service_km");
        if (hasNextServiceKm) {
            await knex.schema.table("appointments", (table) => {
                table.dropColumn("next_service_km");
            });
            console.log("  Dropped next_service_km column from appointments");
        }

        console.log("  Rollback completed successfully");
    } catch (error) {
        console.error("❌ Rollback failed:", error.message);
        throw error;
    }
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
    up()
        .then(() => {
            console.log("Migration executed directly.");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Direct migration execution failed:", error);
            process.exit(1);
        });
}