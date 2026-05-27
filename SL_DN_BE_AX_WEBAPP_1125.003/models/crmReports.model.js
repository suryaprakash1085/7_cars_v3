import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function getTelecallerReportByDate(date) {
  return knex("customers")
    .select(
      "customers.customer_id",
      "customers.customer_name",
      "customers.phone",
      "customers.telecall",
      "customers.type"
    )
    .where(knex.raw(`JSON_EXTRACT(customers.telecall, '$[${knex.raw('JSON_LENGTH(customers.telecall) - 1')}].scheduledDate') = ?`, [date]));
}

export async function getLeadsByStatus(status) {
  return knex("customers")
    .where({ type: status })
    .select("*");
}
