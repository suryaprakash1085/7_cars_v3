import express from "express";
import knexLib from "knex"; // Import the Knex library
import knexConfig from "../knexfile.js"; // Import your Knex configuration

function getTzNow(req) {
  if (req?.tzHelpers) return req.tzHelpers.getCurrentDate();
  return new Date();
}
function getTzDateStr(req) {
  if (req?.tzHelpers) return req.tzHelpers.format(new Date(), "YYYY-MM-DD");
  return new Date().toISOString().split("T")[0];
}
import {
  generateAppointmentId,
  generatecountesalesId,
  generateCustomId,
  generateInvoiceId,
  generateServiceId,
  generateCounterSalesVehicleId,
} from "../utils/idGenerator.js"; // Import the generatecsaleId function
import logChange from "../middleware/changeLog.js";
const router = express.Router();
const knex = knexLib(knexConfig); // Initialize Knex with the configuration
// import express from "express";
import { body, validationResult } from "express-validator"; // Import body & validationResult
// import knex from "../database"; // Your database connection file
// const router=express.Router()
// countertopsales
// sample get
// Fetch and format all appointments with services and items required
// router.get("/all", async (req, res) => {
//   const prefix = await knex("number_range")
//     .where("id_type", "countersales")
//   const finalPrefix = prefix[0].prefix
//   try {
//     const appointments = await knex("appointments")
//       .select(
//         "appointments.appointment_id",
//         "appointments.customer_id",
//         "customers.customer_name",
//         "customers.advance_payment",
//         "customers.phone",
//         "customers.street",
//         "customers.city",
//         "customers.state",
//         "appointments.vehicle_id",
//         "appointments.plateNumber",
//         "appointments.mechanic_id",
//         "appointments.km",
//         "appointments.appointment_date",
//         "appointments.appointment_time",
//         "appointments.status",
//         "appointments.telecaller",
//         "appointments.notes",
//         "appointments.feedback",
//         "appointments.paid_status",
//         "appointments.invoice_date",
//         "appointments.paid_amount",
//         "appointments.advance_balance",
//         "appointments.invoice_amount",
//         "appointments.payment_method",
//         "appointments.completed_date",
//         "appointments.inspection_date",
//         "appointments.released_date",
//         "services_actual.service_id",
//         "services_actual.service_description",
//         "services_actual.status as service_status",
//         "services_actual.service_status as service_actual_status",
//         "services_actual.price",
//         "services_actual.service_type",
//         "services_actual.comments",
//         "services_actual.uom",
//         "items_required.item_id",
//         "items_required.item_name",
//         "items_required.qty",
//         "items_required.tax",
//         "items_required.price",
//         "vehicles.make",
//         "vehicles.model",
//         "vehicles.year",
//         "vehicles.vin",
//         "vehicles.fuel_type"
//       )
//       .leftJoin(
//         "customers",
//         "appointments.customer_id",
//         "customers.customer_id"
//       )
//       .leftJoin(
//         "services_actual",
//         "appointments.appointment_id",
//         "services_actual.appointment_id"
//       )
//       .leftJoin(
//         "items_required",
//         "services_actual.service_id",
//         "items_required.service_id"
//       )
//       .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
//       .orderBy("appointments.appointment_id")
//       .where("appointments.appointment_id", "like", `%${finalPrefix}%`)
//       .where('appointments.status', "not like", "%deleted%")

//     const formattedAppointments = [];
//     const appointmentMap = {};

//     appointments.forEach((row) => {
//       if (!appointmentMap[row.appointment_id]) {
//         appointmentMap[row.appointment_id] = {
//           _id: `appointment-${row.appointment_id}`,
//           appointment_id: row.appointment_id,
//           customer_id: row.customer_id,
//           customer_name: row.customer_name,
//           phone: row.phone,
//           street: row.street,
//           city: row.city,
//           state: row.state,
//           vehicle_id: row.vehicle_id,
//           plateNumber: row.plateNumber,
//           mechanic_id: row.mechanic_id,
//           km: row.km,
//           appointment_date: row.appointment_date, // .toISOString(),
//           appointment_time: row.appointment_time,
//           status: row.status,
//           telecaller: row.telecaller,
//           notes: row.notes,
//           feedback: row.feedback,
//           paid_status: row.paid_status,
//           invoice_date: row.invoice_date,
//           paid_amount: row.paid_amount,
//           advance_payment: row.advance_balance, // Set advance_payment to advance_balance
//           advance_balance: row.advance_payment,
//           invoice_amount: row.invoice_amount,
//           payment_method: row.payment_method || "cash",
//           completed_date: row.completed_date,
//           inspection_date: row.inspection_date,
//           released_date: row.released_date,
//           services_actual: [],
//           make: row.make,
//           model: row.model,
//           year: row.year,
//           vin: row.vin,
//           fuel_type: row.fuel_type,
//         };
//         formattedAppointments.push(appointmentMap[row.appointment_id]);
//       }

