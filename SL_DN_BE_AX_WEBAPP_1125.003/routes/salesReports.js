import express from "express";
import knexLib from "knex"; // Import the Knex library
import knexConfig from "../knexfile.js"; // Import your Knex configuration
import authenticateToken from "../middleware/authenticate.js";

const knex = knexLib(knexConfig); // Initialize Knex with the configuration

const router = express.Router();

// Get the sum of Revenue(Invoice_Amount) by month of a specified year
router.get("/revenue", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        knex.raw("DATE_FORMAT(Invoice_Date, '%Y-%m') AS xAxis"),
        knex.raw("SUM(Invoice_Amount) AS yAxis")
      )
      .whereRaw("DATE_FORMAT(Invoice_Date, '%Y-%m') BETWEEN ? AND ?", [
        startDate,
        endDate,
      ])
      .groupByRaw("DATE_FORMAT(Invoice_Date, '%Y-%m')")
      .orderByRaw("xAxis");

    res.json(results);
  } catch (error) {
    console.error("Error fetching invoice data:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching invoice data." });
  }
});

router.get("/revenue/fullData", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        "appointment_id",
        "customer_id",
        "plateNumber",
        "Invoice_Date",
        "Invoice_Amount",
        knex.raw(
          "DATE_FORMAT(appointment_date, '%Y-%m-%d') AS appointment_date"
        )
      )
      .whereRaw("DATE_FORMAT(appointment_date, '%Y-%m-%d') BETWEEN ? AND ?", [
        startDate,
        endDate,
      ])
      .groupBy(
        "appointment_id",
        "customer_id",
        "plateNumber",
        "appointment_date",
        "Invoice_Date",
        "Invoice_Amount"
      )
      .orderBy("appointment_date");

    res.json(results);
  } catch (error) {
    console.error("Error fetching invoice data:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching invoice data." });
  }
});

