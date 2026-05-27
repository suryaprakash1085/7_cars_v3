import knexLib from "knex";
import knexConfig from "../knexfile.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  generateServiceId,
  generateAppointmentId,
  generateInvoiceId,
  generateCustomId, generateGstInvoiceId,
} from "../utils/idGenerator.js";
import { v4 as uuidv4 } from "uuid";
import logChange from "../middleware/changeLog.js";
import logDownload from "../middleware/downloadLog.js";
import {
  getCompanyCodeFromRequest,
  validateAppointmentCompanyCode,
  enrichAppointmentData,
} from "../utils/appointmentHelper.js";

const knex = knexLib(knexConfig);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to safely parse mechanic_id
const parseMechanicId = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch (e) {
      // If JSON parse fails, treat as a single mechanic ID
      return [value];
    }
  }
  return [];
};

/** Calendar "today" as dd/mm/yy in app timezone (matches legacy string shape for completed/released/inspection dates). */
const getFormattedTodayInAppTimezone = (req) => {
  if (req.tzHelpers) {
    const s = req.tzHelpers.format(new Date(), "DD/MM/YYYY");
    const [dd, mm, yyyy] = s.split("/");
    if (dd && mm && yyyy) {
      return `${dd}/${mm}/${yyyy.slice(-2)}`;
    }
  }
  const d = new Date();
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const parseSalesId = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch (e) {
      // If JSON parse fails, treat as a single sales ID
      return [value];
    }
  }
  return [];
};

export async function createAppointment(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const companyCode = getCompanyCodeFromRequest(req);

  try {
    // Validate company_code is provided
    if (!companyCode) {
      return res.status(400).json({
        error: "company_code is mandatory for creating appointments",
        hint: "Provide company_code in request body, query parameter, or x-company-code header",
      });
    }

    const { vehicle_id } = req.body;

    const customerId = await knex("vehicles")
      .where("vehicle_id", vehicle_id)
      .select("customer_id");

    console.log({ GottheID: customerId });

    await knex("customers")
      .where("customer_id", customerId[0].customer_id)
      .update({ type: "Customer Service" });

    // Validate that vehicle_id exists and belongs to a customer
    if (!vehicle_id) {
      return res.status(400).json({
        error: "vehicle_id is mandatory for creating appointments",
      });
    }

    if (!customerId || customerId.length === 0) {
      return res.status(404).json({
        error: "Vehicle not found. Please ensure the vehicle_id is valid.",
      });
    }

    const customerIdValue = customerId[0].customer_id;

    await knex("customers")
      .where("customer_id", customerIdValue)
      .update({ type: "Customer Service" });

    const existingAppointments = await knex("appointments")
      .where("vehicle_id", vehicle_id)
      .andWhere("status", "!=", "invoiced")
      .andWhere("company_code", companyCode); // Filter by company code
    console.log({ existingAppointments });

    if (existingAppointments.length > 0) {
      const AppointmentsArray = existingAppointments[0];
      return res.status(400).json({ error: "Cannot", AppointmentsArray });
    }

    const appointment_id = await generateAppointmentId();

    const newAppointment = enrichAppointmentData(
      {
        ...req.body,
        appointment_id,
      },
      companyCode,
    );

    await knex("appointments").insert(newAppointment);

    await logChange(token, "appointments", "INSERT", appointment_id, req.body);

    res.status(200).json({
      message: "Appointment created successfully",
      AppointmentsArray: newAppointment,
    });
  } catch (error) {
    console.log("Error creating appointment:", error);
    res
      .status(400)
      .json({ error: "Error creating appointment", details: error.message });
  }
}

export async function getAllAppointments(req, res) {
  try {
    let { startDate, endDate,status} = req.query;
    console.log("Received query params:", { startDate, endDate });
    // For GET requests, only filter by company code if explicitly provided
    // Do NOT extract from token to avoid filtering based on token's company_code
    let companyCode = null;
    if (req.body && req.body.company_code) {
      companyCode = req.body.company_code;
    } else if (req.query && req.query.company_code) {
      companyCode = req.query.company_code;
    } else if (req.headers["x-company-code"]) {
      companyCode = req.headers["x-company-code"];
    }

    console.log("Query params:", { startDate, endDate, companyCode });

    // Validate date format (optional)
    const isValidDate = (dateStr) => !isNaN(new Date(dateStr).getTime());
    if (
      (startDate && !isValidDate(startDate)) ||
      (endDate && !isValidDate(endDate))
    ) {
      return res.status(400).json({ error: "Invalid startDate or endDate" });
    }

    // Swap dates if startDate > endDate
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      [startDate, endDate] = [endDate, startDate];
    }

    // Fetch prefixes
    const prefix = await knex("number_range")
      .where("id_type", "countersales")
      .orWhere("id_type", "Appointment");
    console.log("Prefixes:", prefix);

    // Fetch appointments
    const appointments = await knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.company_code",
        "appointments.customer_id",
        "customers.customer_name",
        "customers.advance_payment",
        "customers.phone",
        "customers.street",
        "customers.city",
        "customers.state",
        "customers.leads_owner",
        "appointments.vehicle_id",
        "appointments.plateNumber",
        "appointments.mechanic_id",
        "appointments.km",
        "appointments.appointment_date",
        "appointments.appointment_time",
        "appointments.status",
        "appointments.telecaller",
        "appointments.notes",
        "appointments.feedback",
        "appointments.paid_status",
        "appointments.invoice_date",
        "appointments.paid_amount",
        "appointments.advance_balance",
        "appointments.invoice_amount",
        "appointments.completed_date",
        "appointments.inspection_date",
        "appointments.released_date",
        "appointments.payment_method",
        "appointments.payment_logs",
        "appointments.cheque_no",
        "appointments.cheque_date",
        "services_actual.service_id",
        "services_actual.service_description",
        "services_actual.status as service_status",
        "services_actual.service_status as service_actual_status",
        "services_actual.price",
        "services_actual.service_type",
        "services_actual.comments",
        "services_actual.uom",
        "items_required.item_id",
        "items_required.item_name",
        "items_required.qty",
        "items_required.tax",
        "items_required.price",
        "vehicles.make",
        "vehicles.model",
        "vehicles.year",
        "vehicles.vin",
        "vehicles.fuel_type",
        "appointment_to_invoice.invoice_id as invoice_id",
        "appointment_to_invoice.gst_invoice_id as gst_invoice_id"
      )
      .leftJoin(
        "customers",
        "appointments.customer_id",
        "customers.customer_id",
      )
      .leftJoin(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id",
      )
      .leftJoin(
        "items_required",
        "services_actual.service_id",
        "items_required.service_id",
      )
      .leftJoin(
        "appointment_to_invoice",
        "appointments.appointment_id",
        "appointment_to_invoice.appointment_id"
      )

      .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
      .where(function (builder) {
        // Company code filter (mandatory when provided)
        if (companyCode) {
          builder.where("appointments.company_code", companyCode);
        }

        // ID prefix filter
        builder.where(function () {
          if (prefix[0]?.prefix) {
            this.where(
              "appointments.appointment_id",
              "like",
              `%${prefix[0].prefix}%`,
            );
          }
          if (prefix[1]?.prefix) {
            this.orWhere(
              "appointments.appointment_id",
              "like",
              `%${prefix[1].prefix}%`,
            );
          }
        });

        // Date filter
        if (startDate && endDate) {
          builder.andWhereBetween("appointments.appointment_date", [
            startDate,
            endDate,
          ]);
        } else if (startDate) {
          builder.andWhere("appointments.appointment_date", ">=", startDate);
        } else if (endDate) {
          builder.andWhere("appointments.appointment_date", "<=", endDate);
        }
  

        if (status) {
  let statusArray = [];

  if (Array.isArray(status)) {
    // case: status=released&status=invoice
    statusArray = status;
  } else {
    // case: status=released,invoice
    statusArray = status.split(",").map((s) => s.trim());
  }

  builder.whereIn("appointments.status", statusArray);
}

 

      })
      .orderBy("appointments.appointment_date", "desc");

    // Map appointments with services and items
    const formattedAppointments = [];
    const appointmentMap = {};
    // console.log("Fetched appointments:", appointments);
    appointments.forEach((row) => {
      console.log("Processing row:", row.appointment_id, row.gst_invoice_id);
      if (!appointmentMap[row.appointment_id]) {
        appointmentMap[row.appointment_id] = {
          _id: `appointment-${row.appointment_id}`,
          appointment_id: row.appointment_id,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          phone: row.phone,
          street: row.street,
          city: row.city,
          state: row.state,
          leads_owner: row.leads_owner,
          vehicle_id: row.vehicle_id,
          plateNumber: row.plateNumber,
          mechanic_id: parseMechanicId(row.mechanic_id),
          km: row.km,
          appointment_date: row.appointment_date,
          appointment_time: row.appointment_time,
          status: row.status,
          telecaller: row.telecaller,
          notes: row.notes,
          feedback: row.feedback,
          paid_status: row.paid_status,
          invoice_date: row.invoice_date,
          paid_amount: row.paid_amount,
          advance_payment: row.advance_balance,
          advance_balance: row.advance_payment,
          invoice_amount: row.invoice_amount,
          completed_date: row.completed_date,
          inspection_date: row.inspection_date,
          released_date: row.released_date,
          payment_method: row.payment_method,
          payment_log: row.payment_logs,
          cheque_no: row.cheque_no,
          cheque_date: row.cheque_date,
          services_actual: [],
          make: row.make,
          model: row.model,
          year: row.year,
          vin: row.vin,
          fuel_type: row.fuel_type,
          invoice_id: row.invoice_id || null,
          gst_invoice_id: row.gst_invoice_id || null,
        };
        formattedAppointments.push(appointmentMap[row.appointment_id]);
      }

      const appointment = appointmentMap[row.appointment_id];

      // Map services
      let service = appointment.services_actual.find(
        (s) => s.service_id === row.service_id,
      );
      if (!service && row.service_id) {
        service = {
          _id: `service-${row.service_id}`,
          service_id: row.service_id,
          service_description: row.service_description,
          status: row.service_status,
          service_status: row.service_actual_status,
          price: row.price,
          service_type: row.service_type,
          comments: row.comments,
          uom: row.uom,
          items_required: [],
        };
        appointment.services_actual.push(service);
      }

      // Map items
      if (service && row.item_id) {
        const itemExists = service.items_required.some(
          (item) => item.item_id === row.item_id,
        );
        if (!itemExists) {
          service.items_required.push({
            _id: `item-${row.item_id}`,
            item_id: row.item_id,
            item_name: row.item_name,
            qty: row.qty,
            tax: row.tax,
            price: row.price,
          });
        }
      }
    });

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      error: "Error fetching appointments",
      details: error.message,
    });
  }
}

export async function getAllAppointmentsForGST(req, res) {
  try {
    let { startDate, endDate,status, include_gst } = req.query;
    console.log("Received query params:", { startDate, endDate });
    // For GET requests, only filter by company code if explicitly provided
    // Do NOT extract from token to avoid filtering based on token's company_code
    let companyCode = null;
    if (req.body && req.body.company_code) {
      companyCode = req.body.company_code;
    } else if (req.query && req.query.company_code) {
      companyCode = req.query.company_code;
    } else if (req.headers["x-company-code"]) {
      companyCode = req.headers["x-company-code"];
    }

    console.log("Query params:", { startDate, endDate, companyCode });

    // Validate date format (optional)
    const isValidDate = (dateStr) => !isNaN(new Date(dateStr).getTime());
    if (
      (startDate && !isValidDate(startDate)) ||
      (endDate && !isValidDate(endDate))
    ) {
      return res.status(400).json({ error: "Invalid startDate or endDate" });
    }

    // Swap dates if startDate > endDate
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      [startDate, endDate] = [endDate, startDate];
    }

    // Fetch prefixes
    const prefix = await knex("number_range")
      .where("id_type", "countersales")
      .orWhere("id_type", "Appointment");
    console.log("Prefixes:", prefix);

    // Fetch appointments
    const appointments = await knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.company_code",
        "appointments.customer_id",
        "customers.customer_name",
        "customers.advance_payment",
        "customers.phone",
        "customers.street",
        "customers.city",
        "customers.state",
        "customers.leads_owner",
        "appointments.vehicle_id",
        "appointments.plateNumber",
        "appointments.mechanic_id",
        "appointments.km",
        "appointments.appointment_date",
        "appointments.appointment_time",
        "appointments.status",
        "appointments.telecaller",
        "appointments.notes",
        "appointments.feedback",
        "appointments.paid_status",
        "appointments.invoice_date",
        "appointments.paid_amount",
        "appointments.advance_balance",
        "appointments.invoice_amount",
        "appointments.completed_date",
        "appointments.inspection_date",
        "appointments.released_date",
        "appointments.payment_method",
        "appointments.payment_logs",
        "appointments.cheque_no",
        "appointments.cheque_date",
        "services_actual.service_id",
        "services_actual.service_description",
        "services_actual.status as service_status",
        "services_actual.service_status as service_actual_status",
        "services_actual.price",
        "services_actual.service_type",
        "services_actual.comments",
        "services_actual.uom",
        "items_required.item_id",
        "items_required.item_name",
        "items_required.qty",
        "items_required.tax",
        "items_required.price",
        "vehicles.make",
        "vehicles.model",
        "vehicles.year",
        "vehicles.vin",
        "vehicles.fuel_type",
        "appointment_to_invoice.invoice_id as invoice_id",
        "appointment_to_invoice.gst_invoice_id as gst_invoice_id"
      )
      .leftJoin(
        "customers",
        "appointments.customer_id",
        "customers.customer_id",
      )
      .leftJoin(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id",
      )
      .leftJoin(
        "items_required",
        "services_actual.service_id",
        "items_required.service_id",
      )
      .leftJoin(
        "appointment_to_invoice",
        "appointments.appointment_id",
        "appointment_to_invoice.appointment_id"
      ).where("appointment_to_invoice.invoice_status", "active")

      .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
      .where(function (builder) {
        // Company code filter (mandatory when provided)
        if (companyCode) {
          builder.where("appointments.company_code", companyCode);
        }

        // ID prefix filter
        builder.where(function () {
          if (prefix[0]?.prefix) {
            this.where(
              "appointments.appointment_id",
              "like",
              `%${prefix[0].prefix}%`,
            );
          }
          if (prefix[1]?.prefix) {
            this.orWhere(
              "appointments.appointment_id",
              "like",
              `%${prefix[1].prefix}%`,
            );
          }
        });

        // Date filter
        if (startDate && endDate) {
          builder.andWhereBetween("appointments.appointment_date", [
            startDate,
            endDate,
          ]);
        } else if (startDate) {
          builder.andWhere("appointments.appointment_date", ">=", startDate);
        } else if (endDate) {
          builder.andWhere("appointments.appointment_date", "<=", endDate);
        }
    if (status) {
    const statusArray = status.split(",").map((s) => s.trim());
    builder.whereIn("appointments.status", statusArray);
  }

  //  GST filter
if (include_gst === "true") {
  builder.whereNotNull("appointment_to_invoice.gst_invoice_id");
}

      })
      .orderBy("appointments.appointment_date", "desc");

    // Map appointments with services and items
    const formattedAppointments = [];
    const appointmentMap = {};
    // console.log("Fetched appointments:", appointments);
    appointments.forEach((row) => {
      console.log("Processing row:", row.appointment_id, row.gst_invoice_id);
      if (!appointmentMap[row.appointment_id]) {
        appointmentMap[row.appointment_id] = {
          _id: `appointment-${row.appointment_id}`,
          appointment_id: row.appointment_id,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          phone: row.phone,
          street: row.street,
          city: row.city,
          state: row.state,
          leads_owner: row.leads_owner,
          vehicle_id: row.vehicle_id,
          plateNumber: row.plateNumber,
          mechanic_id: parseMechanicId(row.mechanic_id),
          km: row.km,
          appointment_date: row.appointment_date,
          appointment_time: row.appointment_time,
          status: row.status,
          telecaller: row.telecaller,
          notes: row.notes,
          feedback: row.feedback,
          paid_status: row.paid_status,
          invoice_date: row.invoice_date,
          paid_amount: row.paid_amount,
          advance_payment: row.advance_balance,
          advance_balance: row.advance_payment,
          invoice_amount: row.invoice_amount,
          completed_date: row.completed_date,
          inspection_date: row.inspection_date,
          released_date: row.released_date,
          payment_method: row.payment_method,
          payment_log: row.payment_logs,
          cheque_no: row.cheque_no,
          cheque_date: row.cheque_date,
          services_actual: [],
          make: row.make,
          model: row.model,
          year: row.year,
          vin: row.vin,
          fuel_type: row.fuel_type,
          invoice_id: row.invoice_id || null,
          gst_invoice_id: row.gst_invoice_id || null,
        };
        formattedAppointments.push(appointmentMap[row.appointment_id]);
      }

      const appointment = appointmentMap[row.appointment_id];

      // Map services
      let service = appointment.services_actual.find(
        (s) => s.service_id === row.service_id,
      );
      if (!service && row.service_id) {
        service = {
          _id: `service-${row.service_id}`,
          service_id: row.service_id,
          service_description: row.service_description,
          status: row.service_status,
          service_status: row.service_actual_status,
          price: row.price,
          service_type: row.service_type,
          comments: row.comments,
          uom: row.uom,
          items_required: [],
        };
        appointment.services_actual.push(service);
      }

      // Map items
      if (service && row.item_id) {
        const itemExists = service.items_required.some(
          (item) => item.item_id === row.item_id,
        );
        if (!itemExists) {
          service.items_required.push({
            _id: `item-${row.item_id}`,
            item_id: row.item_id,
            item_name: row.item_name,
            qty: row.qty,
            tax: row.tax,
            price: row.price,
          });
        }
      }
    });

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      error: "Error fetching appointments",
      details: error.message,
    });
  }
}