//       const appointment = appointmentMap[row.appointment_id];

//       let service = appointment.services_actual.find(
//         (s) => s.service_id === row.service_id
//       );

//       if (!service) {
//         service = {
//           _id: `service-${row.service_id}`,
//           service_id: row.service_id,
//           service_description: row.service_description,
//           status: row.service_status,
//           service_status: row.service_actual_status,
//           price: row.price,
//           service_type: row.service_type,
//           comments: row.comments,
//           uom: row.uom,
//           items_required: [],
//         };
//         appointment.services_actual.push(service);
//       }

//       if (row.item_id) {
//         service.items_required.push({
//           _id: `item-${row.item_id}`,
//           item_id: row.item_id,
//           item_name: row.item_name,
//           qty: row.qty,
//           tax: row.tax,
//           // discount: row.discount,
//         });
//       }
//     });

//     res.status(200).json(formattedAppointments);
//   } catch (error) {
//     console.log("Error fetching appointments:", error);
//     res.status(500).json({
//       error: "Error fetching appointments",
//       details: error.message,
//     });
//   }
// });


router.get("/all", async (req, res) => {
  try {
    let {
      startDate,
      endDate,
      limit = 20,
      offset = 0,
    } = req.query;

    limit = parseInt(limit);
    offset = parseInt(offset);

    const prefix = await knex("number_range")
      .where("id_type", "countersales");

    const finalPrefix = prefix[0].prefix;

    // ---------------- TOTAL COUNT QUERY ----------------
    let totalQuery = knex("appointments")
      .countDistinct("appointments.appointment_id as total")
      .where(
        "appointments.appointment_id",
        "like",
        `%${finalPrefix}%`
      )
      .where("appointments.status", "not like", "%deleted%");

    // Start Date Filter
    if (startDate) {
      totalQuery = totalQuery.where(
        "appointments.appointment_date",
        ">=",
        startDate
      );
    }

    // End Date Filter
    if (endDate) {
      totalQuery = totalQuery.where(
        "appointments.appointment_date",
        "<=",
        endDate
      );
    }

    const totalResult = await totalQuery;
    const total = totalResult[0].total;

    // ---------------- GET UNIQUE APPOINTMENT IDS ----------------
    let appointmentIdsQuery = knex("appointments")
      .distinct("appointments.appointment_id")
      .where(
        "appointments.appointment_id",
        "like",
        `%${finalPrefix}%`
      )
      .where("appointments.status", "not like", "%deleted%");

    // Start Date Filter
    if (startDate) {
      appointmentIdsQuery = appointmentIdsQuery.where(
        "appointments.appointment_date",
        ">=",
        startDate
      );
    }

    // End Date Filter
    if (endDate) {
      appointmentIdsQuery = appointmentIdsQuery.where(
        "appointments.appointment_date",
        "<=",
        endDate
      );
    }

    const appointmentIds = await appointmentIdsQuery
      .orderBy("appointments.appointment_id", "desc")
      .limit(limit)
      .offset(offset);

    const ids = appointmentIds.map(
      (item) => item.appointment_id
    );

    // ---------------- MAIN QUERY ----------------
    let query = knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.customer_id",
        "customers.customer_name",
        "customers.advance_payment",
        "customers.phone",
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
        "appointments.advance_balance",
        "appointments.invoice_amount",
        "appointments.payment_method",
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
        "vehicles.fuel_type"
      )
      .leftJoin(
        "customers",
        "appointments.customer_id",
        "customers.customer_id"
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
      .whereIn("appointments.appointment_id", ids)
      .orderBy("appointments.appointment_id", "desc");

    const appointments = await query;

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
          advance_balance: row.advance_payment,
          invoice_amount: row.invoice_amount,
          payment_method: row.payment_method || "cash",
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

        formattedAppointments.push(
          appointmentMap[row.appointment_id]
        );
      }

      const appointment =
        appointmentMap[row.appointment_id];

      let service = appointment.services_actual.find(
        (s) => s.service_id === row.service_id
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
        service.items_required.push({
          _id: `item-${row.item_id}`,
          item_id: row.item_id,
          item_name: row.item_name,
          qty: row.qty,
          tax: row.tax,
          price: row.price,
        });
      }
    });

    res.status(200).json({
      total: total,
      limit,
      offset,
      count: formattedAppointments.length,
      data: formattedAppointments,
    });

  } catch (error) {
    console.log("Error fetching appointments:", error);

    res.status(500).json({
      error: "Error fetching appointments",
      details: error.message,
    });
  }
});


