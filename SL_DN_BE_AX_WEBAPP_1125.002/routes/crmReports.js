
















import express from "express";
import knexLib from "knex"; // Import the Knex library
import knexConfig from "../knexfile.js"; // Import your Knex configuration
// import authenticateToken from "../middleware/authenticate.js";
// import logChange from "../middleware/changeLog.js";
// import { body, validationResult } from "express-validator";
// import { generateCustomId } from "../helpers/idGenerator.js"; // Import generateCustomId
// import multer from "multer";
// import XLSX from "xlsx";
// import { cleanMessage } from "@whiskeysockets/baileys";
// import ExcelJS from "exceljs";
// // const moment = require("moment"); 


const knex = knexLib(knexConfig); // Initialize Knex with the configuration

const router = express.Router();
router.get("/telecaller/report/today", async (req, res) => {
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

    // Filter each customer's telecall array to include only today's entries
    const filteredResponse = response
      .map((customer) => {
        const telecallArray = JSON.parse(customer.telecall);
        const filteredTelecalls = telecallArray.filter(
          (call) => call.scheduledDate === today
        );

        // Return customer only if there's at least one match for today
        if (filteredTelecalls.length > 0) {
          return {
            ...customer,
            telecall: filteredTelecalls,
          };
        }

        return null;
      })
      .filter((customer) => customer !== null); // Remove null entries

    res.status(200).json(filteredResponse);
  } catch (error) {
    console.error("Error fetching filtered telecalls:", error);
    res.status(500).json({
      error: "Error fetching filtered telecalls",
      details: error.message,
    });
  }
});


router.get("/telecaller/report", async (req, res) => {
  try {
    const tomorrow = req.tzHelpers?.formatCalendarPlusDays
      ? req.tzHelpers.formatCalendarPlusDays(1, "DD-MM-YYYY")
      : (() => {
          const tomorrowDate = new Date();
          tomorrowDate.setDate(tomorrowDate.getDate() + 1);
          return tomorrowDate.toLocaleDateString("en-GB").split("/").join("-");
        })();

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

    // Filter each customer's telecall array to include only tomorrow's entries
    const filteredResponse = response
      .map((customer) => {
        const telecallArray = JSON.parse(customer.telecall);
        const filteredTelecalls = telecallArray.filter(
          (call) => call.scheduledDate === tomorrow
        );

        // Return customer only if there's at least one match for tomorrow
        if (filteredTelecalls.length > 0) {
          return {
            ...customer,
            telecall: filteredTelecalls,
          };
        }

        return null;
      })
      .filter((customer) => customer !== null); // Remove null entries

    res.status(200).json(filteredResponse);
  } catch (error) {
    console.error("Error fetching filtered telecalls:", error);
    res.status(500).json({
      error: "Error fetching filtered telecalls",
      details: error.message,
    });
  }
});

  
  
  
  
  router.get("/telecaller/report/date", async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      console.log("Received query params:", req.query); // Debugging
  
      if (!start_date || !end_date) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
  
      const appointments = await knex("appointments")
        .select(
          "appointments.appointment_id",
          "appointments.customer_id",
          "appointments.appointment_date",
          "customers.customer_name",
          "customers.leads_owner"
        )
        .join("customers", "appointments.customer_id", "customers.customer_id")
        .whereBetween("appointments.appointment_date", [start_date, end_date]);
  

        
      res.json({ success: true, data: appointments || [] }); // Ensure it always returns an array
    } catch (error) {
      console.error("Error fetching telecaller reports:", error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  });
 
  
  // get convert to customer data
  router.get("/converted/customers", async (req, res) => {
    try {
      const { startDate, endDate } = req.query; // Get start & end da
      // te from query params
  
      let query = knex("convert_to_customer")
        .select("customer_id", "customer_name", "leads_owner", "convert_date");
  
      // Apply date filter if startDate and endDate are provided
      if (startDate && endDate) {
        query = query.whereBetween("convert_date", [startDate, endDate]);
      }
  
      const customers = await query;
  
      res.json(customers); // Send filtered data
    } catch (error) {
      console.error("Error fetching converted customers:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  
  
  
  
  
  export default router;
  