export async function searchAppointments(req, res) {
  try {
    const { q } = req.query; // Search query

    // For GET requests, only filter by company code if explicitly provided
    // Do NOT extract from token to avoid filtering based on token's company_code
    let companyCode = null;
    if (req.body && req.body.company_code) {
      companyCode = req.body.company_code;
    } else if (req.query && req.query.company_code) {
      companyCode = req.query.company_code;
    } else if (req.headers["x-company-code"]) {
      companyCode = req.headers["x-company-code"];
    }

    if (!q || q.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchQuery = q.trim().toLowerCase();

    // Build the query with OR conditions for all searchable fields
    const appointments = await knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.company_code",
        "appointments.customer_id",
        "customers.customer_name",
        "customers.advance_payment",
        "customers.phone",
        "customers.street",
        "customers.city",
        "customers.state",
        "customers.leads_owner",
        "appointments.vehicle_id",
        "appointments.plateNumber",
        "appointments.mechanic_id",
        "appointments.km",
        "appointments.appointment_date",
        "appointments.appointment_time",
        "appointments.status",
        "appointments.telecaller",
        "appointments.notes",
        "appointments.feedback",
        "appointments.paid_status",
        "appointments.invoice_date",
        "appointments.paid_amount",
        "appointments.advance_balance",
        "appointments.invoice_amount",
        "appointments.completed_date",
        "appointments.inspection_date",
        "appointments.released_date",
        "appointments.payment_method",
        "appointments.payment_logs",
        "appointments.cheque_no",
        "appointments.cheque_date",
        "appointment_to_invoice.invoice_id",
        "services_actual.service_id",
        "services_actual.service_description",
        "services_actual.status as service_status",
        "services_actual.service_status as service_actual_status",
        "services_actual.price",
        "services_actual.service_type",
        "services_actual.comments",
        "services_actual.uom",
        "items_required.item_id",
        "items_required.item_name",
        "items_required.qty",
        "items_required.tax",
        "items_required.price",
        "vehicles.make",
        "vehicles.model",
        "vehicles.year",
        "vehicles.vin",
        "vehicles.fuel_type",

      )
      .leftJoin(
        "appointment_to_invoice",
        "appointments.appointment_id",
        "appointment_to_invoice.appointment_id",
      )
      .leftJoin(
        "customers",
        "appointments.customer_id",
        "customers.customer_id",
      )
      .leftJoin(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id",
      )
      .leftJoin(
        "items_required",
        "services_actual.service_id",
        "items_required.service_id",
      )
      .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
      .where(function (builder) {
        // Company code filter (mandatory when provided)
        if (companyCode) {
          builder.where("appointments.company_code", companyCode);
        }

        // Search across all relevant fields
        builder.andWhere(function () {
          this.where("appointments.appointment_id", "like", `%${searchQuery}%`)
            .orWhere("appointment_to_invoice.invoice_id", "like", `%${searchQuery}%`)
            .orWhere("customers.customer_name", "like", `%${searchQuery}%`)
            .orWhere("customers.phone", "like", `%${searchQuery}%`)
            .orWhere("appointments.vehicle_id", "like", `%${searchQuery}%`)
            .orWhere("appointments.plateNumber", "like", `%${searchQuery}%`)
            .orWhere("vehicles.make", "like", `%${searchQuery}%`)
            .orWhere("vehicles.model", "like", `%${searchQuery}%`)
            .orWhere("appointments.notes", "like", `%${searchQuery}%`);
        });
      })
      .orderBy("appointments.appointment_date", "desc")
      .limit(100); // Limit results to 100

    // Map appointments with services and items (same format as getAllAppointments)
    const formattedAppointments = [];
    const appointmentMap = {};

    appointments.forEach((row) => {
      if (!appointmentMap[row.appointment_id]) {
        appointmentMap[row.appointment_id] = {
          _id: `appointment-${row.appointment_id}`,
          appointment_id: row.appointment_id,
          customer_id: row.customer_id,
          invoice_id: row.invoice_id,
          customer_name: row.customer_name,
          phone: row.phone,
          street: row.street,
          city: row.city,
          state: row.state,
          leads_owner: row.leads_owner,
          vehicle_id: row.vehicle_id,
          plateNumber: row.plateNumber,
          mechanic_id: parseMechanicId(row.mechanic_id),
          km: row.km,
          appointment_date: row.appointment_date,
          appointment_time: row.appointment_time,
          status: row.status,
          telecaller: row.telecaller,
          notes: row.notes,
          feedback: row.feedback,
          paid_status: row.paid_status,
          invoice_date: row.invoice_date,
          paid_amount: row.paid_amount,
          advance_payment: row.advance_balance,
          advance_balance: row.advance_payment,
          invoice_amount: row.invoice_amount,
          completed_date: row.completed_date,
          inspection_date: row.inspection_date,
          released_date: row.released_date,
          payment_method: row.payment_method,
          payment_log: row.payment_logs,
          cheque_no: row.cheque_no,
          cheque_date: row.cheque_date,
          services_actual: [],
          make: row.make,
          model: row.model,
          year: row.year,
          vin: row.vin,
          fuel_type: row.fuel_type,
        };
        formattedAppointments.push(appointmentMap[row.appointment_id]);
      }

      const appointment = appointmentMap[row.appointment_id];

      // Map services
      let service = appointment.services_actual.find(
        (s) => s.service_id === row.service_id,
      );
      if (!service && row.service_id) {
        service = {
          _id: `service-${row.service_id}`,
          service_id: row.service_id,
          service_description: row.service_description,
          status: row.service_status,
          service_status: row.service_actual_status,
          price: row.price,
          service_type: row.service_type,
          comments: row.comments,
          uom: row.uom,
          items_required: [],
        };
        appointment.services_actual.push(service);
      }

      // Map items
      if (service && row.item_id) {
        const itemExists = service.items_required.some(
          (item) => item.item_id === row.item_id,
        );
        if (!itemExists) {
          service.items_required.push({
            _id: `item-${row.item_id}`,
            item_id: row.item_id,
            item_name: row.item_name,
            qty: row.qty,
            tax: row.tax,
            price: row.price,
          });
        }
      }
    });

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("Error searching appointments:", error);
    res.status(500).json({
      error: "Error searching appointments",
      details: error.message,
    });
  }
}


export async function getAppointmentById(req, res) {
  try {
    let companyCode = null;

    if (req.body && req.body.company_code) {
      companyCode = req.body.company_code;
    } else if (req.query && req.query.company_code) {
      companyCode = req.query.company_code;
    } else if (req.headers["x-company-code"]) {
      companyCode = req.headers["x-company-code"];
    }

    const rows = await knex("appointments")
      .select(
        "appointments.*",
        knex.raw("appointments.invoice_Date as invoice_date"),

        "appointment_to_invoice.invoice_id as invoice_id",
        "appointment_to_invoice.gst_invoice_id as gst_invoice_id",
        "customers.customer_name",

        "services_actual.service_id",
        "services_actual.service_description",
        "services_actual.status as service_status",
        "services_actual.service_status as service_actual_status",
        "services_actual.price",
        "services_actual.service_type",
        "services_actual.comments",
        "services_actual.uom",

        "items_required.item_id",
        "items_required.item_name",
        "items_required.qty",
        "items_required.tax",
        "items_required.price",
        "items_required.pr_no",

        "vehicles.make",
        "vehicles.model",
        "vehicles.year",
        "vehicles.vin",
        "vehicles.fuel_type"
      )
      .leftJoin(
        "customers",
        "appointments.customer_id",
        "customers.customer_id"
      )
      .leftJoin(
        "appointment_to_invoice",
        "appointments.appointment_id",
        "appointment_to_invoice.appointment_id"
      )
      .leftJoin(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id"
      )
      .leftJoin(
        "items_required",
        "services_actual.service_id",
        "items_required.service_id"
      )
      .leftJoin(
        "vehicles",
        "appointments.vehicle_id",
        "vehicles.vehicle_id"
      )
      .where("appointments.appointment_id", req.params.appointment_id)
      .andWhere((builder) => {
        if (companyCode) {
          builder.where("appointments.company_code", companyCode);
        }
      });

    if (!rows.length) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const row0 = rows[0];

    //   SAFE DATE FIX (IMPORTANT)
    // ✅ Better safeDate - handles MySQL date formats
    const safeDate = (d) => {
      if (!d) return null;

      // Already YYYY-MM-DD string
      if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return d;
      }

      // MySQL DATETIME or JS Date object
      const date = new Date(d);
      return !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : null;
    };

    const appointment = {
      _id: `appointment-${row0.appointment_id}`,
      appointment_id: row0.appointment_id,

      customer_id: row0.customer_id,
      customer_name: row0.customer_name,

      //   FIXED INVOICE
      invoice_id: row0.invoice_id || null,
      gst_invoice_id: row0.gst_invoice_id || null,

      vehicle_id: row0.vehicle_id,
      mechanic_id: parseMechanicId(row0.mechanic_id),
      km: row0.km,
      next_service_km: row0.next_service_km,

      appointment_date: row0.appointment_date,
      appointment_time: row0.appointment_time,
      status: row0.status,
      telecaller: row0.telecaller,
      notes: row0.notes,
      feedback: row0.feedback,
      paid_status: row0.paid_status,

      //   FIXED DATE (NO NaN EVER)
      //  invoice_date: safeDate(row0.invoice_date),
      invoice_date: safeDate(row0.invoice_Date || row0.invoice_date),
      paid_amount: row0.paid_amount,
      advance_payment: row0.advance_payment,
      advance_balance: row0.advance_balance,
      invoice_amount: row0.Invoice_Amount || row0.invoice_amount || null,

      completed_date: safeDate(row0.completed_date),
      inspection_date: safeDate(row0.inspection_date),
      released_date: row0.released_date,

      payment_method: row0.payment_method,
      sales_id: parseSalesId(row0.sales_id),
      referred_by: row0.referred_by,
      customer_ref_name: row0.customer_ref_name,

      services_actual: [],

      make: row0.make,
      model: row0.model,
      year: row0.year,
      vin: row0.vin,
      fuel_type: row0.fuel_type,

      visual_inspection_in: row0.visual_inspection_in,
      visual_inspection_comments: row0.visual_inspection_comments,
    };

    const serviceMap = {};

    rows.forEach((row) => {
      const serviceId = row.service_id;
      const itemId = row.item_id;

      if (!serviceId) return;

      if (!serviceMap[serviceId]) {
        serviceMap[serviceId] = {
          _id: `service-${serviceId}`,
          service_id: serviceId,
          service_description: row.service_description,
          status: row.service_status,
          service_status: row.service_actual_status,
          price: row.price,
          service_type: row.service_type,
          comments: row.comments,
          uom: row.uom,
          items_required: [],
          __itemSet: new Set(),
        };

        appointment.services_actual.push(serviceMap[serviceId]);
      }

      if (itemId && !serviceMap[serviceId].__itemSet.has(itemId)) {
        serviceMap[serviceId].__itemSet.add(itemId);

        serviceMap[serviceId].items_required.push({
          _id: `item-${itemId}`,
          item_id: itemId,
          item_name: row.item_name,
          qty: row.qty,
          tax: row.tax,
          price: row.price,
          pr_no: row.pr_no,
        });
      }
    });

    appointment.services_actual.forEach((s) => delete s.__itemSet);

    return res.status(200).json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return res.status(500).json({
      error: "Error fetching appointment",
      details: error.message,
    });
  }
}

export async function updateAppointment(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const companyCode = getCompanyCodeFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const { appointment_id } = req.params;
    const newData = req.body;

    const currentAppointment = await knex("appointments")
      .where({ appointment_id })
      .first();

    if (!currentAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Validate that appointment belongs to the requested company code
    if (companyCode && currentAppointment.company_code !== companyCode) {
      return res.status(403).json({
        error: "Access denied - appointment belongs to a different company",
        appointment_company_code: currentAppointment.company_code,
        requested_company_code: companyCode,
      });
    }

    const changes = {};
    for (const key in newData) {
      if (currentAppointment[key] !== newData[key]) {
        changes[key] = {
          old: currentAppointment[key],
          new: newData[key],
        };
      }
    }

    if (Object.keys(changes).length > 0) {
      await logChange(token, "appointments", "UPDATE", appointment_id, changes);
    }

    const updated = await knex("appointments")
      .where({ appointment_id })
      .update(newData);

    if (!updated) {
      return res.status(404).json({ error: "Appointment not updated" });
    }

    const updatedAppointment = await knex("appointments")
      .where({ appointment_id })
      .first();

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error.message);
    res.status(400).json({
      error: "Error updating appointment",
      details: error.message,
    });
  }
}

export async function updateAppointmentDateTime(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const { appointment_id } = req.params;
    const { appointment_date, appointment_time } = req.body;

    const currentAppointment = await knex("appointments")
      .where({ appointment_id })
      .first();

    if (!currentAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const changes = {};
    if (currentAppointment.appointment_date !== appointment_date) {
      changes.appointment_date = {
        old: currentAppointment.appointment_date,
        new: appointment_date,
      };
    }
    if (currentAppointment.appointment_time !== appointment_time) {
      changes.appointment_time = {
        old: currentAppointment.appointment_time,
        new: appointment_time,
      };
    }

    if (Object.keys(changes).length > 0) {
      await logChange(token, "appointments", "UPDATE", appointment_id, changes);
    }

    const updated = await knex("appointments")
      .where({ appointment_id })
      .update({
        appointment_date,
        appointment_time,
      });

    if (!updated) {
      return res.status(404).json({ error: "Appointment not updated" });
    }

    const updatedAppointment = await knex("appointments")
      .where({ appointment_id })
      .first();

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error.message);
    res.status(400).json({
      error: "Error updating appointment",
      details: error.message,
    });
  }
}

