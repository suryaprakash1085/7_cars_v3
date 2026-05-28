import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function getTelecallerReportByDate(date) {
  return knex("customers")
    .select(
      "customers.customer_id",
      "customers.customer_name",
      "customers.phone",
      "customers.telecall"
    )
    .where(knex.raw(`JSON_EXTRACT(customers.telecall, '$[${knex.raw('JSON_LENGTH(customers.telecall) - 1')}].scheduledDate') = ?`, [date]));
}

export async function getAppointmentsByDateRange(startDate, endDate) {
  return knex("appointments")
    .join("customers", "appointments.customer_id", "customers.customer_id")
    .select("appointments.*", "customers.customer_name", "customers.phone")
    .whereBetween("appointments.appointment_date", [startDate, endDate]);
}

export async function getConvertedCustomers(startDate, endDate) {
  let query = knex("convert_to_customer").select("*");
  if (startDate && endDate) {
    query = query.whereBetween("convert_date", [startDate, endDate]);
  }
  return query;
}