// Revenue by service type
router.get("/revenueByServiceType", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .join(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id"
      )
      .select(
        knex.raw("DATE_FORMAT(appointments.Invoice_Date, '%Y-%m') AS month"),
        "services_actual.service_type", // Include service type
        knex.raw("SUM(services_actual.price) AS total_price") // Sum the prices
      )
      .whereRaw(
        "DATE_FORMAT(appointments.Invoice_Date, '%Y-%m') BETWEEN ? AND ?",
        [startDate, endDate]
      )
      .groupByRaw(
        "DATE_FORMAT(appointments.Invoice_Date, '%Y-%m'), services_actual.service_type"
      )
      .orderByRaw("month, services_actual.service_type");

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

router.get("/revenueByServiceType/fullData", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .join(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id"
      )
      .select(
        "appointments.appointment_id",
        "appointments.customer_id",
        "appointments.plateNumber",
        knex.raw(
          "DATE_FORMAT(appointments.appointment_date, '%Y-%m-%d') AS appointment_date"
        ),
        "services_actual.service_type" // Include service type
      )
      .whereRaw(
        "DATE_FORMAT(appointments.appointment_date, '%Y-%m-%d') BETWEEN ? AND ?",
        [startDate, endDate]
      )
      .groupBy(
        "appointments.appointment_id",
        "appointments.customer_id",
        "appointments.plateNumber",
        "appointment_date",
        "services_actual.service_type"
      )
      .orderBy("appointment_date", "services_actual.service_type");

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

// Get the total number of cars serviced
router.get("/noOfCarsServiced", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        knex.raw(
          "DATE_FORMAT(STR_TO_DATE(completed_date, '%d/%m/%y'), '%Y-%m') AS xAxis"
        ), // Convert to valid DATE and format
        knex.raw(
          "COUNT(CASE WHEN TRIM(LOWER(status)) = 'invoice' THEN 1 END) AS yAxis"
        )
      )
      .whereRaw(
        "DATE_FORMAT(STR_TO_DATE(completed_date, '%d/%m/%y'), '%Y-%m') BETWEEN ? AND ?",
        [startDate, endDate]
      ) // Filter by year-month range
      .groupByRaw(
        "DATE_FORMAT(STR_TO_DATE(completed_date, '%d/%m/%y'), '%Y-%m')"
      ) // Group by year-month
      .orderByRaw("xAxis");

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

router.get("/noOfCarsServiced/fullData", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        "appointment_id",
        "customer_id",
        "plateNumber",
        knex.raw(
          "DATE_FORMAT(STR_TO_DATE(completed_date, '%d/%m/%y'), '%Y-%m-%d') AS appointment_date"
        )
      )
      .whereRaw(
        "DATE_FORMAT(STR_TO_DATE(completed_date, '%d/%m/%y'), '%Y-%m-%d') BETWEEN ? AND ?",
        [startDate, endDate]
      ) // Filter by date range
      .groupBy(
        "appointment_id",
        "customer_id",
        "plateNumber",
        "appointment_date"
      ) // Group by appointment details
      .orderBy("appointment_date");

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

// Get the Average Transaction Value (ATV)
router.get("/atv", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        knex.raw("DATE_FORMAT(Invoice_Date, '%Y-%m') AS month"),
        knex.raw("SUM(Invoice_Amount) AS total_invoice_amount"),
        knex.raw("COUNT(*) AS total_appointments"),
        knex.raw("SUM(Invoice_Amount) / COUNT(*) AS average_invoice_amount")
      )
      .whereRaw("DATE_FORMAT(Invoice_Date, '%Y-%m') BETWEEN ? AND ?", [
        startDate,
        endDate,
      ])
      .groupByRaw("DATE_FORMAT(Invoice_Date, '%Y-%m')")
      .orderByRaw("month");

    // console.log({ atv: results });

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

// Get the total number of customers serviced by month
router.get("/customersPerMonth", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        knex.raw("DATE_FORMAT(Invoice_Date, '%Y-%m') AS xAxis"), // Format Invoice_Date to 'YYYY-MM'
        knex.raw("COUNT(DISTINCT customer_id) AS yAxis") // Count unique customer IDs
      )
      .whereRaw("DATE_FORMAT(Invoice_Date, '%Y-%m') BETWEEN ? AND ?", [
        startDate,
        endDate,
      ]) // Filter by the date range
      .groupByRaw("DATE_FORMAT(Invoice_Date, '%Y-%m')") // Group by 'YYYY-MM'
      .orderByRaw("xAxis"); // Order by month

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

router.get("/customersPerMonth/fullData", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        "appointment_id",
        "customer_id",
        "plateNumber",
        knex.raw(
          "DATE_FORMAT(appointment_date, '%Y-%m-%d') AS appointment_date"
        )
      )
      .whereRaw("DATE_FORMAT(appointment_date, '%Y-%m-%d') BETWEEN ? AND ?", [
        startDate,
        endDate,
      ]) // Filter by the date range
      .orderBy("appointment_date"); // Order by appointment date

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

// Get the total number of vehicles serviced by month
router.get("/vehiclesPerMonth", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        knex.raw(
          "DATE_FORMAT(STR_TO_DATE(Invoice_Date, '%d/%m/%Y'), '%Y-%m') AS month"
        ), // Format Invoice_Date to 'YYYY-MM'
        knex.raw("COUNT(DISTINCT vehicle_id) AS vehicles_served") // Count distinct vehicle IDs
      )
      .whereRaw(
        "DATE_FORMAT(STR_TO_DATE(Invoice_Date, '%d/%m/%Y'), '%Y-%m') BETWEEN ? AND ?",
        [startDate, endDate]
      ) // Filter by start and end date
      .groupByRaw("DATE_FORMAT(STR_TO_DATE(Invoice_Date, '%d/%m/%Y'), '%Y-%m')") // Group by month
      .orderByRaw("month"); // Order by month

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

router.get("/vehiclesPerMonth/fullData", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        "appointment_id",
        "customer_id",
        "plateNumber",
        knex.raw(
          "DATE_FORMAT(STR_TO_DATE(appointment_date, '%d/%m/%Y'), '%Y-%m-%d') AS appointment_date"
        )
      )
      .whereRaw(
        "DATE_FORMAT(STR_TO_DATE(appointment_date, '%d/%m/%Y'), '%Y-%m-%d') BETWEEN ? AND ?",
        [startDate, endDate]
      ) // Filter by start and end date
      .groupBy(
        "appointment_id",
        "customer_id",
        "plateNumber",
        "appointment_date"
      ) // Group by appointment details
      .orderBy("appointment_date"); // Order by date

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

// Get the total number each services based on service_type by month
router.get("/servicesPerMonth", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .join(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id"
      )
      .select(
        knex.raw("DATE_FORMAT(appointments.Invoice_Date, '%Y-%m') AS month"), // Format directly if it's already a DATE
        "services_actual.service_type", // Include servicevc type
        knex.raw("COUNT(*) AS total_services") // Count total services per type
      )
      .whereRaw(
        "DATE_FORMAT(appointments.Invoice_Date, '%Y-%m') BETWEEN ? AND ?",
        [startDate, endDate]
      ) // Filter by start and end date
      .groupByRaw(
        "DATE_FORMAT(appointments.Invoice_Date, '%Y-%m'), services_actual.service_type"
      ) // Group by month and service type
      .orderByRaw("month, services_actual.service_type");

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

router.get("/servicesPerMonth/fullData", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  console.log({ servicesPerMonth: startDate, endDate });

  try {
    const results = await knex("appointments")
      .join(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id"
      )
      .select(
        "appointments.appointment_id",
        "appointments.customer_id",
        "appointments.plateNumber",
        knex.raw(
          "DATE_FORMAT(appointments.appointment_date, '%Y-%m-%d') AS appointment_date"
        ),
        "services_actual.service_type" // Include service type
      )
      .whereRaw(
        "DATE_FORMAT(appointments.appointment_date, '%Y-%m-%d') BETWEEN ? AND ?",
        [startDate, endDate]
      ) // Filter by start and end date
      .groupBy(
        "appointments.appointment_id",
        "appointments.customer_id",
        "appointments.plateNumber",
        "appointment_date",
        "services_actual.service_type"
      ) // Group by appointment details and service type
      .orderBy("appointment_date", "services_actual.service_type");

    res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

// Get the total number of New Customers by year
router.get("/newCustomersByYear", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        knex.raw("DATE_FORMAT(Invoice_Date, '%Y-%m') AS xAxis"), // Format Invoice_Date directly
        knex.raw("COUNT(DISTINCT customer_id) AS yAxis") // Count distinct customers
      )
      .whereRaw("DATE_FORMAT(Invoice_Date, '%Y-%m') BETWEEN ? AND ?", [
        startDate,
        endDate,
      ]) // Filter by start and end date
      .andWhereRaw(
        `Invoice_Date = (
      SELECT MIN(Invoice_Date)
      FROM appointments AS sub
      WHERE sub.customer_id = appointments.customer_id
    )`
      ) // Only consider the first appointment per customer
      .groupByRaw("DATE_FORMAT(Invoice_Date, '%Y-%m')") // Group by month
      .orderByRaw("xAxis"); // Order by month

    res.json(results);
  } catch (error) {
    console.error("Error fetching monthly split-up of new customers:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

router.get("/newCustomersByYear/fullData", async (req, res) => {
  let startDate = req.query.startDate;
  let endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        "appointment_id",
        "customer_id",
        "plateNumber",
        knex.raw(
          "DATE_FORMAT(appointment_date, '%Y-%m-%d') AS appointment_date"
        )
      )
      .whereRaw("DATE_FORMAT(appointment_date, '%Y-%m-%d') BETWEEN ? AND ?", [
        startDate,
        endDate,
      ]) // Filter by start and end date
      .andWhereRaw(
        `appointment_date = (
          SELECT MIN(appointment_date)
          FROM appointments AS sub
          WHERE sub.customer_id = appointments.customer_id
        )`
      ) // Only consider the first appointment per customer
      .groupBy(
        "appointment_id",
        "customer_id",
        "plateNumber",
        "appointment_date"
      ) // Group by appointment details
      .orderBy("appointment_date"); // Order by date

    res.json(results);
  } catch (error) {
    console.error("Error fetching monthly split-up of new customers:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

// Get the performance score
router.get("/performanceScore", async (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  try {
    const results = await knex("appointments")
      .select(
        knex.raw("DATE_FORMAT(Invoice_Date, '%Y-%m') AS xAxis"), // Format Invoice_Date directly
        knex.raw("COUNT(DISTINCT customer_id) AS yAxis"), // Count distinct customers
        knex.raw("GROUP_CONCAT(feedback SEPARATOR ', ') AS feedbackData") // Concatenate feedback
      )
      .whereRaw("DATE_FORMAT(Invoice_Date, '%Y-%m') BETWEEN ? AND ?", [
        startDate,
        endDate,
      ])
      .groupByRaw("DATE_FORMAT(Invoice_Date, '%Y-%m')") // Group by month
      .orderByRaw("xAxis"); // Order by month

    // Process feedbackData for each result
    const processedResults = results.map((row) => {
      // Parse the concatenated feedback data
      const feedbackArrays = JSON.parse(`[${row.feedbackData}]`);
      // Extract the last object of each array where callStatus is "Attended"
      const attendedFeedback = feedbackArrays
        .map((array) => {
          const attendedObjects = array.filter(
            (item) => item.callStatus === "Attended"
          );
          return attendedObjects.length > 0
            ? attendedObjects[attendedObjects.length - 1]
            : null;
        })
        .filter((item) => item !== null); // Remove null values

      // Calculate the count of callFeedback >= 4
      const highestRatingCount = attendedFeedback.filter(
        (item) => item.callFeedback >= 4
      ).length;

      const lowestRatingsCount = attendedFeedback.filter(
        (item) => item.callFeedback <= 2
      ).length;

      // Calculate the ratio
      const totalFeedbackCount = attendedFeedback.length;
      const performanceScore =
        totalFeedbackCount > 0
          ? Math.round((highestRatingCount / totalFeedbackCount) * 100)
          : 0;

      // Return the row with processed data
      return {
        xAxis: row.xAxis,
        yAxis: row.yAxis,
        performanceScore,
        totalFeedbackCount,
        highestRatingCount,
        lowestRatingsCount,
      };
    });

    res.json(processedResults);
  } catch (error) {
    console.error("Error fetching performance score:", error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

// button routres

router.get("/customersbydate", async (req, res) => {
  // console.log("customersbydate", req.query);
  let { startDate, endDate } = req.query;

  // Handle cases where the dates are "undefined" as strings
  if (startDate === "undefined") startDate = null;
  if (endDate === "undefined") endDate = null;

  // If both startDate and endDate are missing, fetch all customers
  if (!startDate && !endDate) {
    try {
      const results = await knex("customers").select("*");
      return res.json(results);
    } catch (error) {
      console.error("Error fetching data:", error);
      return res
        .status(500)
        .json({ error: "An error occurred while fetching data." });
    }
  }

  // Function to convert dates
  function convertDate(inputDate) {
    if (!inputDate) return null; // Return null if inputDate is undefined or empty

    // Parse the inputDate, assuming the input format is "YYYY-MM" (e.g. "2025-01")
    const [year, month] = inputDate.split("-");

    // Ensure the year and month are valid
    if (!year || !month || month < 1 || month > 12) {
      throw new Error("Invalid month input");
    }

    // Convert month to 0-based (January is 1, December is 12)
    const validMonth = month - 1;

    // Create a new Date object for the last day of the given month
    const date = new Date(year, validMonth + 1, 0); // `0` gives us the last day of the previous month

    // Check if the date object is valid
    if (isNaN(date)) {
      throw new Error("Invalid date input");
    }

    // Format the date as ISO string (without time)
    return date.toISOString().split("T")[0]; // Returns "2025-01-31"
  }

  try {
    // Convert start and end dates if available
    let start = startDate ? convertDate(startDate) : null;
    let end = endDate ? convertDate(endDate) : null;

    // Build query
    const query = knex("customers").select("*");

    // Apply date filters if necessary
    if (start && end) {
      query.whereBetween("created_at", [start, end]);
    } else if (start) {
      query.where("created_at", ">=", start);
    } else if (end) {
      query.where("created_at", "<=", end);
    }

    const results = await query;
    return res.json(results);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching data." });
  }
});

export default router;