export async function updateAppointmentPlateNumber(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const { vehicle_id, plateNumber } = req.params;

    const currentAppointment = await knex("appointments")
      .where({ vehicle_id })
      .first();

    if (!currentAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (currentAppointment.plateNumber === plateNumber) {
      return res.status(200).json({
        message: "No changes made. Plate number is already up-to-date.",
      });
    }

    const changes = {
      plateNumber: {
        old: currentAppointment.plateNumber,
        new: plateNumber,
      },
    };

    await logChange(token, "appointments", "UPDATE", vehicle_id, changes);

    const updated = await knex("appointments")
      .where({ vehicle_id })
      .update({ plateNumber });

    if (!updated) {
      return res.status(400).json({ error: "Failed to update appointment" });
    }

    const updatedAppointment = await knex("appointments")
      .where({ vehicle_id })
      .first();

    res.status(200).json({
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error.message);
    res.status(400).json({
      error: "Error updating appointment",
      details: error.message,
    });
  }
}

export async function cancelInvReverseQty(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const userRole = decoded.role;

  let { appointmentId } = req.params;
  let data = req.body.transactionData;

  let services = await knex("services_actual")
    .where("appointment_id", appointmentId)
    .andWhere("service_description", "Service");

  let serviceIds = services.map(async (service) => {
    let serviceId = service.service_id;

    let item = await knex("items_required").where("service_id", serviceId);

    let itemId = item[0].item_id;
    let qtyToAppend = item[0].qty;

    let result = await knex("inventory")
      .where("inventory_id", itemId)
      .increment("quantity", qtyToAppend);

    if (userRole === "Admin") {
      data.description = "Initial Upload-" + data.description;
      console.log("Re");
    } else {
      data.description = "RE-" + data.description;
      console.log("!RE");
    }

    data.inventory_id = itemId;
    data.quantity = qtyToAppend;
    console.log({ data });

    await knex("transactions").insert(data);

    await logChange(token, "material movement", "INSERT", itemId, data);

    console.log({ itemId, qtyToAppend, result });
  });

  res.status(200).send({ serviceIds });
}

export async function updateAppointmentStatus(req, res) {
  let { appointmentId } = req.params;
  let { status } = req.body;
  console.log({ status });

  let result = await knex("appointments")
    .where("appointment_id", appointmentId)
    .update("status", status);

  res.status(200).send({ result });
}

// ✅ IMPROVED: Helper function to check if a Consumed transaction already exists for a service/item
// Returns the existing transaction with quantity if found
async function hasExistingConsumedTransaction(service_id, item_id) {
  const existing = await knex("transactions")
    .where("service_id", service_id)
    .andWhere("inventory_id", item_id)
    .andWhere("transaction_type", "Consumed")
    .first();
  return existing;
}

export async function addServicesToAppointment(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const serviceType = req.body.serviceType || "services_actual";

  try {
    const services = req.body;

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "No services provided" });
    }

    // ✅ VALIDATION: Ensure all services have at least one item_required
    const servicesWithoutItems = services.filter(
      (service) =>
        !service.items_required || service.items_required.length === 0,
    );

    if (servicesWithoutItems.length > 0) {
      return res.status(400).json({
        error:
          "Validation failed: All services must have at least one item/spare part",
        details: `${servicesWithoutItems.length} service(s) have no items_required. Each service must include at least one spare part.`,
      });
    }

    for (const service of services) {
      let {
        service_id,
        service_description,
        price,
        uom,
        items_required,
        status,
        service_type,
        service_status,
        advance_payment,
        advance_balance,
      } = service;

      const from = service?.from || "";
      console.log("from", from);

      const existingService = await knex(serviceType)
        .where("appointment_id", req.params.appointment_id)
        .andWhere("service_id", service_id)
        .first();

      if (existingService) {
        await knex(serviceType)
          .where("appointment_id", req.params.appointment_id)
          .andWhere("service_id", service_id)
          .update({
            service_description,
            price,
            uom,
            status,
            service_type,
            service_status,
            advance_payment,
            advance_balance,
          });

        const existingItems = await knex("items_required")
          .where("service_id", service_id)
          .select("item_id");

        const existingItemIds = existingItems.map((item) => item.item_id);

        for (const item of items_required) {
          // Validate that item_id exists before processing
          if (!item.item_id) {
            console.warn("Skipping item with missing item_id:", item);
            continue;
          }

          if (existingItemIds.includes(item.item_id)) {
            await knex("items_required")
              .where("service_id", service_id)
              .andWhere("item_id", item.item_id)
              .update(item);
          } else {
            await knex("items_required").insert({
              ...item,
              service_id,
            });
          }

          // Update inventory price if a new price is provided
          if (
            item.price !== undefined &&
            item.price !== null &&
            item.price > 0
          ) {
            const currentInventory = await knex("inventory")
              .where("inventory_id", item.item_id)
              .first();

            if (currentInventory && currentInventory.price !== item.price) {
              await knex("inventory")
                .where("inventory_id", item.item_id)
                .update({ price: item.price });

              console.log(
                `Updated inventory price for ${item.item_id}: ${currentInventory.price} -> ${item.price}`,
              );
            }
          }
        }

        const newItemIds = items_required.map((item) => item.item_id);
        const itemsToRemove = existingItemIds.filter(
          (id) => !newItemIds.includes(id),
        );

        if (itemsToRemove.length > 0) {
          await knex("items_required")
            .where("service_id", service_id)
            .whereIn("item_id", itemsToRemove)
            .del();
        }
      } else {
        service_id = await generateServiceId();
        await knex(serviceType).insert({
          service_id,
          appointment_id: req.params.appointment_id,
          service_description,
          price,
          uom,
          status,
          service_type,
          service_status,
        });

        if (from === "invoice") {
          console.log("items_required", items_required);
          // Resolve item_id from first item by looking up inventory
          if (items_required && items_required.length > 0) {
            let firstItemId = items_required[0].item_id;
            if (!firstItemId && items_required[0].item_name) {
              const inventoryItem = await knex("inventory")
                .where("part_name", items_required[0].item_name)
                .first();
              if (inventoryItem) {
                firstItemId = inventoryItem.inventory_id;
              }
            }

            if (firstItemId) {
              const inventory = await knex("inventory").where(
                "inventory_id",
                firstItemId,
              );
              const requiredQty = items_required[0].qty;
              if (
                inventory &&
                inventory[0] &&
                inventory[0].quantity < requiredQty
              ) {
                await knex("inventory")
                  .where("inventory_id", firstItemId)
                  .update({
                    quantity: Math.max(0, inventory[0].quantity - requiredQty),
                  });
                await knex("transactions").insert({
                  quantity: Math.abs(inventory[0].quantity - requiredQty),
                  transaction_type: "Received",
                  transaction_date: req.tzHelpers.getCurrentDate(),
                  description: `Received qty ${Math.abs(
                    inventory[0].quantity - requiredQty,
                  )} for ${service_description}`,
                  inventory_id: firstItemId,
                  service_id: service_id,
                });
              }
              await knex("inventory")
                .where("inventory_id", firstItemId)
                .update({
                  quantity: Math.max(0, inventory[0].quantity - requiredQty),
                });
              items_required.map(async (item) => {
                let itemId = item.item_id;
                if (!itemId && item.item_name) {
                  const invItem = await knex("inventory")
                    .where("part_name", item.item_name)
                    .first();
                  if (invItem) {
                    itemId = invItem.inventory_id;
                  }
                }
                if (itemId) {
                  await knex("transactions").insert({
                    quantity: item.qty,
                    transaction_type: "Consumed",
                    transaction_date: req.tzHelpers.getCurrentDate(),
                    description: `Consumed qty ${item.qty} for ${service_description}`,
                    inventory_id: itemId,
                    service_id: service_id,
                  });
                }
              });
            } else {
              console.warn(
                "Skipping invoice processing: could not resolve item_id",
              );
            }
          } else {
            console.warn("Skipping invoice processing: missing items_required");
          }
        }
      }

      const existingItems = await knex("items_required")
        .where("service_id", service_id)
        .select("item_id", "qty");

      for (const item of items_required) {
        // Resolve item_id: either use provided item_id or look up by item_name
        let itemId = item.item_id;
        if (!itemId && item.item_name) {
          const inventoryItem = await knex("inventory")
            .where("part_name", item.item_name)
            .first();
          if (inventoryItem) {
            itemId = inventoryItem.inventory_id;
          }
        }

        if (!itemId) {
          console.warn("Skipping item - could not resolve item_id:", item);
          continue;
        }

        const existingItem = existingItems.find((i) => i.item_id === itemId);

        if (existingItem) {
          const requestedQty = item.qty;
          const existingQty = existingItem.qty;

          // Update the items_required record with new quantity and price
          const updateData = { qty: requestedQty };
          if (item.price !== undefined && item.price !== null) {
            updateData.price = item.price;
          }
          await knex("items_required")
            .where("service_id", service_id)
            .andWhere("item_id", itemId)
            .update(updateData);

          // Update inventory price if a new price is provided
          if (
            item.price !== undefined &&
            item.price !== null &&
            item.price > 0
          ) {
            const currentInventory = await knex("inventory")
              .where("inventory_id", itemId)
              .first();

            if (currentInventory && currentInventory.price !== item.price) {
              await knex("inventory")
                .where("inventory_id", itemId)
                .update({ price: item.price });

              console.log(
                `Updated inventory price for ${itemId}: ${currentInventory.price} -> ${item.price}`,
              );
            }
          }

          const currentInventory = await knex("inventory")
            .where("inventory_id", itemId)
            .first();

          if (currentInventory) {
            let difference = requestedQty - existingQty;

            if (difference < 0) {
              // Item quantity decreased - add back to inventory
              const newQuantity =
                currentInventory.quantity + Math.abs(difference);
              await knex("inventory")
                .where("inventory_id", itemId)
                .update({ quantity: newQuantity });

              const transactionData = {
                quantity: Math.abs(difference),
                transaction_type: "Added",
                transaction_date: req.tzHelpers.getCurrentDate(),
                description: `Returned qty ${Math.abs(difference)} to inventory for item ${itemId}`,
                inventory_id: itemId,
                service_id: service_id,
              };
              await knex("transactions").insert(transactionData);
            } else if (difference > 0) {
              // Item quantity increased - consume from inventory
              // ✅ ENHANCED: Handle complete transaction sequence for quantity increase
              const availableQty = currentInventory.quantity;
              const requiredQty = difference;
              const consumeQty = Math.min(availableQty, requiredQty);
              const shortageQty = Math.max(0, requiredQty - availableQty);

              // Check if Consumed transaction already exists for this specific service/item combination
              const existingConsumed = await hasExistingConsumedTransaction(
                service_id,
                itemId,
              );

              if (!existingConsumed) {
                // Step 1: Consume available stock
                if (consumeQty > 0) {
                  const newQuantity = availableQty - consumeQty;
                  await knex("inventory")
                    .where("inventory_id", itemId)
                    .update({ quantity: newQuantity });

                  const transactionData = {
                    quantity: consumeQty,
                    transaction_type: "Consumed",
                    transaction_date: req.tzHelpers.getCurrentDate(),
                    description: `Consumed qty ${consumeQty} for appointment ${req.params.appointment_id} - Service: ${service_description}`,
                    inventory_id: itemId,
                    service_id: service_id,
                  };
                  await knex("transactions").insert(transactionData);
                }

                // Step 2 & 3: Handle shortage - Create Purchase and Received transactions
                if (shortageQty > 0) {
                  // Create Purchase transaction for shortage
                  const purchaseTransaction = {
                    quantity: shortageQty,
                    transaction_type: "Purchase",
                    transaction_date: req.tzHelpers.getCurrentDate(),
                    description: `Purchase qty ${shortageQty} (shortage) for appointment ${req.params.appointment_id} - Service: ${service_description}`,
                    inventory_id: itemId,
                    service_id: service_id,
                  };
                  await knex("transactions").insert(purchaseTransaction);

                  // Create Received transaction for shortage (auto-receipt)
                  const receivedTransaction = {
                    quantity: shortageQty,
                    transaction_type: "Received",
                    transaction_date: req.tzHelpers.getCurrentDate(),
                    description: `Received qty ${shortageQty} (shortage fulfillment) for appointment ${req.params.appointment_id} - Service: ${service_description}`,
                    inventory_id: itemId,
                    service_id: service_id,
                  };
                  await knex("transactions").insert(receivedTransaction);

                  // Step 4: Consume the received items
                  const consumeReceivedTransaction = {
                    quantity: shortageQty,
                    transaction_type: "Consumed",
                    transaction_date: req.tzHelpers.getCurrentDate(),
                    description: `Consumed qty ${shortageQty} (from received shortage fulfillment) for appointment ${req.params.appointment_id} - Service: ${service_description}`,
                    inventory_id: itemId,
                    service_id: service_id,
                  };
                  await knex("transactions").insert(consumeReceivedTransaction);

                  // Update inventory to reflect all transactions
                  const afterConsumeQty = availableQty - consumeQty;
                  const afterReceivedQty = afterConsumeQty + shortageQty;
                  const finalQuantity = afterReceivedQty - shortageQty;
                  await knex("inventory")
                    .where("inventory_id", itemId)
                    .update({ quantity: Math.max(0, finalQuantity) });
                }
              }
            }
          }
        } else {
          // New item being added to service
          await knex("items_required").insert({
            ...item,
            service_id,
            item_id: itemId,
            price: item.price,
          });

          // Update inventory price if a new price is provided
          if (
            item.price !== undefined &&
            item.price !== null &&
            item.price > 0
          ) {
            const currentInventory = await knex("inventory")
              .where("inventory_id", itemId)
              .first();

            if (currentInventory && currentInventory.price !== item.price) {
              await knex("inventory")
                .where("inventory_id", itemId)
                .update({ price: item.price });

              console.log(
                `Updated inventory price for ${itemId}: ${currentInventory.price} -> ${item.price}`,
              );
            }
          }

          // Log consumption transaction for new item (with idempotency check)
          if (item.qty > 0) {
            const existingConsumed = await hasExistingConsumedTransaction(
              service_id,
              itemId,
            );

            if (!existingConsumed) {
              const currentInventory = await knex("inventory")
                .where("inventory_id", itemId)
                .first();

              if (currentInventory) {
                // ✅ ENHANCED: Handle complete transaction sequence
                // 1. Consume available stock
                // 2. Create Purchase transaction for shortage
                // 3. Create Received transaction for shortage
                // 4. Consume the received items

                const availableQty = currentInventory.quantity;
                const requiredQty = item.qty;
                const consumeQty = Math.min(availableQty, requiredQty);
                const shortageQty = Math.max(0, requiredQty - availableQty);

                // Step 1: Consume available stock
                if (consumeQty > 0) {
                  const newQuantity = availableQty - consumeQty;

                  await knex("inventory")
                    .where("inventory_id", itemId)
                    .update({ quantity: newQuantity });

                  const consumptionTransaction = {
                    quantity: consumeQty,
                    transaction_type: "Consumed",
                    transaction_date: req.tzHelpers.getCurrentDate(),
                    description: `Consumed qty ${consumeQty} for appointment ${req.params.appointment_id} - Service: ${service_description}`,
                    inventory_id: itemId,
                    service_id: service_id,
                  };
                  await knex("transactions").insert(consumptionTransaction);
                }

                // Step 2 & 3: Handle shortage - Create Purchase and Received transactions
                if (shortageQty > 0) {
                  // Create Purchase transaction for shortage
                  const purchaseTransaction = {
                    quantity: shortageQty,
                    transaction_type: "Purchase",
                    transaction_date: req.tzHelpers.getCurrentDate(),
                    description: `Purchase qty ${shortageQty} (shortage) for appointment ${req.params.appointment_id} - Service: ${service_description}`,
                    inventory_id: itemId,
                    service_id: service_id,
                  };
                  await knex("transactions").insert(purchaseTransaction);

                  // Create Received transaction for shortage (auto-receipt)
                  const receivedTransaction = {
                    quantity: shortageQty,
                    transaction_type: "Received",
                    transaction_date: req.tzHelpers.getCurrentDate(),
                    description: `Received qty ${shortageQty} (shortage fulfillment) for appointment ${req.params.appointment_id} - Service: ${service_description}`,
                    inventory_id: itemId,
                    service_id: service_id,
                  };
                  await knex("transactions").insert(receivedTransaction);

                  // Step 4: Consume the received items
                  const consumeReceivedTransaction = {
                    quantity: shortageQty,
                    transaction_type: "Consumed",
                    transaction_date: req.tzHelpers.getCurrentDate(),
                    description: `Consumed qty ${shortageQty} (from received shortage fulfillment) for appointment ${req.params.appointment_id} - Service: ${service_description}`,
                    inventory_id: itemId,
                    service_id: service_id,
                  };
                  await knex("transactions").insert(consumeReceivedTransaction);

                  // Update inventory to reflect all transactions (stock stays at 0 for consumed items)
                  // Inventory: availableQty → -consumeQty (consumed) → +shortageQty (received) → -shortageQty (consumed) = finalQty (0 if exactly met)
                  const finalQuantity = currentInventory.quantity - requiredQty;
                  await knex("inventory")
                    .where("inventory_id", itemId)
                    .update({ quantity: Math.max(0, finalQuantity) });
                }
              }
            }
          }
        }
      }

      const newItemIds = items_required.map((item) => item.item_id);
      const itemsToRemove = existingItems
        .map((item) => item.item_id)
        .filter((id) => !newItemIds.includes(id));

      if (itemsToRemove.length > 0) {
        await knex("items_required")
          .where("service_id", service_id)
          .whereIn("item_id", itemsToRemove)
          .del();
      }
    }

    const updatedAppointment = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .first();

    await logChange(
      token,
      "appointments",
      "INSERT",
      req.params.appointment_id,
      services,
    );

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.log(`Error adding services:`, error);
    res.status(400).json({
      error: `Error adding services`,
      details: error.message,
    });
  }
}

