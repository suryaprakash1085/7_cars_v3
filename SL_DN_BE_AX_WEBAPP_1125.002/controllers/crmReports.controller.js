import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function getTelecallerReportToday(req, res) {
  try {
    const today = req.tzHelpers
      ? req.tzHelpers.format(new Date(), "DD-MM-YYYY")
      : `${String(new Date().getUTCDate()).padStart(2, "0")}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}-${new Date().getUTCFullYear()}`;

    let query = knex("customers")
      .select(
        "customer_id",
        "customer_name",
        "telecall",
        "leads_owner",
        "updated_at",
        "phone"
      )
      .whereNotNull("telecall")
      .andWhere("telecall", "!=", "");

    const response = await query;

    const filteredResponse = response
      .map((customer) => {
        const telecallArray = JSON.parse(customer.telecall);
        const filteredTelecalls = telecallArray.filter(
          (call) => call.scheduledDate === today
        );

        if (filteredTelecalls.length > 0) {
          return {
            ...customer,
            telecall: filteredTelecalls,
          };
        }

        return null;
      })
      .filter((customer) => customer !== null);

    res.status(200).json(filteredResponse);
  } catch (error) {
    console.error("Error fetching filtered telecalls:", error);
    res.status(500).json({
      error: "Error fetching filtered telecalls",
      details: error.message,
    });
  }
}

export async function getTelecallerReport(req, res) {
  try {
    const tomorrow = req.tzHelpers?.formatCalendarPlusDays
      ? req.tzHelpers.formatCalendarPlusDays(1, "DD-MM-YYYY")
      : new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
          .toLocaleDateString("en-GB")
          .split("/")
          .join("-");

    let query = knex("customers")
      .select(
        "customer_id",
        "customer_name",
        "telecall",
        "leads_owner",
        "updated_at",
        "phone"
      )
      .whereNotNull("telecall")
      .andWhere("telecall", "!=", "");

    const response = await query;

    const filteredResponse = response
      .map((customer) => {
        const telecallArray = JSON.parse(customer.telecall);
        const filteredTelecalls = telecallArray.filter(
          (call) => call.scheduledDate === tomorrow
        );

        if (filteredTelecalls.length > 0) {
          return {
            ...customer,
            telecall: filteredTelecalls,
          };
        }

        return null;
      })
      .filter((customer) => customer !== null);

    res.status(200).json(filteredResponse);
  } catch (error) {
    console.error("Error fetching telecalls:", error);
    res.status(500).json({
      error: "Error fetching telecalls",
      details: error.message,
    });
  }
}

export async function getTelecallerReportByDate(req, res) {
  try {
    const { start_date, end_date } = req.query;

    const appointments = await knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.customer_id",
        "customers.customer_name",
        "customers.leads_owner",
        "appointments.appointment_date",
        "appointments.telecaller"
      )
      .leftJoin(
        "customers",
        "appointments.customer_id",
        "customers.customer_id"
      )
      .whereBetween("appointments.appointment_date", [start_date, end_date])
      .orderBy("appointments.appointment_date", "desc");

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching telecaller report by date:", error);
    res.status(500).json({
      error: "Error fetching telecaller report by date",
      details: error.message,
    });
  }
}

export async function getConvertedCustomers(req, res) {
  try {
    const { startDate, endDate } = req.query;

    let query = knex("convert_to_customer").select(
      "customer_id",
      "customer_name",
      "leads_owner",
      "convert_date"
    );

    if (startDate && endDate) {
      query = query.whereBetween("convert_date", [startDate, endDate]);
    }

    const convertedCustomers = await query;
    res.status(200).json(convertedCustomers);
  } catch (error) {
    console.error("Error fetching converted customers:", error);
    res.status(500).json({
      error: "Error fetching converted customers",
      details: error.message,
    });
  }
}