//  


// GET method to fetch a single appointment by ID
router.get("/:appointment_id", async (req, res) => {
  try {
    const appointmentData = await knex("appointments")
      .select(
        "appointments.appointment_id",
        "appointments.customer_id",
        "appointments.vehicle_id",
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
        "appointments.payment_method",
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
        "items_required.pr_no",
        "vehicles.make",
        "vehicles.model",
        "vehicles.year",
        "vehicles.vin",
        "vehicles.fuel_type",
        "customers.customer_name",
        "customers.gst_number",
        "customers.phone",
        "customers.street",
        "appointment_to_invoice.invoice_id",
        "appointment_to_invoice.invoice_status"
      )
      .leftJoin(
        "services_actual",
        "appointments.appointment_id",
        "services_actual.appointment_id"
      )
      .leftJoin(
        "customers",
        "appointments.customer_id",
        "customers.customer_id"
      )
      .leftJoin(
        "items_required",
        "services_actual.service_id",
        "items_required.service_id"
      )
      .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
      .leftJoin(
        "appointment_to_invoice",
        "appointments.appointment_id",
        "appointment_to_invoice.appointment_id"
      )
      .where("appointments.appointment_id", req.params.appointment_id);

    const appointment = {
      _id: `appointment-${appointmentData[0].appointment_id}`,
      appointment_id: appointmentData[0].appointment_id,
      customer_id: appointmentData[0].customer_id,
      customer_name: appointmentData[0].customer_name || "N/A",
      gst_number: appointmentData[0].gst_number || "N/A",
      phone: appointmentData[0].phone || "N/A",
      street: appointmentData[0].street || "N/A",
      vehicle_id: appointmentData[0].vehicle_id || "N/A",
      mechanic_id: appointmentData[0].mechanic_id || "N/A",
      km: appointmentData[0].km || "N/A",
      appointment_date: new Date(appointmentData[0].appointment_date).toISOString(),
      appointment_time: appointmentData[0].appointment_time || "Not Specified",
      status: appointmentData[0].status || "Not Available",
      telecaller: appointmentData[0].telecaller || "N/A",
      notes: appointmentData[0].notes || "No notes",
      feedback: appointmentData[0].feedback ? JSON.parse(appointmentData[0].feedback) : [],
      paid_status: appointmentData[0].paid_status || "Not Available",
      invoice_date: appointmentData[0].invoice_date || "Not Available",
      paid_amount: appointmentData[0].paid_amount || 0,
      advance_payment: appointmentData[0].advance_payment || 0,
      advance_balance: appointmentData[0].advance_balance || 0,
      invoice_amount: appointmentData[0].invoice_amount || 0,
      payment_method: appointmentData[0].payment_method || "cash",
      completed_date: appointmentData[0].completed_date || "Not Available",
      inspection_date: appointmentData[0].inspection_date || "Not Available",
      released_date: appointmentData[0].released_date || "Not Available",
      services_actual: [],
      make: appointmentData[0].make || "Not Available",
      model: appointmentData[0].model || "Not Available",
      year: appointmentData[0].year || "Not Available",
      vin: appointmentData[0].vin || "Not Available",
      fuel_type: appointmentData[0].fuel_type || "Not Available",
      invoice_id: appointmentData[0].invoice_id || "N/A",
      invoice_status: appointmentData[0].invoice_status || "Inactive"
    };

    const serviceMap = {};

    appointmentData.forEach((row) => {
      if (!serviceMap[row.service_id]) {
        serviceMap[row.service_id] = {
          _id: `service-${row.service_id}`,
          service_id: row.service_id,
          service_description: row.service_description || "N/A",
          status: row.service_status || "Not Available",
          service_status: row.service_actual_status || "Not Available",
          price: row.price || "0.00",
          service_type: row.service_type || "Unknown",
          comments: row.comments || "No comments",
          uom: row.uom || "N/A",
          items_required: [],
        };
        appointment.services_actual.push(serviceMap[row.service_id]);
      }

      if (row.item_id) {
        serviceMap[row.service_id].items_required.push({
          _id: `item-${row.item_id}`,
          item_id: row.item_id,
          item_name: row.item_name || "N/A",
          qty: row.qty || 0,
          tax: parseInt(row.tax) || 0,
          price: parseInt(row.price) || 0,
          pr_no: row.pr_no || "N/A",
        });
      }
    });

    res.status(200).json(appointment);
  } catch (error) {
    console.log("Error fetching appointment:", error);
    res.status(500).json({
      error: "Error fetching appointment",
      details: error.message,
    });
  }
});