export async function deleteService(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { service_id } = req.params;

    const serviceDetails = await knex("services_actual")
      .where("service_id", service_id)
      .first();

    if (!serviceDetails) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Get all items required for this service
    const itemsRequired = await knex("items_required").where(
      "service_id",
      service_id,
    );

    // Get the PR number if it exists
    const prNumber = itemsRequired.length > 0 ? itemsRequired[0].pr_no : null;

    // Restore inventory for each item by returning the original requested quantity
    // This is simpler and more correct than trying to reverse individual transactions
    for (const item of itemsRequired) {
      // The quantity in items_required is the original requested quantity that should be restored
      const requestedQty = item.qty;

      if (requestedQty > 0) {
        // Add back the requested quantity to inventory
        await knex("inventory")
          .where("inventory_id", item.item_id)
          .increment("quantity", requestedQty);

        // Create a single Reverse transaction that documents the total restoration
        await knex("transactions").insert({
          quantity: requestedQty,
          transaction_type: "Reverse",
          transaction_date: req.tzHelpers.getCurrentDate(),
          description: `Service deleted - Returned ${requestedQty} units of item ${item.item_id} to inventory`,
          inventory_id: item.item_id,
          service_id: service_id,
        });
      }
    }

    // Delete all transactions for this service
    await knex("transactions").where("service_id", service_id).del();

    // Delete all items required for this service
    await knex("items_required").where("service_id", service_id).del();

    // Delete the service
    const deletedService = await knex("services_actual")
      .where("service_id", service_id)
      .del();

    // Delete the PR if it exists and no other services reference it
    if (prNumber) {
      const otherServiceRefs = await knex("items_required").where(
        "pr_no",
        prNumber,
      );

      if (otherServiceRefs.length === 0) {
        // Delete procurement items and procurement record
        await knex("procurement_items").where("pr_no", prNumber).del();

        await knex("procurements").where("pr_no", prNumber).del();
      }
    }

    const changes = {
      deleted_service: serviceDetails,
      deleted_items: itemsRequired.length,
      reversed_transactions: true,
    };
    await logChange(token, "services", "DELETE", service_id, changes);

    res
      .status(200)
      .json({
        message:
          "Service deleted successfully with all related transactions reversed",
      });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({
      error: "Error deleting service",
      details: error.message,
    });
  }
}

export async function deleteAppointment(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const companyCode = getCompanyCodeFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { appointment_id } = req.params;

    const appointmentDetails = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    if (!appointmentDetails) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Validate that appointment belongs to the requested company code
    if (companyCode && appointmentDetails.company_code !== companyCode) {
      return res.status(403).json({
        error: "Access denied - appointment belongs to a different company",
        appointment_company_code: appointmentDetails.company_code,
        requested_company_code: companyCode,
      });
    }

    // Get all services for this appointment
    const services = await knex("services_actual").where(
      "appointment_id",
      appointment_id,
    );

    const reversalSummary = {
      services_deleted: 0,
      items_reversed: 0,
      transactions_reversed: 0,
      prs_cleaned: 0,
    };

    // Reverse inventory for each service
    for (const service of services) {
      const service_id = service.service_id;

      // Get all items required for this service
      const itemsRequired = await knex("items_required").where(
        "service_id",
        service_id,
      );

      // Get the PR number if it exists
      const prNumber = itemsRequired.length > 0 ? itemsRequired[0].pr_no : null;

      // Restore inventory for each item by returning the original requested quantity
      // This is simpler and more correct than trying to reverse individual transactions
      for (const item of itemsRequired) {
        // The quantity in items_required is the original requested quantity that should be restored
        const requestedQty = item.qty;

        if (requestedQty > 0) {
          // Add back the requested quantity to inventory
          await knex("inventory")
            .where("inventory_id", item.item_id)
            .increment("quantity", requestedQty);

          // Create a single Reverse transaction that documents the total restoration
          await knex("transactions").insert({
            quantity: requestedQty,
            transaction_type: "Reverse",
            transaction_date: req.tzHelpers.getCurrentDate(),
            description: `Appointment deleted - Returned ${requestedQty} units of item ${item.item_id} to inventory`,
            inventory_id: item.item_id,
            service_id: service_id,
          });
          reversalSummary.transactions_reversed++;
        }
      }

      reversalSummary.items_reversed += itemsRequired.length;

      // Delete all transactions for this service
      await knex("transactions").where("service_id", service_id).del();

      // Delete all items required for this service
      await knex("items_required").where("service_id", service_id).del();

      // Delete the service
      await knex("services_actual").where("service_id", service_id).del();

      reversalSummary.services_deleted++;

      // Delete the PR if it exists and no other services reference it
      if (prNumber) {
        const otherServiceRefs = await knex("items_required").where(
          "pr_no",
          prNumber,
        );

        if (otherServiceRefs.length === 0) {
          // Delete procurement items and procurement record
          await knex("procurement_items").where("pr_no", prNumber).del();

          await knex("procurements").where("pr_no", prNumber).del();

          reversalSummary.prs_cleaned++;
        }
      }
    }

    // Delete the appointment
    const deletedAppointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .del();

    if (!deletedAppointment) {
      return res
        .status(404)
        .json({ error: "Appointment could not be deleted" });
    }

    const changes = {
      deleted_appointment: appointmentDetails,
      inventory_reversals: reversalSummary,
    };
    await logChange(token, "appointments", "DELETE", appointment_id, changes);

    res.status(200).json({
      message: "Appointment deleted successfully with all inventory reversed",
      reversalSummary: reversalSummary,
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      error: "Error deleting appointment",
      details: error.message,
    });
  }
}

export async function getVisualInspectionImage(req, res) {
  const appointment_id = req.params.appointment_id;
  const image_name = req.params.image_name;

  const imagePath = path.join(
    __dirname,
    "..",
    "visual_inspection",
    appointment_id,
    image_name,
  );

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: "Image not found" });
  }

  res.sendFile(imagePath);
}

export async function reportedIssue(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const serviceType = "services_actual";

  try {
    const services = req.body;

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "No services provided" });
    }

    for (const service of services) {
      let {
        service_id,
        service_description,
        price,
        uom,
        items_required,
        status,
        service_type,
        service_status,
        advance_payment,
        advance_balance,
      } = service;

      const existingService = await knex(serviceType)
        .where("appointment_id", req.params.appointment_id)
        .andWhere("service_id", service_id)
        .first();

      if (existingService) {
        await knex(serviceType)
          .where("appointment_id", req.params.appointment_id)
          .andWhere("service_id", service_id)
          .update({
            service_description,
            price,
            uom,
            status,
            service_type,
            service_status,
            advance_payment,
            advance_balance,
          });

        const existingItems = await knex("items_required")
          .where("service_id", service_id)
          .select("item_id");

        const existingItemIds = existingItems.map((item) => item.item_id);

        for (const item of items_required) {
          if (existingItemIds.includes(item.item_id)) {
            await knex("items_required")
              .where("service_id", service_id)
              .andWhere("item_id", item.item_id)
              .update(item);
          } else {
            await knex("items_required").insert({
              ...item,
              service_id,
            });
          }

          // Update inventory price if a new price is provided
          if (
            item.price !== undefined &&
            item.price !== null &&
            item.price > 0
          ) {
            const currentInventory = await knex("inventory")
              .where("inventory_id", item.item_id)
              .first();

            if (currentInventory && currentInventory.price !== item.price) {
              await knex("inventory")
                .where("inventory_id", item.item_id)
                .update({ price: item.price });

              console.log(
                `Updated inventory price for ${item.item_id}: ${currentInventory.price} -> ${item.price}`,
              );
            }
          }
        }

        const newItemIds = items_required.map((item) => item.item_id);
        const itemsToRemove = existingItemIds.filter(
          (id) => !newItemIds.includes(id),
        );

        if (itemsToRemove.length > 0) {
          await knex("items_required")
            .where("service_id", service_id)
            .whereIn("item_id", itemsToRemove)
            .del();
        }
      } else {
        service_id = await generateServiceId();
        await knex(serviceType).insert({
          service_id,
          appointment_id: req.params.appointment_id,
          service_description,
          price,
          uom,
          status,
          service_type,
          service_status,
        });
      }
    }

    const updatedAppointment = await knex("appointments")
      .where("appointment_id", req.params.appointment_id)
      .first();

    await logChange(
      token,
      "appointments",
      "INSERT",
      req.params.appointment_id,
      services,
    );

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.log(`Error adding services:`, error);
    res.status(400).json({
      error: `Error adding services`,
      details: error.message,
    });
  }
}

export async function updateAppointmentInvoice(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  const { appointment_id } = req.params;
  const formattedDate = getFormattedTodayInAppTimezone(req);

  try {
    const currentAppointment = await knex("appointments")
      .where({ appointment_id })
      .first();

    if (!currentAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const changes = {};
    if (currentAppointment.status !== "invoice") {
      changes.status = {
        old: currentAppointment.status,
        new: "invoice",
      };
    }
    if (currentAppointment.completed_date !== formattedDate) {
      changes.completed_date = {
        old: currentAppointment.completed_date,
        new: formattedDate,
      };
    }

    if (Object.keys(changes).length > 0) {
      await logDownload(token, appointment_id, "Inspection Sheet");
      await logChange(token, "appointments", "UPDATE", appointment_id, changes);
    } else {
      return res.status(200).json({
        message: "No changes made. Appointment is already up-to-date.",
      });
    }

    const updated = await knex("appointments")
      .where({ appointment_id })
      .update({
        status: "invoice",
        completed_date: formattedDate,
      });

    if (!updated) {
      return res.status(400).json({ error: "Failed to update appointment" });
    }

    const updatedAppointment = await knex("appointments")
      .where({ appointment_id })
      .first();

    res.status(200).json({
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error.message);
    res.status(400).json({
      error: "Error updating appointment status",
      details: error.message,
    });
  }
}

export async function getAppointmentsByDateRange(req, res) {
  try {
    const { start_date, end_date } = req.params;

    console.log("START:", start_date);
    console.log("END:", end_date);

    // ✅ Get prefixes
    const prefixRows = await knex("number_range").whereIn("id_type", [
      "countersales",
      "Appointment",
    ]);

    const prefixes = prefixRows.map((p) => p.prefix);

    // ✅ MAIN QUERY
    const appointments = await knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.customer_id",
        "customers.customer_name",
        "customers.phone",
        "customers.street",
        "customers.city",
        "customers.state",
        "customers.leads_owner",
        "appointments.vehicle_id",
        "appointments.plateNumber",
        "appointments.mechanic_id",
        "appointments.km",
        "appointments.appointment_date",
        "appointments.appointment_time",
        "appointments.status",
        "appointments.telecaller",
        "appointments.notes",
        "appointments.feedback",
        "appointments.paid_status",
        "appointments.invoice_date",
        "appointments.paid_amount",
        "appointments.advance_balance",
        "appointments.invoice_amount",
        "appointments.completed_date",
        "appointments.inspection_date",
        "appointments.released_date",
        "appointments.payment_method",
        "appointments.cheque_no",
        "appointments.cheque_date",
        "services_actual.service_id",
        "services_actual.service_description",
        "services_actual.status as service_status",
        "services_actual.service_status as service_actual_status",
        "services_actual.price",
        "services_actual.service_type",
        "services_actual.comments",
        "services_actual.uom",
        "items_required.item_id",
        "items_required.item_name",
        "items_required.qty",
        "items_required.tax",
        "vehicles.make",
        "vehicles.model",
        "vehicles.year",
        "vehicles.vin",
        "vehicles.fuel_type",
      )
      .leftJoin(
        "customers",
        "appointments.customer_id",
        "customers.customer_id",
      )
      .leftJoin(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id",
      )
      .leftJoin(
        "items_required",
        "services_actual.service_id",
        "items_required.service_id",
      )
      .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")

      // ✅ PREFIX FILTER (FIXED)
      .where((builder) => {
        prefixes.forEach((p, i) => {
          if (i === 0) {
            builder.where("appointments.appointment_id", "like", `${p}%`);
          } else {
            builder.orWhere("appointments.appointment_id", "like", `${p}%`);
          }
        });
      })

      // ✅ DATE FILTER (WORKS FOR ALL FORMATS)
      .andWhereRaw(
        "DATE(appointments.appointment_date) >= ? AND DATE(appointments.appointment_date) <= ?",
        [start_date, end_date],
      )

      .orderBy("appointments.appointment_id", "desc");

    console.log("SQL:", appointments.toString());

    // ✅ FORMAT RESPONSE
    const formattedAppointments = [];
    const map = {};

    appointments.forEach((row) => {
      if (!map[row.appointment_id]) {
        map[row.appointment_id] = {
          _id: `appointment-${row.appointment_id}`,
          appointment_id: row.appointment_id,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          phone: row.phone,
          street: row.street,
          city: row.city,
          state: row.state,
          leads_owner: row.leads_owner,
          vehicle_id: row.vehicle_id,
          plateNumber: row.plateNumber,
          mechanic_id: row.mechanic_id,
          km: row.km,
          appointment_date: row.appointment_date,
          appointment_time: row.appointment_time,
          status: row.status,
          telecaller: row.telecaller,
          notes: row.notes,
          feedback: row.feedback,
          paid_status: row.paid_status,
          invoice_date: row.invoice_date,
          paid_amount: row.paid_amount,
          advance_balance: row.advance_balance,
          invoice_amount: row.invoice_amount,
          completed_date: row.completed_date,
          inspection_date: row.inspection_date,
          released_date: row.released_date,
          payment_method: row.payment_method,
          cheque_no: row.cheque_no,
          cheque_date: row.cheque_date,
          services_actual: [],
          make: row.make,
          model: row.model,
          year: row.year,
          vin: row.vin,
          fuel_type: row.fuel_type,
        };
        formattedAppointments.push(map[row.appointment_id]);
      }

      const appointment = map[row.appointment_id];

      let service = appointment.services_actual.find(
        (s) => s.service_id === row.service_id,
      );

      if (!service && row.service_id) {
        service = {
          _id: `service-${row.service_id}`,
          service_id: row.service_id,
          service_description: row.service_description,
          status: row.service_status,
          service_status: row.service_actual_status,
          price: row.price,
          service_type: row.service_type,
          comments: row.comments,
          uom: row.uom,
          items_required: [],
        };
        appointment.services_actual.push(service);
      }

      if (row.item_id && service) {
        const itemExists = service.items_required.some(
          (item) => item.item_id === row.item_id,
        );
        if (!itemExists) {
          service.items_required.push({
            _id: `item-${row.item_id}`,
            item_id: row.item_id,
            item_name: row.item_name,
            qty: row.qty,
            tax: row.tax,
          });
        }
      }
    });

    return res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({
      error: "Error fetching appointments",
      details: error.message,
    });
  }
}

export async function getMaterialReportData(req, res) {
  try {
    const { start_date, end_date } = req.params;

    // Step 1: Get items used in appointments for the date range with appointment count
    const usedItemsWithCounts = await knex("items_required")
      .select(
        "items_required.item_name",
        "items_required.item_id",
        knex.raw(
          "COUNT(DISTINCT services_actual.appointment_id) as appointmentCount",
        ),
      )
      .join(
        "services_actual",
        "items_required.service_id",
        "services_actual.service_id",
      )
      .join(
        "appointments",
        "services_actual.appointment_id",
        "appointments.appointment_id",
      )
      .whereRaw(
        "DATE(appointments.appointment_date) >= ? AND DATE(appointments.appointment_date) <= ?",
        [start_date, end_date],
      )
      .groupBy("items_required.item_id", "items_required.item_name");

    // Step 2: Get inventory data for used items only
    const usedItemNames = usedItemsWithCounts.map((i) => i.item_name);
    const usedItemIds = usedItemsWithCounts.map((i) => i.item_id);

    let inventory = [];
    if (usedItemNames.length > 0 || usedItemIds.length > 0) {
      inventory = await knex("inventory")
        .where("is_deleted", false)
        .where((builder) => {
          // Filter out null item names before calling toLowerCase()
          const validItemNames = usedItemNames
            .filter((name) => name != null)
            .map((name) => name.toLowerCase());
          if (validItemNames.length > 0) {
            builder.whereIn(knex.raw("LOWER(part_name)"), validItemNames);
          }
          if (usedItemIds.length > 0) {
            builder.orWhereIn("inventory_id", usedItemIds);
          }
        });
    }

    // Step 3: Build product map by matching items to inventory
    const productMap = {};

    usedItemsWithCounts.forEach((item) => {
      const matchedProduct = inventory.find(
        (inv) =>
          inv.part_name?.toLowerCase() === item.item_name?.toLowerCase() ||
          inv.inventory_id === item.item_id,
      );

      if (matchedProduct) {
        const key = matchedProduct.inventory_id;
        if (!productMap[key]) {
          productMap[key] = {
            _id: key,
            product_id: matchedProduct.inventory_id,
            part_name: matchedProduct.part_name || "Unknown",
            category: matchedProduct.category || "N/A",
            description: matchedProduct.description || "",
            quantity: matchedProduct.quantity || 0,
            price: matchedProduct.price || 0,
            appointmentCount: item.appointmentCount || 0,
          };
        }
      }
    });

    // Convert to array and sort by appointment count
    const productReports = Object.values(productMap).sort(
      (a, b) => b.appointmentCount - a.appointmentCount,
    );

    return res.status(200).json(productReports);
  } catch (error) {
    console.error("ERROR in getMaterialReportData:", error);
    return res.status(500).json({
      error: "Error generating material report",
      details: error.message,
    });
  }
}

export async function getProductAppointmentDetails(req, res) {
  try {
    const { product_id, start_date, end_date } = req.params;

    console.log("getProductAppointmentDetails called with:", {
      product_id,
      start_date,
      end_date,
    });

    // Fetch appointments for the date range with full details
    let prefixRows = [];
    try {
      prefixRows = await knex("number_range").whereIn("id_type", [
        "countersales",
        "Appointment",
      ]);
      console.log("Prefix rows fetched:", prefixRows.length);
    } catch (dbError) {
      console.warn(
        "Warning: Could not fetch number_range prefixes:",
        dbError.message,
      );
      // Continue without prefixes - they're optional
    }

    const prefixes = prefixRows.map((p) => p.prefix);

    let query = knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.customer_id",
        "customers.customer_name",
        "customers.phone",
        "customers.street",
        "customers.city",
        "customers.state",
        "customers.leads_owner",
        "appointments.vehicle_id",
        "appointments.plateNumber",
        "appointments.mechanic_id",
        "appointments.km",
        "appointments.appointment_date",
        "appointments.appointment_time",
        "appointments.status",
        "appointments.telecaller",
        "appointments.notes",
        "appointments.feedback",
        "appointments.paid_status",
        "appointments.invoice_date",
        "appointments.paid_amount",
        "appointments.advance_balance",
        "appointments.invoice_amount",
        "appointments.completed_date",
        "appointments.inspection_date",
        "appointments.released_date",
        "appointments.payment_method",
        "appointments.cheque_no",
        "appointments.cheque_date",
        "services_actual.service_id",
        "services_actual.service_description",
        "services_actual.status as service_status",
        "services_actual.service_status as service_actual_status",
        "services_actual.price",
        "services_actual.service_type",
        "services_actual.comments",
        "services_actual.uom",
        "items_required.item_id",
        "items_required.item_name",
        "items_required.qty",
        "items_required.tax",
        "vehicles.make",
        "vehicles.model",
        "vehicles.year",
        "vehicles.vin",
        "vehicles.fuel_type",
      )
      .leftJoin(
        "customers",
        "appointments.customer_id",
        "customers.customer_id",
      )
      .leftJoin(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id",
      )
      .leftJoin(
        "items_required",
        "services_actual.service_id",
        "items_required.service_id",
      )
      .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
      .whereRaw(
        "DATE(appointments.appointment_date) >= ? AND DATE(appointments.appointment_date) <= ?",
        [start_date, end_date],
      );

    // Only add prefix filter if prefixes exist
    if (prefixes && prefixes.length > 0) {
      query = query.where((builder) => {
        prefixes.forEach((p, i) => {
          if (i === 0) {
            builder.where("appointments.appointment_id", "like", `${p}%`);
          } else {
            builder.orWhere("appointments.appointment_id", "like", `${p}%`);
          }
        });
      });
    }

    const appointments = await query.orderBy(
      "appointments.appointment_id",
      "desc",
    );

    // Get product info
    const product = await knex("inventory")
      .where("is_deleted", false)
      .where("inventory_id", product_id)
      .first();

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    console.log("Product found:", {
      inventory_id: product.inventory_id,
      part_name: product.part_name,
    });
    console.log("Total appointments fetched:", appointments.length);

    // Filter and format appointments that contain this product
    const formattedAppointments = [];
    const map = {};

    let matchCount = 0;
    appointments.forEach((row) => {
      // Skip rows without appointment_id (can happen from left joins)
      if (!row.appointment_id) {
        return;
      }

      // Check if this appointment contains the product we're looking for
      const itemName = (row.item_name || "").toString().toLowerCase().trim();
      const productName = (product.part_name || "")
        .toString()
        .toLowerCase()
        .trim();
      const serviceDescription = (row.service_description || "")
        .toString()
        .toLowerCase()
        .trim();

      const isMatch =
        itemName === productName ||
        (row.item_id &&
          product.inventory_id &&
          row.item_id === product.inventory_id) ||
        (row.item_id && row.item_id === product_id) ||
        (serviceDescription.includes(productName) && productName.length > 0) ||
        (productName.includes(serviceDescription) &&
          serviceDescription.length > 0);

      if (!isMatch) {
        // Log non-matching rows for debugging - only if there's item or service data
        if (row.item_name || row.item_id || row.service_description) {
          console.log("No match for:", {
            item_id: row.item_id,
            item_name: row.item_name,
            service_description: row.service_description,
            product_inventory_id: product.inventory_id,
            product_id_param: product_id,
            product_name: product.part_name,
          });
        }
        return;
      }
      matchCount++;

      if (!map[row.appointment_id]) {
        map[row.appointment_id] = {
          _id: `appointment-${row.appointment_id}`,
          appointment_id: row.appointment_id,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          phone: row.phone,
          street: row.street,
          city: row.city,
          state: row.state,
          leads_owner: row.leads_owner,
          vehicle_id: row.vehicle_id,
          plateNumber: row.plateNumber,
          mechanic_id: row.mechanic_id,
          km: row.km,
          appointment_date: row.appointment_date,
          appointment_time: row.appointment_time,
          status: row.status,
          telecaller: row.telecaller,
          notes: row.notes,
          feedback: row.feedback,
          paid_status: row.paid_status,
          invoice_date: row.invoice_date,
          paid_amount: row.paid_amount,
          advance_balance: row.advance_balance,
          invoice_amount: row.invoice_amount,
          completed_date: row.completed_date,
          inspection_date: row.inspection_date,
          released_date: row.released_date,
          payment_method: row.payment_method,
          cheque_no: row.cheque_no,
          cheque_date: row.cheque_date,
          services_actual: [],
          make: row.make,
          model: row.model,
          year: row.year,
          vin: row.vin,
          fuel_type: row.fuel_type,
        };
        formattedAppointments.push(map[row.appointment_id]);
      }

      const appointment = map[row.appointment_id];

      let service = appointment.services_actual.find(
        (s) => s.service_id === row.service_id,
      );

      if (!service && row.service_id) {
        service = {
          _id: `service-${row.service_id}`,
          service_id: row.service_id,
          service_description: row.service_description,
          status: row.service_status,
          service_status: row.service_actual_status,
          price: row.price,
          service_type: row.service_type,
          comments: row.comments,
          uom: row.uom,
          items_required: [],
        };
        appointment.services_actual.push(service);
      }

      if (row.item_id && service) {
        const itemExists = service.items_required.some(
          (item) => item.item_id === row.item_id,
        );
        if (!itemExists) {
          service.items_required.push({
            _id: `item-${row.item_id}`,
            item_id: row.item_id,
            item_name: row.item_name,
            qty: row.qty,
            tax: row.tax,
          });
        }
      }
    });

    console.log("Matched appointments:", matchCount);
    console.log(
      "Formatted appointments returned:",
      formattedAppointments.length,
    );
    return res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("ERROR in getProductAppointmentDetails:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return res.status(500).json({
      error: "Error fetching product appointment details",
      details: error.message,
    });
  }
}

