import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function getRevenueByMonth(startDate, endDate) {
  return knex("appointments")
    .select(
      knex.raw("DATE_FORMAT(appointment_date, '%Y-%m') as month"),
      knex.raw("SUM(amount) as revenue")
    )
    .whereBetween("appointment_date", [startDate, endDate])
    .groupByRaw("DATE_FORMAT(appointment_date, '%Y-%m')")
    .orderBy("month", "desc");
}

export async function getRevenueByServiceType(startDate, endDate) {
  return knex("services_actual")
    .join("appointments", "services_actual.appointment_id", "appointments.appointment_id")
    .select(
      "services_actual.service_type",
      knex.raw("DATE_FORMAT(appointments.appointment_date, '%Y-%m') as month"),
      knex.raw("SUM(services_actual.amount) as revenue")
    )
    .whereBetween("appointments.appointment_date", [startDate, endDate])
    .groupBy("services_actual.service_type", knex.raw("DATE_FORMAT(appointments.appointment_date, '%Y-%m')"))
    .orderBy("month", "desc");
}

export async function getNoOfCarsServiced(startDate, endDate) {
  return knex("appointments")
    .select(
      knex.raw("DATE_FORMAT(appointment_date, '%Y-%m') as month"),
      knex.raw("COUNT(DISTINCT customer_id) as cars_serviced")
    )
    .whereBetween("appointment_date", [startDate, endDate])
    .groupByRaw("DATE_FORMAT(appointment_date, '%Y-%m')")
    .orderBy("month", "desc");
}

export async function getAverageTransactionValue(startDate, endDate) {
  return knex("appointments")
    .select(
      knex.raw("DATE_FORMAT(appointment_date, '%Y-%m') as month"),
      knex.raw("AVG(amount) as atv")
    )
    .whereBetween("appointment_date", [startDate, endDate])
    .groupByRaw("DATE_FORMAT(appointment_date, '%Y-%m')")
    .orderBy("month", "desc");
}

export async function getCustomersPerMonth(startDate, endDate) {
  return knex("customers")
    .select(
      knex.raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
      knex.raw("COUNT(*) as new_customers")
    )
    .whereBetween("created_at", [startDate, endDate])
    .groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
    .orderBy("month", "desc");
}

export async function getServicesPerMonth(startDate, endDate) {
  return knex("services_actual")
    .join("appointments", "services_actual.appointment_id", "appointments.appointment_id")
    .select(
      knex.raw("DATE_FORMAT(appointments.appointment_date, '%Y-%m') as month"),
      knex.raw("COUNT(*) as services_count")
    )
    .whereBetween("appointments.appointment_date", [startDate, endDate])
    .groupByRaw("DATE_FORMAT(appointments.appointment_date, '%Y-%m')")
    .orderBy("month", "desc");
}

export async function getVehiclesPerMonth(startDate, endDate) {
  return knex("appointments")
    .select(
      knex.raw("DATE_FORMAT(appointment_date, '%Y-%m') as month"),
      knex.raw("COUNT(DISTINCT vehicle_id) as vehicles_serviced")
    )
    .whereBetween("appointment_date", [startDate, endDate])
    .groupByRaw("DATE_FORMAT(appointment_date, '%Y-%m')")
    .orderBy("month", "desc");
}

export async function getNewCustomersByYear(year) {
  return knex("customers")
    .select(
      knex.raw("MONTH(created_at) as month"),
      knex.raw("COUNT(*) as new_customers")
    )
    .whereRaw("YEAR(created_at) = ?", [year])
    .groupByRaw("MONTH(created_at)")
    .orderBy("month", "asc");
}