router.get("/check-invoice/:appointment_id", async (req, res) => {
  try {
    const appointment = await knex("appointment_to_invoice")
      .where("appointment_id", req.params.appointment_id)
      .where("invoice_status", "active")
      .first();

    if (appointment) {
      res.status(200).json(appointment);
    } else {
      res.status(200).json({ message: "Appointment is not invoiced" });
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred", error: error.message });
  }
});


// POST method to add inventory data
router.post("/", async (req, res) => {
  const prefix = await knex("number_range")
    .where('id_type', 'countersales')

  const formattedDate = getTzDateStr(req);
  try {
    const emptyCustomerAppointment = await knex("appointments")
      .where(function () {
        this.where("customer_id", "")
          .orWhereNull("customer_id");
      })
      .andWhere("appointment_id", "like", `%${prefix[0]?.prefix}%`)
      .first();

    console.log("emptyCustomerAppointment", emptyCustomerAppointment);

    if (emptyCustomerAppointment) {
      // If found, return the existing appointment_id
      res.send({ id: emptyCustomerAppointment.appointment_id });
    } else {
      // If not found, create new appointment
      const newId = await generatecountesalesId();
      await knex("appointments").insert({
        appointment_id: newId,
        appointment_date: formattedDate,
      });
      console.log("newId", newId);
      res.send({ id: newId });
    }
  } catch (error) {
    console.error("Error in appointment creation:", error);
    res.status(500).send("Error processing appointment");
  }
});

router.post("/countertop", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  // const leads="leads";
  console.log(req.body);

  //check duplicate phone number too  and then insert the customer
  const duplicate = await knex("customers")
    .where({ phone: req.body.phone })
    .first();
  // if (duplicate) {
  //   return res.status(400).send({ error: "Phone Number Already Exists" });
  // }
  const {
    name,
    phone,
    gst,
    street,

    appointment_id

    // type,
  } = req.body;

  const customerId = await generateCustomId("CUST");

  let addCustomer = await knex("customers").insert({
    customer_id: customerId,
    customer_name: name,
    phone: phone,
    gst_number: gst,
    street: street,
    city: "sivakasi",
    state: "Tamil Nadu",
    type: "Customer Sales",
  });

  let linkCustomerAndAppointment = await knex("appointments")
    .where({ appointment_id: appointment_id })
    .update({ customer_id: customerId });

  await logChange(token, "customers", "INSERT", customerId, addCustomer);
  await logChange(token, "appointments", "UPDATE", appointment_id, linkCustomerAndAppointment);

  res.status(201).send({ customer_id: customerId, appointment_id: appointment_id });
  console.log(req.body)
});



router.post("/add_countersales", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  console.log(req.body);

  const { name, phone, gst, street, appointment_id, vehicle_id, customer_id } = req.body;

  try {
    let customerId = customer_id;
    let appointmentId = appointment_id;

    // Check if customer already exists
    const existingCustomer = await knex("customers")
      .where({ phone })
      .orWhere({ customer_id })
      .first();

    if (existingCustomer) {
      customerId = existingCustomer.customer_id;
    } else {
      customerId = await generateCustomId("CUST");

      await knex("customers").insert({
        customer_id: customerId,
        customer_name: name,
        phone,
        gst_number: gst,
        street,
        city: "Sivakasi",
        state: "Tamil Nadu",
        type: "Customer Sales",
      });

      await logChange(token, "customers", "INSERT", customerId, req.body);
    }

    const formattedDate = getTzDateStr(req);

    if (!appointmentId) {
      appointmentId = await generatecountesalesId();

      // Create appointment object
      const appointmentData = {
        appointment_id: appointmentId,
        customer_id: customerId,
        appointment_date: formattedDate,
        Invoice_Date: formattedDate
      };

      // Add vehicle_id only if provided
      if (vehicle_id) {
        appointmentData.vehicle_id = vehicle_id;
      }

      await knex("appointments").insert(appointmentData);

    } else {
      await knex("appointments")
        .where({ appointment_id: appointmentId })
        .update({
          customer_id: customerId,
          appointment_date: formattedDate,
          Invoice_Date: formattedDate
        });
    }

    await logChange(
      token,
      "appointments",
      "UPDATE",
      appointmentId,
      { customer_id: customerId, appointment_date: formattedDate }
    );

    res.status(201).send({
      message: "Customer and appointment processed successfully",
      customer_id: customerId,
      appointment_id: appointmentId,
      appointment_date: formattedDate,
    });

  } catch (error) {
    console.error("Error adding counter sales:", error);
    res.status(500).send({
      error: "Failed to add counter sales",
      details: error.message
    });
  }
});