export async function getChatNotifications(req, res) {
  const { userId } = req.params;

  try {
    const chatData = await knex("messages_seen").select("*");

    const unseenMessages = [];

    chatData.forEach((msg) => {
      let parsedSeenBy = {};

      try {
        parsedSeenBy = JSON.parse(msg.seen_by || "{}");
      } catch (err) {
        parsedSeenBy = { seenBy: [] };
      }

      const seenByArray = parsedSeenBy.seenBy || [];

      const isSeen = seenByArray.includes(userId);

      if (!isSeen) {
        unseenMessages.push(msg);
      }
    });

    res.status(200).json({ notifications: unseenMessages });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      error: "Error fetching chat notifications",
      details: error.message,
    });
  }
}

export async function getAppointmentChatMessages(req, res) {
  try {
    const { appointment_id } = req.params;

    // Fetch chat data for appointment
    const chatData = await knex("appointments")
      .where({ appointment_id })
      .first();

    if (!chatData) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Parse chat JSON safely
    let parsedChat = {};

    try {
      parsedChat = JSON.parse(chatData.chat || "{}");
    } catch (err) {
      parsedChat = {}; // fallback
    }

    res.status(200).json({
      appointment_id,
      chat: parsedChat,
    });
  } catch (error) {
    console.error("Error fetching appointment chat:", error);
    res.status(500).json({
      error: "Error fetching appointment chat messages",
      details: error.message,
    });
  }
}

export async function putAppointmentChatMessage(req, res) {
  const { appointment_id } = req.params;
  const { sender_id, message } = req.body;

  try {
    const timestamp = req.tzHelpers.getCurrentDate();

    const [newMessageId] = await knex("appointment_chats").insert({
      appointment_id,
      sender_id,
      message,
      timestamp,
    });

    res.status(200).json({
      message: "Chat message added successfully",
      chatMessage: {
        chat_id: newMessageId,
        appointment_id,
        sender_id,
        message,
        timestamp,
      },
    });
  } catch (error) {
    console.error("Error adding chat message:", error);
    res.status(500).json({
      error: "Error adding chat message",
      details: error.message,
    });
  }
}

export async function updateAppointmentKM(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  const { appointment_id } = req.params;
  const { km } = req.body;

  try {
    // Fetch appointment
    const appointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Detect km change
    const changes = {};
    if (appointment.km !== km) {
      changes.km = {
        old: appointment.km,
        new: km,
      };
    }

    // Log change if something changed
    if (Object.keys(changes).length > 0) {
      await logChange(token, "appointments", "UPDATE", appointment_id, changes);
    }

    // Update km field
    const updated = await knex("appointments")
      .where("appointment_id", appointment_id)
      .update({ km });

    if (!updated) {
      return res.status(400).json({ error: "Failed to update km" });
    }

    // Fetch updated appointment
    const updatedAppointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    res.status(200).json({
      message: "Kilometers updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating km:", error);
    res.status(500).json({
      error: "Error updating km",
      details: error.message,
    });
  }
}

export async function updateNextServiceKm(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  const { appointment_id } = req.params;
  const { next_service_km } = req.body;

  try {
    // Fetch appointment
    const appointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Detect next_service_km change
    const changes = {};
    if (appointment.next_service_km !== next_service_km) {
      changes.next_service_km = {
        old: appointment.next_service_km,
        new: next_service_km,
      };
    }

    // Log change if something changed
    if (Object.keys(changes).length > 0) {
      await logChange(token, "appointments", "UPDATE", appointment_id, changes);
    }

    // Update next_service_km field
    const updated = await knex("appointments")
      .where("appointment_id", appointment_id)
      .update({ next_service_km });

    if (!updated) {
      return res
        .status(400)
        .json({ error: "Failed to update next service km" });
    }

    // Fetch updated appointment
    const updatedAppointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    res.status(200).json({
      message: "Next service km updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating next service km:", error);
    res.status(500).json({
      error: "Error updating next service km",
      details: error.message,
    });
  }
}

export async function addReportedIssue(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const serviceType = "services_actual";

  try {
    const services = req.body; // Array of services

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "No services provided" });
    }

    const appointmentId = req.params.appointment_id;

    for (const service of services) {
      let {
        service_id,
        service_description,
        price,
        uom,
        items_required,
        status,
        service_type,
        service_status,
        advance_payment,
        advance_balance,
      } = service;

      // Check if service exists
      const existingService = await knex(serviceType)
        .where("appointment_id", appointmentId)
        .andWhere("service_id", service_id)
        .first();

      if (existingService) {
        // Update existing service
        await knex(serviceType)
          .where("appointment_id", appointmentId)
          .andWhere("service_id", service_id)
          .update({
            service_description,
            price,
            uom,
            status,
            service_type,
            service_status,
            advance_payment,
            advance_balance,
          });

        // Sync item_required table
        const existingItems = await knex("items_required")
          .where("service_id", service_id)
          .select("item_id");

        const existingIds = existingItems.map((i) => i.item_id);

        for (const item of items_required) {
          if (existingIds.includes(item.item_id)) {
            await knex("items_required")
              .where("service_id", service_id)
              .andWhere("item_id", item.item_id)
              .update(item);
          } else {
            await knex("items_required").insert({
              ...item,
              service_id,
            });
          }

          // Update inventory price if a new price is provided
          if (
            item.price !== undefined &&
            item.price !== null &&
            item.price > 0
          ) {
            const currentInventory = await knex("inventory")
              .where("inventory_id", item.item_id)
              .first();

            if (currentInventory && currentInventory.price !== item.price) {
              await knex("inventory")
                .where("inventory_id", item.item_id)
                .update({ price: item.price });

              console.log(
                `Updated inventory price for ${item.item_id}: ${currentInventory.price} -> ${item.price}`,
              );
            }
          }
        }

        const newIds = items_required.map((i) => i.item_id);
        const toRemove = existingIds.filter((id) => !newIds.includes(id));

        if (toRemove.length > 0) {
          await knex("items_required")
            .where("service_id", service_id)
            .whereIn("item_id", toRemove)
            .del();
        }
      } else {
        // Insert new service
        service_id = await generateServiceId();

        await knex(serviceType).insert({
          service_id,
          appointment_id: appointmentId,
          service_description,
          price,
          uom,
          status,
          service_type,
          service_status,
        });
      }
    }

    // Fetch updated appointment
    const updatedAppointment = await knex("appointments")
      .where("appointment_id", appointmentId)
      .first();

    // Log changes
    await logChange(token, "appointments", "INSERT", appointmentId, services);

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error("Error adding reported issue:", error);
    res.status(400).json({
      error: "Error adding reported issue services",
      details: error.message,
    });
  }
}

export async function markAppointmentAsReleased(req, res) {
  const { appointment_id } = req.params;

  try {
    // Format date dd/mm/yy
    const formattedDate = getFormattedTodayInAppTimezone(req);

    // Update appointment
    const updated = await knex("appointments")
      .where("appointment_id", appointment_id)
      .update({
        status: "released",
        released_date: formattedDate,
      });

    if (!updated) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Fetch updated full record
    const appointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(400).json({
      error: "Error updating appointment status",
      details: error.message,
    });
  }
}

