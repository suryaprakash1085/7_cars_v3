import knexLib from "knex";
import knexConfig from "../knexfile.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const knex = knexLib(knexConfig);

// Helper function
function parseMechanicId(mechanicId) {
  if (!mechanicId) return null;
  return mechanicId;
}

export async function getAppointmentsByDateRange(req, res) {
  try {
    const { start_date, end_date } = req.params;

    console.log("START:", start_date);
    console.log("END:", end_date);

    const prefixRows = await knex("number_range").whereIn("id_type", [
      "countersales",
      "Appointment",
    ]);

    const prefixes = prefixRows.map((p) => p.prefix);

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
      .leftJoin("customers", "appointments.customer_id", "customers.customer_id")
      .leftJoin("services_actual", "appointments.appointment_id", "services_actual.appointment_id")
      .leftJoin("items_required", "services_actual.service_id", "items_required.service_id")
      .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
      .where((builder) => {
        prefixes.forEach((p, i) => {
          if (i === 0) {
            builder.where("appointments.appointment_id", "like", `${p}%`);
          } else {
            builder.orWhere("appointments.appointment_id", "like", `${p}%`);
          }
        });
      })
      .andWhereRaw(
        "DATE(appointments.appointment_date) >= ? AND DATE(appointments.appointment_date) <= ?",
        [start_date, end_date],
      )
      .orderBy("appointments.appointment_id", "desc");

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

export async function getAllInventory(req, res) {
  try {
    const inventoryItems = await knex("inventory")
      .where("is_deleted", false)
      .select("*");

    const formattedItems = inventoryItems.map((item) => ({
      _id: item.inventory_id,
      inventory_id: item.inventory_id,
      part_name: item.part_name,
      part_number: item.part_number,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      uom: item.uom,
      price: parseFloat(item.price),
      buying_price: parseFloat(item.buying_price) || 0,
    }));

    res.status(200).json(formattedItems);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching inventory items",
      details: error.message,
    });
  }
}

export async function getAllAppointments(req, res) {
  try {
    let { startDate, endDate } = req.query;

    let companyCode = null;
    if (req.body && req.body.company_code) {
      companyCode = req.body.company_code;
    } else if (req.query && req.query.company_code) {
      companyCode = req.query.company_code;
    } else if (req.headers["x-company-code"]) {
      companyCode = req.headers["x-company-code"];
    }

    console.log("Query params:", { startDate, endDate, companyCode });

    const isValidDate = (dateStr) => !isNaN(new Date(dateStr).getTime());
    if (
      (startDate && !isValidDate(startDate)) ||
      (endDate && !isValidDate(endDate))
    ) {
      return res.status(400).json({ error: "Invalid startDate or endDate" });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      [startDate, endDate] = [endDate, startDate];
    }

    const prefix = await knex("number_range")
      .where("id_type", "countersales")
      .orWhere("id_type", "Appointment");

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
      )
      .leftJoin("customers", "appointments.customer_id", "customers.customer_id")
      .leftJoin("services_actual", "appointments.appointment_id", "services_actual.appointment_id")
      .leftJoin("items_required", "services_actual.service_id", "items_required.service_id")
      .leftJoin("appointment_to_invoice", "appointments.appointment_id", "appointment_to_invoice.appointment_id")
      .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
      .where(function (builder) {
        if (companyCode) {
          builder.where("appointments.company_code", companyCode);
        }

        builder.where(function () {
          if (prefix[0]?.prefix) {
            this.where("appointments.appointment_id", "like", `%${prefix[0].prefix}%`);
          }
          if (prefix[1]?.prefix) {
            this.orWhere("appointments.appointment_id", "like", `%${prefix[1].prefix}%`);
          }
        });

        if (startDate && endDate) {
          builder.andWhereBetween("appointments.appointment_date", [startDate, endDate]);
        } else if (startDate) {
          builder.andWhere("appointments.appointment_date", ">=", startDate);
        } else if (endDate) {
          builder.andWhere("appointments.appointment_date", "<=", endDate);
        }
      })
      .orderBy("appointments.appointment_date", "desc");

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
        };
        formattedAppointments.push(appointmentMap[row.appointment_id]);
      }

      const appointment = appointmentMap[row.appointment_id];

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

// Add this new function for transactions
export async function getTransactions(req, res) {
  const {
    supplier_id,
    customer_id,
    transaction_type,
    start_date,
    end_date,
    type,
    searchText,
  } = req.query;

  try {
    let query = knex("finance as f")
      .leftJoin("appointments as a", "f.appointment_id", "a.appointment_id")
      .select("f.*", "a.payment_method");

    if (supplier_id) {
      query.where("f.customer_id", supplier_id);
    }

    if (customer_id) {
      query.where("f.customer_id", customer_id);
    }

    if (transaction_type) {
      query.where("f.expense_type", transaction_type);
    }

    if (type) {
      query.where("f.type", type);
    }

    if (start_date && end_date) {
      query.whereBetween("f.creation_date", [start_date, end_date]);
    } else if (start_date) {
      query.where("f.creation_date", ">=", start_date);
    } else if (end_date) {
      query.where("f.creation_date", "<=", end_date);
    }

    if (searchText) {
      query.where(function () {
        this.where("f.customer_id", "like", `%${searchText}%`)
          .orWhere("f.invoice_no", "like", `%${searchText}%`)
          .orWhere("f.description", "like", `%${searchText}%`)
          .orWhere("f.expense_type", "like", `%${searchText}%`)
          .orWhere("f.type", "like", `%${searchText}%`)
          .orWhere("a.payment_method", "like", `%${searchText}%`);
      });
    }

    const transactions = await query;

    res.status(200).json({
      message: "Transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({
      message: "Error fetching transactions",
      error: error.message,
    });
  }
}