// save button click

// Helper function to add or update services and their items using Knex.js
router.post("/save/:appointment_id", async (req, res) => {
  const servicetype = "services_actual"
  console.log("my log", req.body);
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    const services = req.body; // Assuming an array of services is sent
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: "No services provided" });
    }
    if (req.body[0].customer_id) {
      await knex("appointments")
        .update({ customer_id: req.body[0].customer_id }) // Fix: Use object notation
        .where("appointment_id", req.params.appointment_id); // Fix: Correct where syntax
    }
    const vehicle_id = (!req.body[0]?.vehicle_id || req.body[0].vehicle_id === "N/A") ? await generateCounterSalesVehicleId() : req.body[0].vehicle_id;

    // Prepare appointment update data based on payment mode
    const appointmentUpdateData = {
      customer_id: req.body[0].customer_id,
      status: "invoiced",
      plateNumber: "CounterSales",
      vehicle_id: vehicle_id,
    };

    // Set invoice_amount, paid_amount, and paid_status based on payment mode
    if (req.body[0].paymentMode === "credit") {
      // Credit: Customer owes us money (not yet paid)
      appointmentUpdateData.invoice_amount = req.body[0].overallTotal;
      appointmentUpdateData.paid_amount = 0;
      appointmentUpdateData.paid_status = "not paid";
      appointmentUpdateData.payment_method = "credit";
    } else if (req.body[0].paymentMode === "cash") {
      // Cash: Customer paid immediately (fully paid)
      appointmentUpdateData.invoice_amount = req.body[0].overallTotal;
      appointmentUpdateData.paid_amount = req.body[0].overallTotal;
      appointmentUpdateData.paid_status = "paid";
      appointmentUpdateData.payment_method = "cash";
    } else {
      // Default behavior if payment mode is not specified
      appointmentUpdateData.invoice_amount = req.body[0].overallTotal;
      appointmentUpdateData.paid_amount = req.body[0].overallTotal;
      appointmentUpdateData.paid_status = "paid";
      appointmentUpdateData.payment_method = "cash";
    }

    await knex("appointments")
      .update(appointmentUpdateData)
      .where("appointment_id", req.params.appointment_id);

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

      // // Validate required fields
      // if (
      //   !service_description ||
      //   !price ||
      //   !status ||
      //   !Array.isArray(items_required) ||
      //   items_required.length === 0
      // ) {
      //   return res.status(400).json({
      //     error:
      //       "Missing required fields: service_description, price, status, or items_required",
      //   });
      // }

      // Check if the service already exists
      const existingService = await knex(servicetype)
        .where("appointment_id", req.params.appointment_id)
        .andWhere("service_id", service_id)
        .first();


      if (existingService) {
        // Update existing service
        console.log("Updating existing service with ID:", service_id);
        await knex(servicetype)
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
            // status: "invoiced",  
          });

        // await knex("transaction")
        // .where("status"

        // Synchronize items_required
        const existingItems = await knex("items_required")
          .where("service_id", service_id)
          .select("item_id");

        const existingItemIds = existingItems.map((item) => item.item_id);

        console.log("Testing existingItemIds:", existingItemIds);
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

          console.log("Testing items_required:", items_required);
          console.log("Testing item:", item);
          if (existingItemIds.includes(itemId)) {
            // Update existing item
            await knex("items_required")
              .where("service_id", service_id)
              .andWhere("item_id", itemId)
              .update({...item, item_id: itemId});

            const transation_data = {
              quantity: item.qty,
              // price:item.price,
              transaction_type: "Sold",
              transaction_date: getTzNow(req),
              description: "Added Via Inspection",
              inventory_id: itemId,
              service_id: service_id,
            };
            // console.log(transation_data);
            await knex("transactions")
              .where("service_id", service_id)
              .update(transation_data);
          } else {
            // Insert new item
            await knex("items_required").insert({
              ...item,
              service_id,
              item_id: itemId,
              price: item.price,
            });
          }
        }

        // service_actual

        // Remove items that are no longer required
        const newItemIds = items_required.map((item) => {
          let itemId = item.item_id;
          if (!itemId && item.item_name) {
            // For filter purposes, try to match by name from existingItems
            // This is a synchronization step
          }
          return itemId;
        }).filter(id => id);
        const itemsToRemove = existingItemIds.filter(
          (id) => !newItemIds.includes(id)
        );

        if (itemsToRemove.length > 0) {
          await knex("items_required")
            .where("service_id", service_id)
            .whereIn("item_id", itemsToRemove)
            .del();
        }
      } else {
        // Generate new service_id and add new service
        service_id = await generateServiceId();
        await knex(servicetype).insert({
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
      // add a entry in finance table with the appointment id and the invoice id , invoice_no,credit,debit, status=pending,type ='customer'
      // check if the invoice id is already in the finance table
      const existingInvoice = await knex("finance").where({ invoice_no: req.body[0].invoice_id }).first();
      const paymentMode = req.body[0].paymentMode || "cash";

      if (!existingInvoice) {
        // Create debit entry (always needed)
        await knex("finance").insert({
          appointment_id: req.params.appointment_id,
          // invoice_id: req.body[0].invoice_id,
          customer_id: req.body[0].customer_id,
          invoice_no: req.body[0].invoice_id,
          credit: 0,
          description: "Debit to Counter Sales against the appointment #" + req.params.appointment_id,
          debit: req.body[0].overallTotal,
          status: "pending",
          expense_type: "Debit",
          creation_date: getTzDateStr(req),
          type: "customer",
        });

        // Create credit entry only if payment mode is cash (not credit)
        if (paymentMode === "cash") {
          await knex("finance").insert({
            appointment_id: req.params.appointment_id,
            // invoice_id: req.body[0].invoice_id,
            customer_id: req.body[0].customer_id,
            invoice_no: req.body[0].invoice_id,
            credit: req.body[0].overallTotal,
            description: "Credit for Counter Sales against the appointment #" + req.params.appointment_id,
            debit: 0,
            status: "pending",
            expense_type: "Credit",
            creation_date: getTzDateStr(req),
            type: "customer",
          });
        }
      }
      else {
        // Update debit entry (always needed)
        await knex("finance").where({ invoice_no: req.body[0].invoice_id, expense_type: "Debit" }).update({
          appointment_id: req.params.appointment_id,
          // invoice_id: req.body[0].invoice_id,
          customer_id: req.body[0].customer_id,
          invoice_no: req.body[0].invoice_id,
          // credit: req.body[0].overallTotal,
          debit: req.body[0].overallTotal,
          description: "Debit to Counter Sales against the appointment #" + req.params.appointment_id,
          status: "pending",
          expense_type: "Debit",
          creation_date: getTzDateStr(req),
          type: "customer",
        });

        // Update or create credit entry only if payment mode is cash
        if (paymentMode === "cash") {
          const existingCredit = await knex("finance")
            .where({ invoice_no: req.body[0].invoice_id, expense_type: "Credit" })
            .first();

          if (existingCredit) {
            await knex("finance").where({ invoice_no: req.body[0].invoice_id, expense_type: "Credit" }).update({
              appointment_id: req.params.appointment_id,
              // invoice_id: req.body[0].invoice_id,
              customer_id: req.body[0].customer_id,
              invoice_no: req.body[0].invoice_id,
              // credit: req.body[0].overallTotal,
              credit: req.body[0].overallTotal,
              description: "Credit for Counter Sales against the appointment #" + req.params.appointment_id,
              status: "pending",
              expense_type: "Credit",
              creation_date: getTzDateStr(req),
              type: "customer",
            });
          } else {
            await knex("finance").insert({
              appointment_id: req.params.appointment_id,
              customer_id: req.body[0].customer_id,
              invoice_no: req.body[0].invoice_id,
              credit: req.body[0].overallTotal,
              description: "Credit for Counter Sales against the appointment #" + req.params.appointment_id,
              debit: 0,
              status: "pending",
              expense_type: "Credit",
              creation_date: getTzDateStr(req),
              type: "customer",
            });
          }
        } else {
          // For credit payment mode, delete any existing credit entry
          await knex("finance")
            .where({ invoice_no: req.body[0].invoice_id, expense_type: "Credit" })
            .del();
        }
      }

      // Synchronize items_required
      const existingItems = await knex("items_required")
        .where("service_id", service_id)
        .select("item_id", "qty",); // Fetch existing quantities

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

        const existingItem = existingItems.find(
          (i) => i.item_id === itemId
        );

        if (existingItem) {
          // Step 1: Get the requested quantity
          const requestedQty = item.qty;
          const existingQty = existingItem.qty;

          // Step 2: Update the existing item in items_required with the new quantity
          await knex("items_required")
            .where("service_id", service_id)
            .andWhere("item_id", itemId)
            // .update({ qty: requestedQty });
            .update({ qty: item.qty, price: item.price });

          // Step 3: Adjust inventory accordingly

          const currentInventory = await knex("inventory") // Assuming you have an inventory table
            .where("inventory_id", itemId)
            .first();
          console.log("currentInventory", currentInventory);
          if (currentInventory) {
            let difference = requestedQty - existingQty; // Calculate the difference
            console.log("difference", difference);
            if (difference < 0) {
              // If requested is less than existing, add the difference to inventory
              const newQuantity =
                currentInventory.quantity + Math.abs(difference); // Increase inventory
              await knex("inventory")
                .where("inventory_id", itemId)
                .update({ quantity: newQuantity });

              // Log the transaction
              const transactionData = {
                quantity: Math.abs(difference),
                transaction_type: "Recieved",
                transaction_date: getTzNow(req),
                description: `Recieved for Appointment ${req.params.appointment_id} to inventory for item ${itemId}`,
                inventory_id: itemId,
                service_id: service_id,
              };
              await knex("transactions").insert(transactionData);

              await knex("inventory")
                .where("inventory_id", itemId)
                .update({ quantity: 0 });

              // Log the transaction for Consumption also
              const consumedData = {
                quantity: Math.abs(newQuantity),
                transaction_type: "Consumed",
                transaction_date: getTzNow(req),
                description: `Item Consumed for Appointment ${req.params.appointment_id} to inventory for item ${itemId}`,
                inventory_id: itemId,
                service_id: service_id,
              };
              await knex("transactions").insert(consumedData);

            } else {
              // If requested is greater than existing, subtract the difference from inventory
              const newQuantity = currentInventory.quantity - difference; // Decrease inventory
              if (newQuantity >= 0) {
                // Avoid negative values
                await knex("inventory")
                  .where("inventory_id", itemId)
                  .update({ quantity: newQuantity });

                if (difference > 0) {
                  // // Log the transaction
                  const transactionData = {
                    quantity: difference,
                    // price:price,
                    transaction_type: "Consumed",
                    transaction_date: getTzNow(req),
                    description: `Item Consumed for Appointment ${req.params.appointment_id} from inventory for item ${itemId}`,
                    inventory_id: itemId,
                    service_id: service_id,
                  };
                  await knex("transactions").insert(transactionData);
                }
              }
            }
          }
        } else {
          // If the item does not exist in items_required, insert it
          await knex("items_required").insert({
            ...item,
            service_id,
            item_id: itemId,
            // item.price,
          });

          // Decrease inventory quantity based on the qty ordered
          const currentInventory = await knex("inventory") // Assuming you have an inventory table
            .where("inventory_id", itemId)
            .first();

          if (currentInventory) {
            const newQuantity = currentInventory.quantity - item.qty; // Decrease the quantity
            if (newQuantity >= 0) {
              // Avoid negative values
              await knex("inventory")
                .where("inventory_id", itemId)
                .update({ quantity: newQuantity });

              // // Log the transaction
              const transactionData = {
                quantity: item.qty,
                transaction_type: "Consumed",
                transaction_date: getTzNow(req),
                description: `Item Consumed for Appointment ${req.params.appointment_id} from inventory for new item ${itemId}`,
                inventory_id: itemId,
                service_id: service_id,
              };
              await knex("transactions").insert(transactionData);
            } else {
              // if Negative Not much stock so increase Stock
              const newAddQuantity =
                currentInventory.quantity + Math.abs(newQuantity); // Increase inventory
              await knex("inventory")
                .where("inventory_id", itemId)
                .update({ quantity: newAddQuantity });
              // Log the transaction
              const transactionData = {
                quantity: Math.abs(newQuantity),
                transaction_type: "Recieved",
                transaction_date: getTzNow(req),
                description: `Recieved for Appointment ${req.params.appointment_id} to inventory for item ${itemId}`,
                inventory_id: itemId,
                service_id: service_id,
              };
              await knex("transactions").insert(transactionData);

              await knex("inventory")
                .where("inventory_id", itemId)
                .update({ quantity: 0 });

              // Log the transaction
              const consumedData = {
                quantity: Math.abs(newAddQuantity),
                transaction_type: "Consumed",
                transaction_date: getTzNow(req),
                description: `Item Consumed for Appointment ${req.params.appointment_id} to inventory for item ${itemId}`,
                inventory_id: itemId,
                service_id: service_id,
              };
              await knex("transactions").insert(consumedData);

            }
          }
        }
      }

      // Remove items that are no longer required
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
      services
    );

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.log(`Error adding services to ${servicetype}:`, error);
    res.status(400).json({
      error: `Error adding services to ${servicetype}`,
      details: error.message,
    });
  }
});