export async function assignMechanicToAppointment(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  const { appointment_id } = req.params;
  const { mechanic_id } = req.body; // ARRAY

  if (!Array.isArray(mechanic_id)) {
    return res.status(400).json({
      error: "mechanic_id must be an array",
    });
  }

  try {
    // Fetch appointment
    const appointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Detect change (JSON comparison)
    const changes = {};
    if (
      JSON.stringify(appointment.mechanic_id) !== JSON.stringify(mechanic_id)
    ) {
      changes.mechanic_id = {
        old: appointment.mechanic_id,
        new: mechanic_id,
      };
    }

    // Log change
    if (Object.keys(changes).length > 0) {
      await logChange(token, "appointments", "UPDATE", appointment_id, changes);
    }

    // Update appointment (stored as JSON)
    const updated = await knex("appointments")
      .where("appointment_id", appointment_id)
      .update({
        mechanic_id: JSON.stringify(mechanic_id), // safe for MySQL
      });

    if (!updated) {
      return res.status(400).json({ error: "Failed to assign mechanic" });
    }

    const updatedAppointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    res.status(200).json({
      message: "Mechanics assigned successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error assigning mechanic:", error);
    res.status(400).json({
      error: "Error assigning mechanic",
      details: error.message,
    });
  }
}

export async function ChatNotifications(req, res) {
  const { userId, messageId, appointmentId } = req.body;

  try {
    const chat_data = await knex("messages_seen").where({
      appointment_id: appointmentId,
      message_id: messageId,
    });

    if (!chat_data || chat_data.length === 0) {
      return res.status(404).json({ error: "Message not found." });
    }

    const seenByObj = JSON.parse(chat_data[0].seen_by);
    const seenByArray = seenByObj.seenBy || [];

    // Add user if not already in the seenBy array
    if (!seenByArray.includes(userId)) {
      seenByArray.push(userId);
    }

    await knex("messages_seen")
      .where({ appointment_id: appointmentId, message_id: messageId })
      .update({ seen_by: JSON.stringify({ seenBy: seenByArray }) });

    return res.status(200).json({});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function clearAllChatNotifications(req, res) {
  const { userId, messages } = req.body;

  try {
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    // Process all messages in parallel and wait for completion
    await Promise.all(
      messages.map(async (msg) => {
        const appointmentId = msg.appointment_id;
        const messageId = msg.message_id;

        const chat_data = await knex("messages_seen").where({
          appointment_id: appointmentId,
          message_id: messageId,
        });

        if (!chat_data || chat_data.length === 0) {
          return; // Skip if no data found
        }

        const seenByObj = JSON.parse(chat_data[0].seen_by);
        const seenByArray = seenByObj.seenBy || [];

        if (!seenByArray.includes(userId)) {
          seenByArray.push(userId);
        }

        await knex("messages_seen")
          .where({ appointment_id: appointmentId, message_id: messageId })
          .update({ seen_by: JSON.stringify({ seenBy: seenByArray }) });
      }),
    );

    return res.status(200).json({});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateVisualInspection(req, res) {
  const { appointment_id } = req.params;
  const { images, name } = req.body; // Expecting base64 images & name

  try {
    // Check if appointment exists
    const appointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Parse existing images
    let existingImages = {};
    if (appointment.visual_inspection_in) {
      existingImages = JSON.parse(appointment.visual_inspection_in);
    }

    // Save each base64 image
    images.forEach((image) => {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const imageUUID = uuidv4();

      const fileName = `${name}.png`;

      // Create directory if needed
      const dirPath = `visual_inspection/${appointment_id}/`;
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const filePath = path.join(dirPath, fileName);
      fs.writeFileSync(filePath, base64Data, { encoding: "base64" });

      existingImages[imageUUID] = filePath;
    });

    // Update images in DB
    await knex("appointments")
      .where("appointment_id", appointment_id)
      .update({
        visual_inspection_in: JSON.stringify(existingImages),
      });

    // Handle comments
    const comments = req.body.comments || "";
    if (comments) {
      const existingComments = appointment.visual_inspection_comments
        ? JSON.parse(appointment.visual_inspection_comments)
        : {};

      existingComments[name] = comments;

      await knex("appointments")
        .where("appointment_id", appointment_id)
        .update({
          visual_inspection_comments: JSON.stringify(existingComments),
        });
    }

    return res.status(200).json({
      message: "Images saved and database updated successfully.",
    });
  } catch (error) {
    console.error("Error updating appointment status:", error.message);
    return res.status(400).json({
      error: "Error updating appointment status",
      details: error.message,
    });
  }
}

export async function searchFeedback(req, res) {
  console.log("Hitting SF endpoint");
  const { search } = req.query;
  console.log("Search Term:", search);

  if (!search) {
    return res.status(400).json({ error: "Search term is required." });
  }

  try {
    const appointments = await knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.customer_id",
        "customers.customer_name",
        "customers.phone",
        "customers.advance_payment",
        "customers.street",
        "customers.city",
        "customers.state",
        "appointments.vehicle_id",
        "appointments.plateNumber",
        "appointments.mechanic_id",
        "appointments.km",
        "appointments.appointment_date",
        "appointments.appointment_time",
        "appointments.status",
        "appointments.telecaller",
        "appointments.notes",
        "appointments.feedback",
        "appointments.paid_status",
        "appointments.invoice_date",
        "appointments.paid_amount",
        "appointments.advance_payment",
        "appointments.advance_balance",
        "appointments.invoice_amount",
        "appointments.completed_date",
        "appointments.inspection_date",
        "appointments.released_date",
        "services_actual.service_id",
        "services_actual.service_description",
        "services_actual.status as service_status",
        "services_actual.service_status as service_actual_status",
        "services_actual.price",
        "services_actual.service_type",
        "services_actual.comments",
        "services_actual.uom",
        "items_required.item_id",
        "items_required.item_name",
        "items_required.qty",
        "items_required.tax",
        "items_required.price",
        "vehicles.make",
        "vehicles.model",
        "vehicles.year",
        "vehicles.vin",
        "vehicles.fuel_type",
      )
      .leftJoin(
        "customers",
        "appointments.customer_id",
        "customers.customer_id",
      )
      .leftJoin(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id",
      )
      .leftJoin(
        "items_required",
        "services_actual.service_id",
        "items_required.service_id",
      )
      .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
      .where((builder) => {
        builder
          .where("appointments.appointment_id", "like", `%${search}%`)
          .orWhere("customers.customer_name", "like", `%${search}%`)
          .orWhere("customers.phone", "like", `%${search}%`)
          .orWhere("appointments.notes", "like", `%${search}%`);
      })
      .orderBy("appointments.appointment_id");

    if (appointments.length === 0) {
      return res
        .status(404)
        .json({ message: "No matching appointments or feedback found." });
    }

    const formattedAppointments = [];
    const appointmentMap = {};

    appointments.forEach((row) => {
      if (!appointmentMap[row.appointment_id]) {
        appointmentMap[row.appointment_id] = {
          _id: `appointment-${row.appointment_id}`,
          appointment_id: row.appointment_id,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          phone: row.phone,
          street: row.street,
          city: row.city,
          state: row.state,
          vehicle_id: row.vehicle_id,
          plateNumber: row.plateNumber,
          mechanic_id: row.mechanic_id,
          km: row.km,
          appointment_date: row.appointment_date,
          appointment_time: row.appointment_time,
          status: row.status,
          telecaller: row.telecaller,
          notes: row.notes,
          feedback: row.feedback,
          paid_status: row.paid_status,
          invoice_date: row.invoice_date,
          paid_amount: row.paid_amount,
          advance_payment: row.advance_balance,
          advance_balance: row.advance_balance,
          invoice_amount: row.invoice_amount,
          completed_date: row.completed_date,
          inspection_date: row.inspection_date,
          released_date: row.released_date,
          services_actual: [],
          make: row.make,
          model: row.model,
          year: row.year,
          vin: row.vin,
          fuel_type: row.fuel_type,
        };
        formattedAppointments.push(appointmentMap[row.appointment_id]);
      }

      const appointment = appointmentMap[row.appointment_id];

      let service = appointment.services_actual.find(
        (s) => s.service_id === row.service_id,
      );

      if (!service) {
        service = {
          _id: `service-${row.service_id}`,
          service_id: row.service_id,
          service_description: row.service_description,
          status: row.service_status,
          service_status: row.service_actual_status,
          price: row.price,
          service_type: row.service_type,
          comments: row.comments,
          uom: row.uom,
          items_required: [],
        };
        appointment.services_actual.push(service);
      }

      if (row.item_id) {
        const itemExists = service.items_required.some(
          (item) => item.item_id === row.item_id,
        );
        if (!itemExists) {
          service.items_required.push({
            _id: `item-${row.item_id}`,
            item_id: row.item_id,
            item_name: row.item_name,
            qty: row.qty,
            tax: row.tax,
            discount: row.discount,
          });
        }
      }
    });

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching feedback data:", error);
    res.status(500).json({
      error: "Error fetching feedback data",
      details: error.message,
    });
  }
}

export async function updateFeedback(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const { appointment_id } = req.params;
    const newFeedback = req.body.feedback;

    // Ensure feedback is provided and is an array
    if (!Array.isArray(newFeedback) || newFeedback.length === 0) {
      return res
        .status(400)
        .json({ error: "Feedback data is required and should be an array" });
    }

    // Retrieve the current feedback data
    const appointment = await knex("appointments")
      .where({ appointment_id })
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Parse existing feedback safely
    let currentFeedback = [];
    try {
      currentFeedback = appointment.feedback
        ? JSON.parse(appointment.feedback)
        : [];

      if (!Array.isArray(currentFeedback)) {
        currentFeedback = [];
      }
    } catch (e) {
      console.log("Error parsing current feedback:", e);
      currentFeedback = [];
    }

    // Generate unique incremental IDs
    newFeedback.forEach((feedbackEntry, index) => {
      feedbackEntry.id = currentFeedback.length + index + 1;
    });

    // Track what changed
    const changes = {
      old_feedback: [...currentFeedback],
      new_feedback: [...currentFeedback, ...newFeedback],
    };

    // Add the new entries
    currentFeedback.push(...newFeedback);

    // Save to DB
    const updated = await knex("appointments")
      .where({ appointment_id })
      .update({ feedback: JSON.stringify(currentFeedback) });

    if (!updated) {
      return res
        .status(404)
        .json({ error: "Failed to update appointment feedback" });
    }

    // Log the update
    await logChange(token, "appointments", "UPDATE", appointment_id, changes);

    // Response
    res.status(200).json({
      message: "Feedback updated successfully",
      feedback: currentFeedback,
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({
      error: "Error updating feedback",
      details: error.message,
    });
  }
}

export async function getAllFeedbacks(req, res) {
  try {
    const appointments = await knex("appointments")
      .select("appointment_id", "feedback")
      .orderBy(
        knex.raw(`
          CASE
            WHEN JSON_UNQUOTE(
              JSON_EXTRACT(
                appointments.feedback,
                CONCAT('$[', JSON_LENGTH(appointments.feedback) - 1, '].scheduledDate')
              )
            ) IS NULL OR JSON_UNQUOTE(
              JSON_EXTRACT(
                appointments.feedback,
                CONCAT('$[', JSON_LENGTH(appointments.feedback) - 1, '].scheduledDate')
              )
            ) = '' THEN 3

            WHEN JSON_UNQUOTE(
              JSON_EXTRACT(
                appointments.feedback,
                CONCAT('$[', JSON_LENGTH(appointments.feedback) - 1, '].scheduledDate')
              )
            ) = CURDATE() THEN 0

            WHEN JSON_UNQUOTE(
              JSON_EXTRACT(
                appointments.feedback,
                CONCAT('$[', JSON_LENGTH(appointments.feedback) - 1, '].scheduledDate')
              )
            ) < CURDATE() THEN 1

            ELSE 2
          END
        `),
        "asc",
      )
      .orderBy(
        knex.raw(`
          JSON_UNQUOTE(
            JSON_EXTRACT(
              appointments.feedback,
              CONCAT('$[', JSON_LENGTH(appointments.feedback) - 1, '].scheduledDate')
            )
          )
        `),
        "asc",
      );

    const allFeedbackData = appointments
      .map((appointment) => {
        try {
          const feedbackData = appointment.feedback
            ? JSON.parse(appointment.feedback)
            : [];

          return feedbackData.map((feedbackEntry) => ({
            appointment_id: appointment.appointment_id,
            ...feedbackEntry,
          }));
        } catch (err) {
          console.log("JSON parse error:", err);
          return [];
        }
      })
      .flat();

    res.status(200).json(allFeedbackData);
  } catch (error) {
    console.error("Error fetching all feedback data:", error);
    res.status(500).json({
      error: "Error fetching all feedback data",
      details: error.message,
    });
  }
}

export async function getFeedbackById(req, res) {
  try {
    // Retrieve all appointments with feedback
    const appointments = await knex("appointments").select(
      "appointment_id",
      "feedback",
    );

    // Format the feedback data for each appointment
    const allFeedbackData = appointments
      .map((appointment) => {
        let feedbackData;
        try {
          feedbackData = appointment.feedback
            ? JSON.parse(appointment.feedback)
            : [];
        } catch (e) {
          feedbackData = [];
        }

        return feedbackData.map((feedbackEntry) => ({
          appointment_id: appointment.appointment_id,
          feedback: [
            {
              callStatus: feedbackEntry.callStatus,
              notAttend: feedbackEntry.callStatus !== "Attended" ? 1 : 0,
              scheduledDate:
                feedbackEntry.callStatus === "Call Back Later"
                  ? formatDate(feedbackEntry.scheduledDate)
                  : feedbackEntry.scheduledDate,
              callFeedback: feedbackEntry.callFeedback,
              comment: feedbackEntry.comment,
            },
          ],
        }));
      })
      .flat(); // Flatten the array of arrays

    res.status(200).json(allFeedbackData);
  } catch (error) {
    console.error("Error fetching all feedback data:", error);
    res.status(500).json({
      error: "Error fetching all feedback data",
      details: error.message,
    });
  }
}

export async function getAllAppointmentsToInvoice(req, res) {

  try {
    const appointmentToInvoice = await knex("appointment_to_invoice").select(
      "*",
    );
    res.status(200).json(appointmentToInvoice);
  } catch (error) {
    console.error("Error fetching appointment_to_invoice entries:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
}

// route to delete the items in the visual_inspection_in

export async function deleteVisualInspectionImageItem(req, res) {
  try {
    console.log("req.params", req.params);

    const { appointment_id, name } = req.params;
    const pngName = `${name}.png`.toLowerCase();

    // Fetch the appointment
    const appointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Parse stored JSON data
    let visualInspectionIn;
    try {
      visualInspectionIn = JSON.parse(appointment.visual_inspection_in);
    } catch (err) {
      return res.status(500).json({ error: "Invalid JSON format in DB" });
    }

    console.log("visualInspectionIn from DB:", visualInspectionIn);

    // Find key where value matches the file
    let keyToDelete = null;

    for (const key in visualInspectionIn) {
      const value = visualInspectionIn[key];

      if (!value || typeof value !== "string") continue;

      const lowerValue = value.toLowerCase();

      // Match ANY of these:
      // "Back-View"
      // "Back-View.png"
      // "/path/.../Back-View.png"
      if (
        lowerValue.includes(name.toLowerCase()) ||
        lowerValue.includes(pngName)
      ) {
        keyToDelete = key;
        break;
      }
    }

    if (!keyToDelete) {
      // No DB entry, but try deleting file anyway
      const filePath = path.join(
        "visual_inspection",
        appointment_id,
        `${name}.png`,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res
          .status(200)
          .json({ message: "File deleted from folder, no DB entry existed" });
      }

      return res.status(404).json({
        error: `Item '${pngName}' not found in DB or filesystem`,
      });
    }

    console.log("Deleting key:", keyToDelete);

    // Remove key
    delete visualInspectionIn[keyToDelete];

    // Update DB
    await knex("appointments")
      .where("appointment_id", appointment_id)
      .update({ visual_inspection_in: JSON.stringify(visualInspectionIn) });

    // Construct file path
    const filePath = path.join(
      "visual_inspection",
      appointment_id,
      `${name}.png`,
    );

    // Delete file only if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Deleted file:", filePath);
    } else {
      console.log("File not found:", filePath);
    }

    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error in deleting item:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateVisualInspectionComments(req, res) {
  const { appointment_id, name } = req.params;
  const appointment = await knex("appointments")
    .where("appointment_id", appointment_id)
    .first();
  // check if comment exists
  const comments = req.body.comments ? req.body.comments : "";
  if (comments) {
    // Construct the JSON object with image file name as key and comments as value
    // const commentsObject = {
    //   [name]: comments // Assuming 'name' is the image file name
    // };
    // get the existing comments and combine with the new comments
    const existingComments = JSON.parse(appointment.visual_inspection_comments);
    existingComments[name] = comments;
    const combinedComments = JSON.stringify(existingComments);
    // Update the database with the JSON stringified comments object
    await knex("appointments")
      .where("appointment_id", appointment_id)
      .update({ visual_inspection_comments: combinedComments });
  }
}

export async function updateVisualInspections(req, res) {
  const { appointment_id } = req.params;
  const { name, comment } = req.body; // Destructure name and comment from req.body

  try {
    const appointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (comment) {
      // Get the existing comments and combine with the new comments
      const existingComments = appointment.visual_inspection_comments
        ? JSON.parse(appointment.visual_inspection_comments)
        : {};
      existingComments[name] = comment;
      const combinedComments = JSON.stringify(existingComments);

      // Update the database with the JSON stringified comments object
      await knex("appointments")
        .where("appointment_id", appointment_id)
        .update({ visual_inspection_comments: combinedComments });

      return res.status(200).json({ message: "Comments updated successfully" });
    } else {
      return res.status(400).json({ error: "Comment is required" });
    }
  } catch (error) {
    console.error("Error updating comments:", error);
    res.status(500).json({
      error: "Error updating comments",
      details: error.message,
    });
  }
}

export async function getVisualInspectionAttachmentImage(req, res) {
  const { appointment_id, image_name } = req.params;

  console.log("Requested image:", image_name);

  const imagePath = path.resolve(
    __dirname,
    "..",
    "visual_inspection",
    appointment_id,
    "attachments",
    image_name,
  );

  console.log("Looking for file at:", imagePath);

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: "Image not found" });
  }

  return res.sendFile(imagePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(err.status || 500).end();
    }
  });
}

export async function deleteVisualInspectionAttachmentImageItem(req, res) {
  try {
    console.log("req.params", req.params);
    const { appointment_id, name } = req.params;

    // Decode the name in case it's URL-encoded (like spaces as '%20')
    const decodedName = decodeURIComponent(name);

    // Fetch the appointment
    const appointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    // Check if appointment exists
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Parse the visual_inspection_in field
    const visualInspectionIn = JSON.parse(appointment.visual_inspection_in);

    // Log to debug
    // console.log("visualInspectionIn before deletion:", visualInspectionIn);

    // Find the key where the value contains the string "test"
    let keyToDelete = null;
    for (const key in visualInspectionIn) {
      if (visualInspectionIn[key].includes(decodedName)) {
        keyToDelete = key;
        break;
      }
    }

    // If the key is not found, return an error
    if (!keyToDelete) {
      return res.status(404).json({
        error: `Item with value containing '${decodedName}' not found`,
      });
    }

    // Delete the item from the object
    delete visualInspectionIn[keyToDelete];

    // Update the database with the modified object
    const updated = await knex("appointments")
      .where("appointment_id", appointment_id)
      .update({ visual_inspection_in: JSON.stringify(visualInspectionIn) });

    if (updated) {
      // delete the item from the file system
      fs.unlinkSync(
        `visual_inspection/${appointment_id}/attachments/${name}.png`,
      );
      return res.status(200).json({ message: "Item deleted successfully" });
    } else {
      return res
        .status(400)
        .json({ error: "Failed to update the appointment" });
    }
  } catch (error) {
    console.error("Error in deleting item:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// console.log(req.body);

export async function updateVisualInspectionAttachments(req, res) {
  // console.log(req.body);
  const { appointment_id } = req.params;
  const { images } = req.body; // Expecting an array of base64 images
  const name = req.body.name;

  try {
    // Check if the appointment exists
    const appointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Retrieve existing images from the database
    let existingImages = {};
    if (appointment.visual_inspection_in) {
      existingImages = JSON.parse(appointment.visual_inspection_in); // Parse existing images
    }

    // Convert each base64 image to original image and save in /visual_inspection folder
    images.forEach((image) => {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const imageUUID = uuidv4(); // Generate a unique UUID for the image
      const fileName = `${name}.png`; // Use UUID for the file name
      // create the folder if not exists with appointment_id
      if (!fs.existsSync(`visual_inspection/${appointment_id}/attachments`)) {
        fs.mkdirSync(`visual_inspection/${appointment_id}/attachments`, {
          recursive: true,
        });
      }
      const filePath = path.join(
        `visual_inspection/${appointment_id}/attachments`,
        fileName,
      );
      fs.writeFileSync(filePath, base64Data, { encoding: "base64" });
      existingImages[imageUUID] = filePath; // Add to the existing images object
    });

    // Update the database with the combined images object
    await knex("appointments")
      .where("appointment_id", appointment_id)
      .update({
        visual_inspection_in: JSON.stringify(existingImages), // Store the updated images object in the database
      });
    // check if comment exists
    const comments = req.body.comments ? req.body.comments : "";
    if (comments) {
      // Construct the JSON object with image file name as key and comments as value
      // const commentsObject = {
      //   [name]: comments // Assuming 'name' is the image file name
      // };
      // get the existing comments and combine with the new comments
      const existingComments = JSON.parse(
        appointment.visual_inspection_comments,
      );
      existingComments[name] = comments;
      const combinedComments = JSON.stringify(existingComments);
      // Update the database with the JSON stringified comments object
      await knex("appointments")
        .where("appointment_id", appointment_id)
        .update({ visual_inspection_comments: combinedComments });
    }

    return res
      .status(200)
      .json({ message: "Images saved and database updated successfully." });
  } catch (error) {
    console.error("Error updating visual inspection attachments:", error);
    res.status(500).json({
      error: "Error updating visual inspection attachments",
      details: error.message,
    });
  }
}

// getActualServicesByAppointmentId

export async function getActualServicesByAppointmentId(req, res) {
  try {
    const servicesData = await knex("services_actual")
      .select(
        "services_actual.service_id",
        "services_actual.inspection_status",
        "services_actual.appointment_id",
        "services_actual.service_description",
        "services_actual.status",
        "services_actual.service_status",
        "services_actual.price",
        "services_actual.service_type",
        "services_actual.comments",
        "items_required.item_id",
        "items_required.item_name",
        "items_required.qty",
        "items_required.tax",
        "items_required.price",
        "items_required.pr_no",
      )
      .leftJoin(
        "items_required",
        "services_actual.service_id",
        "items_required.service_id",
      )
      .where("services_actual.appointment_id", req.params.appointment_id);

    const formattedServices = [];
    const serviceMap = {};

    servicesData.forEach((row) => {
      if (!serviceMap[row.service_id]) {
        let parsedComments = [];

        if (row.comments) {
          try {
            parsedComments = JSON.parse(row.comments);
            if (!Array.isArray(parsedComments)) parsedComments = [];
          } catch {
            parsedComments = [{ comments: row.comments, current_date: null }];
          }
        }

        const lastComment =
          parsedComments.length > 0
            ? parsedComments[parsedComments.length - 1]
            : null;

        serviceMap[row.service_id] = {
          _id: `service-${row.service_id}`,
          service_id: row.service_id,
          service_description: row.service_description,
          inspection_status: row.inspection_status,
          status: row.status,
          service_status: row.service_status,
          price: row.price,
          service_type: row.service_type,
          comments: lastComment?.comments || "",
          items_required: [],
          pr_no: row.pr_no,
        };

        formattedServices.push(serviceMap[row.service_id]);
      }

      if (row.item_id) {
        serviceMap[row.service_id].items_required.push({
          _id: `item-${row.item_id}`,
          item_id: row.item_id,
          item_name: row.item_name,
          qty: row.qty,
          tax: parseInt(row.tax),
        });
      }
    });

    res.status(200).json({
      _id: `appointment-${req.params.appointment_id}`,
      services_actual: formattedServices,
    });
  } catch (error) {
    console.error("Error fetching services_actual:", error);
    res.status(500).json({
      error: "Error fetching services_actual",
      details: error.message,
    });
  }
}

export async function updateServiceStatus(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const { service_status } = req.body;
  const { appointment_id, service_id } = req.params;

  try {
    // Fetch the current service data from the database
    const currentService = await knex("services_actual")
      .where("appointment_id", appointment_id)
      .andWhere("service_id", service_id)
      .first();

    if (!currentService) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Compare current data with new data to identify changes
    const changes = {};
    if (currentService.service_status !== service_status) {
      changes["service_status"] = {
        old: currentService.service_status,
        new: service_status,
      };
    }

    // If there are changes, log them
    if (Object.keys(changes).length > 0) {
      await logChange(token, "services_actual", "UPDATE", service_id, changes);
    }

    // Update the service status in the database
    const updated = await knex("services_actual")
      .where("appointment_id", appointment_id)
      .andWhere("service_id", service_id)
      .update({ service_status });

    if (updated) {
      const appointment = await knex("appointments")
        .where("appointment_id", appointment_id)
        .first();
      res
        .status(200)
        .json({ message: "Service status updated successfully", changes });
    } else {
      res.status(404).json({ message: "Service not updated" });
    }
  } catch (error) {
    console.error("Error updating service status:", error.message);
    res.status(500).json({
      error: "Error updating service status",
      details: error.message,
    });
  }
}

export async function purgeVisualInspectionData(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  const { appointment_id } = req.params;
  const formattedDate = getFormattedTodayInAppTimezone(req);

  try {
    // Step 1: Fetch the current appointment details
    const currentAppointment = await knex("appointments")
      .where({ appointment_id })
      .first();

    if (!currentAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Step 2: Detect changes
    const changes = {};
    if (currentAppointment.status !== "inspection") {
      changes.status = {
        old: currentAppointment.status,
        new: "inspection",
      };
    }
    if (currentAppointment.inspection_date !== formattedDate) {
      changes.inspection_date = {
        old: currentAppointment.inspection_date,
        new: formattedDate,
      };
    }

    // Log changes only if there are differences
    if (Object.keys(changes).length > 0) {
      await logChange(token, "appointments", "UPDATE", appointment_id, changes);
    } else {
      return res.status(200).json({
        message: "No changes made. Appointment is already up-to-date.",
      });
    }

    // Step 3: Update the appointment
    const updated = await knex("appointments")
      .where({ appointment_id })
      .update({
        status: "inspection",
        inspection_date: formattedDate,
      });

    if (!updated) {
      return res.status(400).json({ error: "Failed to update appointment" });
    }

    // Step 4: Fetch and respond with the updated appointment details
    const updatedAppointment = await knex("appointments")
      .where({ appointment_id })
      .first();

    res.status(200).json({
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment status:", error.message);
    res.status(400).json({
      error: "Error updating appointment status",
      details: error.message,
    });
  }
}

export async function generateInvoice(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  console.log("Generating Invoice...");

  const { appointment_id } = req.params;

  try {
    const existingInvoice = await knex("appointment_to_invoice")
      .where({ appointment_id: appointment_id, invoice_status: "active" })
      .first();

    if (existingInvoice) {
      await knex("appointment_to_invoice")
        .where({ appointment_id: appointment_id, invoice_status: "active" })
        .update({ invoice_status: "cancel" });
    }

    const invoiceID = await generateInvoiceId();

    let appointmentToInvoice = {
      appointment_id: appointment_id,
      invoice_id: invoiceID,
      invoice_status: "active",
    };

    await knex("appointment_to_invoice").insert(appointmentToInvoice);

    res.status(200).json({
      message: "New Invoice ID generated successfully, old invoice canceled",
      invoice_id: invoiceID,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({
      error: "Error generating invoice",
      details: error.message,
    });
  }
}

export async function updateInspectionStatus(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  const { inspection_status } = req.body;
  const { service_id } = req.params;

  try {
    const service = await knex("services_actual")
      .where("service_id", service_id)
      .first();

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const changes = {};
    if (service.inspection_status !== inspection_status) {
      changes.inspection_status = {
        old: service.inspection_status,
        new: inspection_status,
      };
    }

    if (
      inspection_status === "pending" &&
      service.service_status !== "Not Started"
    ) {
      changes.service_status = {
        old: service.service_status,
        new: "Not Started",
      };
      await knex("services_actual")
        .where("service_id", service_id)
        .update({ inspection_status, service_status: "Not Started" });
    } else {
      await knex("services_actual")
        .where("service_id", service_id)
        .update({ inspection_status });
    }

    if (Object.keys(changes).length > 0) {
      await logChange(token, "services_actual", "UPDATE", service_id, changes);
    }

    res.status(200).json({
      message: "Inspection status updated successfully",
      changes,
    });
  } catch (error) {
    console.error("Error updating inspection status:", error.message);
    res.status(500).json({
      error: "Error updating inspection status",
      details: error.message,
    });
  }
}

export async function updateInvoiceAmount(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const {
    Invoice_Amount,
    advance_payment,
    advance_balance,
    payment_method,
    paymentMode,
    paid_status,
    Paid_Amount,
    cheque_no,
    cheque_date,
    payment_log,
    invoice_id,
    invoice_date,
  } = req.body;

  const { appointment_id } = req.params;

  try {
    /**
     * STEP 1: GET OR CREATE INVOICE ID
     */
    let invoiceID = invoice_id;

    if (!invoiceID) {
      const existingInvoice = await knex("appointment_to_invoice")
        .where("appointment_id", appointment_id)
        // .whereIn("invoice_status", ["inactive", "active"])
         .whereIn("invoice_status", [ "active"])
        .first();

      if (existingInvoice) {
        invoiceID = existingInvoice.invoice_id;
      } else {
        invoiceID = await generateInvoiceId();
        await knex("appointment_to_invoice").insert({
          appointment_id,
          invoice_id: invoiceID,
          // invoice_status: "inactive",
          invoice_status: "active",
        });
      }
    }

    /**
     * STEP 2: GET APPOINTMENT
     */
    const currentAppointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    if (!currentAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const today = req.tzHelpers ? req.tzHelpers.format(new Date(), "YYYY-MM-DD") : new Date().toISOString().split("T")[0];

    // ✅ FIXED (normalize)
    const finalPaymentMode = (paymentMode || payment_method || "").toLowerCase();

    /**
     * STEP 3: BUILD UPDATE DATA
     */
    const updateData = {
      Invoice_Amount,
      advance_payment,
      advance_balance,
      status: "invoiced",
    };

    //  Date validation


    if (invoice_date) {
      updateData.invoice_date = invoice_date;
    } else if (!currentAppointment.invoice_date) {
      updateData.invoice_date = today;
    }

    if (paid_status !== undefined) {
      updateData.paid_status = paid_status;
    }

    //  MAIN FIX (cash / credit logic)
    if (finalPaymentMode === "cash") {
      updateData.paid_amount = Number(Invoice_Amount || 0);
    } else if (finalPaymentMode === "credit") {
      updateData.paid_amount = 0;

    } else if (Paid_Amount !== undefined && Paid_Amount !== null) {
      updateData.paid_amount = Number(Paid_Amount);
    }

    if (finalPaymentMode) {
      updateData.payment_method = finalPaymentMode;
    }

    if (cheque_no !== undefined) {
      updateData.cheque_no = cheque_no;
    }

    if (cheque_date !== undefined) {
      updateData.cheque_date = cheque_date;
    }

    if (payment_log !== undefined) {
      updateData.payment_logs = JSON.stringify(payment_log);
    }

    /**
     * STEP 4: UPDATE APPOINTMENT
     */
    await knex("appointments")
      .where("appointment_id", appointment_id)
      .update(updateData);

    const updatedAppointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    /**
     * STEP 5: FINANCE (INVOICE BASED)
     */
    if (finalPaymentMode && Invoice_Amount) {
      await knex("finance").where({ invoice_no: invoiceID }).del();

      const financeEntries = [];
      const todayFinance = req.tzHelpers ? req.tzHelpers.format(new Date(), "YYYY-MM-DD") : new Date().toISOString().split("T")[0];

      if (finalPaymentMode === "cash") {
        financeEntries.push({
          appointment_id,
          customer_id: currentAppointment.customer_id,
          creation_date: todayFinance,
          debit: Invoice_Amount,
          expense_type: "Debit",
          description: `Debit against invoice #${invoiceID}`,
          invoice_no: invoiceID,
          type: "customer",
        });

        financeEntries.push({
          appointment_id,
          customer_id: currentAppointment.customer_id,
          creation_date: todayFinance,
          credit: Invoice_Amount,
          expense_type: "Credit",
          description: `Credit against invoice #${invoiceID}`,
          invoice_no: invoiceID,
          type: "customer",
        });
      } else if (finalPaymentMode === "credit") {
        financeEntries.push({
          appointment_id,
          customer_id: currentAppointment.customer_id,
          creation_date: todayFinance,
          credit: Invoice_Amount,
          expense_type: "Credit",
          description: `Credit against invoice #${invoiceID}`,
          invoice_no: invoiceID,
          type: "customer",
        });
      }

      if (financeEntries.length > 0) {
        await knex("finance").insert(financeEntries);
      }
    }

    /**
     * STEP 6: RESPONSE
     */
    return res.status(200).json({
      message: "Invoice amount updated successfully",
      invoice_id: invoiceID,
      appointment_id,
      invoice_date: updatedAppointment.invoice_date,
      paid_amount: updatedAppointment.paid_amount, // ✅ added for confirmation
    });
  } catch (error) {
    console.error("Error updating invoice amount:", error);
    return res.status(500).json({
      error: "Error updating invoice amount",
      details: error.message,
    });
  }
}
// export async function updateAppointmentStatusById(req, res) {
//   const authHeader = req.headers.authorization;
//   const token = authHeader && authHeader.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: "Authorization token is required",
//     });
//   }

//   try {
//     const { appointment_id } = req.params;
//     const { status } = req.body;

//     if (!appointment_id || !status) {
//       return res.status(400).json({
//         success: false,
//         message: "appointment_id and status are required",
//       });
//     }

//     // Fetch current appointment to validate transition
//     const currentAppointment = await knex("appointments")
//       .where({ appointment_id })
//       .first();

//     if (!currentAppointment) {
//       return res.status(404).json({
//         success: false,
//         message: "Appointment not found",
//       });
//     }

//     const currentStatus = currentAppointment.status;

//     // Define allowed status transitions
//     const allowedTransitions = {
//       "invoice": ["inspection", "invoiced", "released"],
//       "inspection": ["invoiced", "released"],
//       "invoiced": ["released"],
//       "released": ["invoiced"],
//     };

//     // Validate if transition is allowed
//     if (currentStatus !== status) {
//       const allowedNextStatuses = allowedTransitions[currentStatus];

//       if (!allowedNextStatuses || !allowedNextStatuses.includes(status)) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid status transition from '${currentStatus}' to '${status}'. Allowed transitions: ${allowedNextStatuses ? allowedNextStatuses.join(", ") : "none"}`,
//         });
//       }
//     }

//     // Track changes for logging
//     const changes = {
//       status: {
//         old: currentStatus,
//         new: status,
//       },
//     };

//     const affectedRows = await knex("appointments")
//       .where({ appointment_id })
//       .update({
//         status,
//       });

//     if (affectedRows === 0) {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to update appointment status",
//       });
//     }

//     // Log the change
//     await logChange(token, "appointments", "UPDATE", appointment_id, changes);

//     return res.status(200).json({
//       success: true,
//       message: `Appointment status updated successfully from '${currentStatus}' to '${status}'`,
//       data: {
//         appointment_id,
//         old_status: currentStatus,
//         new_status: status,
//       },
//     });
//   } catch (error) {
//     console.error("Update status error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       details: error.message,
//     });
//   }
// };

export async function releaseAppointment(req, res) {
  const { appointment_id } = req.params;

  try {
    const updated = await knex("appointments")
      .where("appointment_id", appointment_id)
      .update({
        status: "released",
        released_date: formatShortDate(),
      });

    if (!updated) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const appointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    res.status(200).json(appointment);
  } catch (error) {
    res.status(400).json({
      error: "Error updating appointment status",
      details: error.message,
    });
  }
}

export function formatShortDate(date = new Date()) {
  return `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${(
    "0" + date.getDate()
  ).slice(-2)}`;
}

export async function updateAppointmentStatusById(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required",
    });
  }

  try {
    const { appointment_id } = req.params;
    const { status } = req.body;

    if (!appointment_id || !status) {
      return res.status(400).json({
        success: false,
        message: "appointment_id and status are required",
      });
    }

    // 🔹 Fetch current appointment
    const currentAppointment = await knex("appointments")
      .where({ appointment_id })
      .first();

    if (!currentAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const currentStatus = currentAppointment.status;

    // 🔹 Allowed status transitions
    const allowedTransitions = {
      scheduled: ["inspection", "invoice"],
      inspection: ["invoice", "invoiced", "released"],
      invoice: ["invoiced", "released"],
      invoiced: ["released"],
      released: ["invoice", "invoiced"],
    };

    if (!allowedTransitions[currentStatus]) {
      return res.status(400).json({
        success: false,
        message: `Unknown current status '${currentStatus}'`,
      });
    }

    // 🔹 TRANSACTION
    await knex.transaction(async (trx) => {
      // 1️⃣ Update appointment status
      const updated = await trx("appointments")
        .where({ appointment_id })
        .update({ status });

      if (!updated) {
        throw new Error("Failed to update appointment status");
      }

      // 2️⃣ Get services_actual
      const serviceActual = await trx("services_actual")
        .where({ appointment_id })
        .first();

      if (!serviceActual) return;

      // ✅ INSPECTION → only service_status completed
      if (status === "inspection") {
        await trx("services_actual").where({ appointment_id }).update({
          service_status: "Completed",
          comments: "Auto process completed (inspection)",
        });
      }

      // ✅ INVOICE → both completed
      if (status === "invoice") {
        await trx("services_actual").where({ appointment_id }).update({
          inspection_status: "Completed",
          service_status: "Completed",
          comments: "Auto process completed (invoice)",
        });
      }
    });

    // 🔹 Log transaction for status change
    const transactionData = {
      transaction_type: "Status Change",
      transaction_date: req.tzHelpers.getCurrentDate(),
      description: `Appointment ${appointment_id} status changed from '${currentStatus}' to '${status}'`,
    };
    await knex("transactions").insert(transactionData);

    // 🔹 Log change
    await logChange(token, "appointments", "UPDATE", appointment_id, {
      status: {
        old: currentStatus,
        new: status,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Appointment status updated from '${currentStatus}' to '${status}'`,
      data: {
        appointment_id,
        old_status: currentStatus,
        new_status: status,
      },
    });
  } catch (error) {
    console.error("Update status error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message,
    });
  }
}

export async function updateServiceComments(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const { service_id } = req.params;
    const newComments = req.body;

    if (!newComments) {
      return res.status(400).json({ error: "Comments are required" });
    }

    // Retrieve the current comments data
    const appointment = await knex("services_actual")
      .where({ service_id })
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Ensure comments are parsed as an array
    let currentComments = [];
    try {
      currentComments = appointment.comments
        ? JSON.parse(appointment.comments)
        : [];
    } catch (e) {
      console.log(
        "Error parsing current comments, initializing as empty array:",
        e,
      );
    }

    // Generate a new unique ID for the comment
    newComments.id = currentComments.length + 1; // Incremental ID for new comment

    // Track changes if the comments data is updated
    const changes = {
      old_comments: [...currentComments],
      new_comments: [...currentComments, newComments],
    };

    // Append the new comment to the existing array
    currentComments.push(newComments);

    // Update the comments field in the database
    const updated = await knex("services_actual")
      .where({ service_id })
      .update({ comments: JSON.stringify(currentComments) });

    if (!updated) {
      return res.status(404).json({ error: "Failed to update service" });
    }

    // Log the changes (assuming logChange function is implemented)
    await logChange(token, "services_actual", "UPDATE", service_id, changes);

    // Return a success message with the updated comments
    res.status(200).json({
      message: "Comments updated successfully",
      updated_comments: currentComments,
    });
  } catch (error) {
    console.error("Error updating comments:", error);
    res.status(500).json({
      error: "Error updating comments status",
      details: error.message,
    });
  }
}

export async function cancelAppointment(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const { appointment_id } = req.params;
  let appointmentItems = req.body;

  let existingInvoice = await knex("appointment_to_invoice")
    .where({ appointment_id: appointment_id }) // Correct way to filter
    .first();

  if (!existingInvoice.id) {
    res.status(401).send({ success: true, message: "No Invoice Found" });
  } else {
    await knex("appointment_to_invoice")
      .where({ id: existingInvoice.id })
      .update({ invoice_status: "cancelled" });

    await knex("appointments")
      .where({ appointment_id: appointment_id })
      .update({ status: "invoice" })
      .update({ Invoice_Amount: 0 });

    await knex("finance").where({ appointment_id: appointment_id }).del();

    // appointmentItems.map(async (item) => {
    //   if (item.type != "Services") {
    //     await knex("inventory")
    //       .where({ part_name: item.spareList })
    //       .increment("quantity", item.qty);

    //     await logChange(token, "Invoice", "CANCELLED", addCustomer);
    //   }
    // });

    res
      .status(201)
      .send({ success: true, message: "Invoice cancelled successfully" });
  }
}

export async function getAppointmentToInvoiceById(req, res) {
  const { appointment_id } = req.params;
  const appointmentToInvoice = await knex("appointment_to_invoice")
    .where({ appointment_id })
    .first();
  res.status(200).json(appointmentToInvoice);
}

export async function getAppointmentsToInvoiceByStatus(req, res) {
  try {
    const appointmentsToInvoice = await knex("appointment_to_invoice").select(
      "*",
    );
    res.status(200).json(appointmentsToInvoice);
  } catch (error) {
    console.error("Error fetching appointments to invoice:", error);
    res.status(500).json({
      error: "Error fetching appointments to invoice",
      details: error.message,
    });
  }
}

export async function cancelAppointmentToInvoice(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  const { invoice_id } = req.body; // Assuming invoice_id is sent in the request body

  try {
    // Find the invoice in the appointment_to_invoice table
    const appointmentToInvoice = await knex("appointment_to_invoice")
      .where({ invoice_id })
      .first();

    if (!appointmentToInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Update the invoice_status to "cancel"
    const updated = await knex("appointment_to_invoice")
      .where({ invoice_id })
      .update({ invoice_status: "cancel" });

    if (!updated) {
      return res.status(400).json({ error: "Failed to update invoice status" });
    }

    // Log the change
    await logChange(token, "appointment_to_invoice", "UPDATE", invoice_id, {
      invoice_status: {
        old: appointmentToInvoice.invoice_status,
        new: "cancel",
      },
    });

    res.status(200).json({ message: "Invoice status updated to cancel" });
  } catch (error) {
    console.error("Error updating invoice status:", error.message);
    res.status(500).json({
      error: "Error updating invoice status",
      details: error.message,
    });
  }
}
// old gst invoice update function for reference
// export async function completeAppointmentInvoice(req, res) {
//   const authHeader = req.headers.authorization;
//   const token = authHeader && authHeader.split(" ")[1];
//   const currentDate = new Date();
//   const currentDateString = currentDate.toISOString().split("T")[0];

//   const {
//     Invoice_Amount,
//     advance_payment,
//     advance_balance,
//     appointment_status,
//   } = req.body;
//   const { appointment_id } = req.params;
//   const appointmentItems = req.body.estimateItems;
//   try {
//     // Check if appointment already has an active invoice
//     const existingInvoice = await knex("appointment_to_invoice")
//       .where({
//         appointment_id: appointment_id,
//         invoice_status: "active",
//       })
//       .first();

//     let invoiceID;

//     if (!existingInvoice) {
//       // Only generate new invoice if none exists
//       invoiceID = await generateInvoiceId();
//       // invoiceID = appointment_id;

//       let appointmentToInvoice = {
//         appointment_id: appointment_id,
//         invoice_id: invoiceID,
//         invoice_status: "active",
//       };

//       await knex("appointment_to_invoice")
//         .where({ appointment_id: appointment_id })
//         .update(appointmentToInvoice);
//     } else {
//       invoiceID = existingInvoice.invoice_id;
//     }

//     // Rest of the existing code...
//     const currentAppointment = await knex("appointments")
//       .where("appointment_id", appointment_id)
//       .first();

//     if (!currentAppointment) {
//       return res.status(404).json({ error: "Appointment not found" });
//     }
//     // map through the items_required table and update the qty tax price
//     appointmentItems.map(async (item) => {
//       await knex("items_required")
//         .where({ service_id: item.service_id }) // Update based on service_id
//         .update({ qty: item.qty, tax: item.tax });
//     });

//     // Prepare the changes log
//     const changes = {};
//     // ... existing changes logic ...

//     if (Object.keys(changes).length > 0) {
//       await logChange(token, "appointments", "UPDATE", appointment_id, changes);
//     }

//     const updated = await knex("appointments")
//       .where("appointment_id", appointment_id)
//       .update({
//         Invoice_Amount: Invoice_Amount,
//         advance_payment: advance_payment,
//         advance_balance: advance_balance,
//         invoice_date: currentDateString,
//         status: appointment_status,
//       });

//     if (updated) {
//       res.status(200).json({
//         message: "Invoice amount updated successfully",
//         changes,
//         invoice_id: invoiceID, // Include invoice_id in response
//       });
//     } else {
//       res.status(404).json({ message: "Appointment not updated" });
//     }
//   } catch (error) {
//     console.error("Error updating invoice amount:", error);
//     res.status(500).json({
//       error: "Error updating invoice amount",
//       details: error.message,
//     });
//   }
// }


export async function completeAppointmentInvoice(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const currentDate = req.tzHelpers.getCurrentDate();
  const currentDateString = currentDate.toISOString().split("T")[0];

  const {
    Invoice_Amount,
    advance_payment,
    advance_balance,
    appointment_status,
  } = req.body;
  const { appointment_id } = req.params;
  const appointmentItems = req.body.estimateItems;

  try {
    // Check if appointment already has an invoice
    const existingInvoice = await knex("appointment_to_invoice")
      .where({ appointment_id: appointment_id })
      .first();

    let gst_invoice_id;

    if (!existingInvoice) {
      // No invoice at all — generate new GST invoice and insert
      gst_invoice_id = await generateGstInvoiceId();

      await knex("appointment_to_invoice").insert({
        appointment_id: appointment_id,
        gst_invoice_id: gst_invoice_id,
        invoice_status: "active",
      });
    } else if (
  !existingInvoice.gst_invoice_id ||
  !existingInvoice.gst_invoice_id.startsWith("GST")
) {
      // Invoice exists but is not a GST invoice — regenerate with GST ID
      gst_invoice_id = await generateGstInvoiceId();

      await knex("appointment_to_invoice")
        .where({ appointment_id: appointment_id })
        .update({
          gst_invoice_id: gst_invoice_id,
          invoice_status: "active",
        });
    } else {
      // Valid GST invoice already exists — reuse it
      gst_invoice_id = existingInvoice.gst_invoice_id;

      await knex("appointment_to_invoice")
        .where({ appointment_id: appointment_id })
        .update({ invoice_status: "active" });
    }

    // Check appointment exists
    const currentAppointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    if (!currentAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Update qty and tax for each item in items_required
    await Promise.all(
      appointmentItems.map((item) =>
        knex("items_required")
          .where({ service_id: item.service_id })
          .update({ qty: item.qty, tax: item.tax })
      )
    );

    // Prepare the changes log
    const changes = {};

    if (Invoice_Amount !== currentAppointment.Invoice_Amount) {
      changes.Invoice_Amount = {
        old: currentAppointment.Invoice_Amount,
        new: Invoice_Amount,
      };
    }
    if (advance_payment !== currentAppointment.advance_payment) {
      changes.advance_payment = {
        old: currentAppointment.advance_payment,
        new: advance_payment,
      };
    }
    if (advance_balance !== currentAppointment.advance_balance) {
      changes.advance_balance = {
        old: currentAppointment.advance_balance,
        new: advance_balance,
      };
    }
    if (appointment_status !== currentAppointment.status) {
      changes.status = {
        old: currentAppointment.status,
        new: appointment_status,
      };
    }

    if (Object.keys(changes).length > 0) {
      await logChange(token, "appointments", "UPDATE", appointment_id, changes);
    }

    // Update the appointment
    const updated = await knex("appointments")
      .where("appointment_id", appointment_id)
      .update({
        Invoice_Amount: Invoice_Amount,
        advance_payment: advance_payment,
        advance_balance: advance_balance,
        // invoice_date: currentDateString,
        status: appointment_status,
      });

    if (updated) {
      res.status(200).json({
        message: "Invoice amount updated successfully",
        changes,
        gst_invoice_id: gst_invoice_id,
      });
    } else {
      res.status(404).json({ message: "Appointment not updated" });
    }
  } catch (error) {
    console.error("Error updating invoice amount:", error);
    res.status(500).json({
      error: "Error updating invoice amount",
      details: error.message,
    });
  }
}

export async function updateInvoiceDetails(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  const { appointmentId } = req.params;
  const {
    paid_status,
    Invoice_Date,
    Paid_Amount,
    payment_method,
    cheque_no,
    cheque_date,
    payment_log,
  } = req.body;
  console.log("req.body", req.body);
  try {
    // Fetch the current appointment details
    const appointment = await knex("appointments")
      .where("appointment_id", appointmentId)
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Detect changes
    const changes = {
      payment_info: {
        old: {
          paid_status: appointment.paid_status,
          invoice_date: appointment.invoice_date,
          paid_amount: appointment.paid_amount,
          payment_method: appointment.payment_method,
          cheque_no: appointment.cheque_no,
          cheque_date: appointment.cheque_date,
        },
        new: {
          paid_status,
          invoice_date: Invoice_Date,
          paid_amount: Paid_Amount,
          payment_method,
          cheque_no,
          cheque_date,
        },
      },
    };

    // Log changes
    await logChange(token, "appointments", "UPDATE", appointmentId, changes);

    // Update the appointment
    const updated = await knex("appointments")
      .where("appointment_id", appointmentId)
      .update({
        paid_status,
        invoice_date: Invoice_Date,
        paid_amount: Paid_Amount,
        payment_method,
        cheque_no,
        cheque_date,
        payment_logs: JSON.stringify(payment_log) || [],
      });

    if (!updated) {
      return res.status(404).json({ error: "Failed to update appointment" });
    }

    const updatedAppointment = await knex("appointments")
      .where("appointment_id", appointmentId)
      .first();

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error("Error updating invoice details:", error.message);
    res.status(400).json({
      error: "Error updating invoice details",
      details: error.message,
    });
  }
}

export async function updateSalesAndReferralInfo(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    const { appointment_id } = req.params; // APM-110460
    const { sales_id, referred_by, customer_ref_name } = req.body;

    if (!appointment_id) {
      return res.status(400).json({ message: "Appointment ID is required" });
    }

    // ✅ Validation - sales_id can be single value or array
    if (!sales_id) {
      return res.status(400).json({ message: "Sales ID is required" });
    }

    // Fetch appointment to detect changes
    const appointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Normalize sales_id to always be stored as JSON array
    const normalizedSalesId = Array.isArray(sales_id) ? sales_id : [sales_id];

    // Detect changes for logging
    const changes = {};
    if (
      JSON.stringify(appointment.sales_id) !== JSON.stringify(normalizedSalesId)
    ) {
      changes.sales_id = {
        old: appointment.sales_id,
        new: normalizedSalesId,
      };
    }
    if (referred_by && appointment.referred_by !== referred_by) {
      changes.referred_by = {
        old: appointment.referred_by,
        new: referred_by,
      };
    }
    if (customer_ref_name && appointment.customer_ref_name !== customer_ref_name) {
      changes.customer_ref_name = {
        old: appointment.customer_ref_name,
        new: customer_ref_name,
      };
    }

    // Log changes
    if (Object.keys(changes).length > 0) {
      await logChange(token, "appointments", "UPDATE", appointment_id, changes);
    }

    // ✅ DB update - store sales_id as JSON array
    await knex("appointments")
      .where({ appointment_id: appointment_id })
      .update({
        sales_id: JSON.stringify(normalizedSalesId),
        referred_by,
        customer_ref_name,
        // updatedAt: new Date(),
      });

    const updatedAppointment = await knex("appointments")
      .where("appointment_id", appointment_id)
      .first();

    return res.status(200).json({
      message: "Sales & Referral info updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating sales/referral:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
