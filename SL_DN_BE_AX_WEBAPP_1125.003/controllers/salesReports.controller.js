import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function getRevenue(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const revenue = await knex("appointments")
      .select(
        knex.raw("DATE_FORMAT(invoice_date, '%Y-%m') as month"),
        knex.raw("SUM(invoice_amount) as total")
      )
      .whereBetween("invoice_date", [startDate, endDate])
      .groupBy(knex.raw("DATE_FORMAT(invoice_date, '%Y-%m')"))
      .orderBy("month");

    const xAxis = revenue.map(r => r.month);
    const yAxis = revenue.map(r => r.total);

    res.status(200).json({ xAxis, yAxis });
  } catch (error) {
    res.status(500).json({ error: "Error fetching revenue", details: error.message });
  }
}

export async function getRevenueFullData(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const appointments = await knex("appointments")
      .select(
        "appointment_id",
        "customer_id",
        "plateNumber",
        "invoice_date",
        "invoice_amount",
        "appointment_date"
      )
      .whereBetween("invoice_date", [startDate, endDate])
      .orderBy("invoice_date", "desc");

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Error fetching revenue data", details: error.message });
  }
}

export async function getRevenueByServiceType(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const revenue = await knex("services_actual")
      .select(
        knex.raw("DATE_FORMAT(appointments.invoice_date, '%Y-%m') as month"),
        "services_actual.service_type",
        knex.raw("SUM(services_actual.price) as total")
      )
      .leftJoin("appointments", "services_actual.appointment_id", "appointments.appointment_id")
      .whereBetween("appointments.invoice_date", [startDate, endDate])
      .groupBy(knex.raw("DATE_FORMAT(appointments.invoice_date, '%Y-%m')"), "services_actual.service_type")
      .orderBy("month");

    res.status(200).json(revenue);
  } catch (error) {
    res.status(500).json({ error: "Error fetching revenue by service type", details: error.message });
  }
}

export async function getRevenueByServiceTypeFullData(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const data = await knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.customer_id",
        "appointments.plateNumber",
        "appointments.invoice_date",
        "appointments.invoice_amount",
        "services_actual.service_type"
      )
      .leftJoin("services_actual", "appointments.appointment_id", "services_actual.appointment_id")
      .whereBetween("appointments.invoice_date", [startDate, endDate])
      .orderBy("appointments.invoice_date", "desc");

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data", details: error.message });
  }
}

export async function getNumberOfCarsServiced(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const data = await knex("appointments")
      .select(
        knex.raw("DATE_FORMAT(completed_date, '%Y-%m') as month"),
        knex.raw("COUNT(*) as count")
      )
      .whereBetween("completed_date", [startDate, endDate])
      .andWhere("status", "=", "invoiced")
      .groupBy(knex.raw("DATE_FORMAT(completed_date, '%Y-%m')"))
      .orderBy("month");

    const xAxis = data.map(d => d.month);
    const yAxis = data.map(d => d.count);

    res.status(200).json({ xAxis, yAxis });
  } catch (error) {
    res.status(500).json({ error: "Error fetching cars serviced", details: error.message });
  }
}

export async function getNumberOfCarsServicedFullData(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const appointments = await knex("appointments")
      .select(
        "appointment_id",
        "customer_id",
        "plateNumber",
        "completed_date",
        "status"
      )
      .whereBetween("completed_date", [startDate, endDate])
      .andWhere("status", "=", "invoiced")
      .orderBy("completed_date", "desc");

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Error fetching cars serviced data", details: error.message });
  }
}

export async function getATV(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const data = await knex("appointments")
      .select(
        knex.raw("DATE_FORMAT(invoice_date, '%Y-%m') as month"),
        knex.raw("SUM(invoice_amount) / COUNT(*) as atv")
      )
      .whereBetween("invoice_date", [startDate, endDate])
      .groupBy(knex.raw("DATE_FORMAT(invoice_date, '%Y-%m')"))
      .orderBy("month");

    const xAxis = data.map(d => d.month);
    const yAxis = data.map(d => parseFloat(d.atv));

    res.status(200).json({ xAxis, yAxis });
  } catch (error) {
    res.status(500).json({ error: "Error fetching ATV", details: error.message });
  }
}

export async function getCustomersPerMonth(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const data = await knex("appointments")
      .select(
        knex.raw("DATE_FORMAT(invoice_date, '%Y-%m') as month"),
        knex.raw("COUNT(DISTINCT customer_id) as count")
      )
      .whereBetween("invoice_date", [startDate, endDate])
      .groupBy(knex.raw("DATE_FORMAT(invoice_date, '%Y-%m')"))
      .orderBy("month");

    const xAxis = data.map(d => d.month);
    const yAxis = data.map(d => d.count);

    res.status(200).json({ xAxis, yAxis });
  } catch (error) {
    res.status(500).json({ error: "Error fetching customers per month", details: error.message });
  }
}

export async function getCustomersPerMonthFullData(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const appointments = await knex("appointments")
      .select("appointment_id", "customer_id", "invoice_date")
      .distinct("customer_id")
      .whereBetween("invoice_date", [startDate, endDate])
      .orderBy("invoice_date", "desc");

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Error fetching customers data", details: error.message });
  }
}