// app.put("/update/:id", (req, res) => {
//     const { id } = req.params;
//     const { date,customer_id,customer_name,phone_number,amount } = req.body; // Update செய்ய வேண்டிய data

//     const sql = "UPDATE users SET customer_name = ?, phone_number = ? ,amount =?WHERE id = ?";
//     db.query(sql, [date,customer_id,customer_name,phone_number,amount, id], (err, result) => {
//         if (err) {
//             return res.status(500).json({ message: "Error updating data", error: err });
//         }
//         return res.json({ message: "User updated successfully" });
//     });
// })

router.put("/update/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { appointment_data, customer_name, phone_number, amount } = req.body;

    const updateData = {};

    if (date) {
      updateData.appointment_data = appointment_data;
    }
    if (customer_name) {
      updateData.customer_name = customer_name;
    }
    if (phone_number) {
      updateData.phone_number = phone_number;
    }
    if (amount) {
      updateData.amount = amount;
    }

    const updatedRows = await knex("UsersCollection")
      .where({ customer_Id: customerId })
      .update(updateData);

    if (updatedRows) {
      res.status(200).send({ message: "User updated successfully" });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).send({ error: "Update failed", details: error.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("Incoming ID:", id); // Debugging

  const { appointment_date, invoice_amount, customer_name, phone } = req.body;

  try {
    if (!id) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    const customerExists = await knex("customers")
      .where("customer_id", id)
      .first();
    if (!customerExists) {
      console.log(" Customer not found for ID:", id);
      return res.status(404).json({ error: "Customer not found" });
    }

    console.log("  Customer Found:", customerExists);

    await knex("customers").where("customer_id", id).update({
      customer_name,
      phone,
    });

    const appointmentExists = await knex("appointments")
      .where("customer_id", id)
      .first();
    if (!appointmentExists) {
      console.log(" Appointment not found for customer ID:", id);
      return res.status(404).json({ error: "Appointment not found" });
    }

    await knex("appointments").where("customer_id", id).update({
      appointment_date,
      invoice_amount,
    });

    console.log("  Update Successful for ID:", id);
    res
      .status(200)
      .json({ message: "Customer and Appointment updated successfully" });
  } catch (error) {
    console.error(" Error updating data:", error.message);
    res
      .status(500)
      .json({ error: "Error updating data", details: error.message });
  }
});

// update-inventory
router.post("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    const newItem = req.body;

    const inventory_id = await generateInventoryId();
    await knex("inventory").insert({
      inventory_id,
      ...newItem,
      uom: newItem.uom,
    });

    await logChange(token, "inventory", "INSERT", inventory_id, newItem);

    res.status(201).json({ inventory_id, ...newItem });
  } catch (error) {
    res.status(500).json({
      error: "Error creating inventory item",
      details: error.message,
    });
  }
});

// Delete CT Invoice
router.put("/delete/:appointmentId", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    const { appointmentId } = req.params;

    const updateInvoice = await knex("appointments")
      .where({ appointment_id: appointmentId })
      .update({ status: "deleted" });

    await logChange(
      token,
      "appointment-to-invoice",
      "DELETE",
      appointmentId,
      updateInvoice
    );

    res.status(201).json({ appointmentId });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      error: "Error creating inventory item",
      details: error.message,
    });
  }
});

export default router;
