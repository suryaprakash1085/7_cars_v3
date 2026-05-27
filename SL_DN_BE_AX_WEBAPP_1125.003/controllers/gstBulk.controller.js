import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

export async function getBulkAppointments(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const { fromDate, toDate, dateField = "appointment_date", includeConverted = false } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        error: "fromDate and toDate query parameters are required",
      });
    }

    const validDateFields = ["appointment_date", "completed_date", "invoice_date"];
    const filterField = validDateFields.includes(dateField) ? dateField : "appointment_date";

    const appointmentsQuery = knex("appointments")
      .leftJoin("customers", "appointments.customer_id", "customers.customer_id")
      .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
      .leftJoin("appointment_to_invoice", "appointments.appointment_id", "appointment_to_invoice.appointment_id")
      .select(
        "appointments.appointment_id",
        "appointments.invoice_amount",
        "appointments.status",
        "appointments.invoice_date",
        "appointments.completed_date",
        "appointments.appointment_date",
        "appointments.is_gst_converted",
        
        "customers.customer_name",
        "customers.customer_id",
        "vehicles.plate_number",
        "vehicles.vehicle_id",
        "appointment_to_invoice.invoice_id"
      )
      .whereBetween(`appointments.${filterField}`, [fromDate, toDate])
      .andWhere("appointments.status", "=", "invoiced")
      .andWhere("appointments.invoice_amount", ">", 0);

    if (includeConverted !== "true") {
      appointmentsQuery.andWhere((builder) => {
        builder
          .where("appointments.is_gst_converted", "=", false)
          .orWhereNull("appointments.is_gst_converted");
      });
    }

    const appointments = await appointmentsQuery.orderBy("appointments.appointment_id", "desc");

    if (appointments.length === 0) {
      return res.status(200).json({
        message: "No eligible appointments found for the selected date range",
        appointments: [],
      });
    }

    const appointmentIds = appointments.map((a) => a.appointment_id);

    if (!appointmentIds.length) {
      return res.status(200).json({
        message: "No eligible appointments found for the selected date range",
        appointments: [],
      });
    }

    const [spares, labourCharges] = await Promise.all([
      knex("items_required")
        .leftJoin("services_actual", "items_required.service_id", "services_actual.service_id")
        .whereIn("services_actual.appointment_id", appointmentIds)
        .select(
          "items_required.id",
          "services_actual.appointment_id",
          "items_required.item_name",
          "items_required.qty as item_quantity",
          "items_required.price as item_price",
          "items_required.tax",
          "items_required.item_gst_amount"
        ),
      knex("services_actual")
        .whereIn("appointment_id", appointmentIds)
        .select(
          "service_id",
          "appointment_id",
          "service_type",
          "service_cost",
          "labour_gst_percent",
          "labour_gst_amount"
        ),
    ]);

    const enrichedAppointments = appointments.map((apt) => {
      const aptSpares = spares.filter((s) => s.appointment_id === apt.appointment_id);
      const aptLabour = labourCharges.filter((l) => l.appointment_id === apt.appointment_id);

      const totalSpareAmount = aptSpares.reduce((sum, s) => sum + (s.item_price * s.item_quantity || 0), 0);
      const totalLabourAmount = aptLabour.reduce((sum, l) => sum + (l.service_cost || 0), 0);

      return {
        appointment_id: apt.appointment_id,
        invoice_id: apt.invoice_id,
        customer_name: apt.customer_name,
        customer_id: apt.customer_id,
        plate_number: apt.plate_number,
        vehicle_id: apt.vehicle_id,
        invoice_amount: apt.invoice_amount,
        appointment_date: apt.appointment_date,
        invoice_date: apt.invoice_date,
        completed_date: apt.completed_date,
        status: apt.status,
        is_gst_converted: apt.is_gst_converted || false,
        spares: aptSpares.map((s) => ({
          spare_id: s.id,
          item_name: s.item_name,
          item_quantity: s.item_quantity,
          item_price: s.item_price,
          total_price: s.item_price * s.item_quantity,
          gst_percent: s.tax || 0,
          gst_amount: s.item_gst_amount || 0,
        })),
        labour: aptLabour.map((l) => ({
          service_id: l.service_id,
          service_type: l.service_type,
          service_cost: l.service_cost,
          gst_percent: l.labour_gst_percent || 0,
          gst_amount: l.labour_gst_amount || 0,
        })),
        total_spare_amount: totalSpareAmount,
        total_labour_amount: totalLabourAmount,
      };
    });

    res.status(200).json({
      message: "Eligible appointments fetched successfully",
      count: enrichedAppointments.length,
      appointments: enrichedAppointments,
    });
  } catch (error) {
    console.error("Error fetching bulk appointments:", error.message);
    res.status(500).json({
      error: "Error fetching eligible appointments",
      details: error.message,
    });
  }
}

export async function bulkConvertGST(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  const { appointments: appointmentsData } = req.body;

  if (!appointmentsData || !Array.isArray(appointmentsData) || appointmentsData.length === 0) {
    return res.status(400).json({
      error: "Invalid request. Expected 'appointments' array with at least one appointment",
    });
  }

  const trx = await knex.transaction();

  try {
    const results = [];
    const errors = [];

    for (const aptData of appointmentsData) {
      try {
        const { appointment_id, spares, labour } = aptData;

        console.log(`Processing appointment ${appointment_id}:`, {
          spares_count: spares?.length || 0,
          labour_count: labour?.length || 0,
          spares: spares?.slice(0, 1),
        });

        if (!appointment_id) {
          errors.push({
            appointment_id: "unknown",
            error: "appointment_id is required",
          });
          continue;
        }

        const appointment = await trx("appointments")
          .where("appointment_id", appointment_id)
          .first();

        if (!appointment) {
          errors.push({
            appointment_id,
            error: "Appointment not found",
          });
          continue;
        }

        if (appointment.is_gst_converted) {
          errors.push({
            appointment_id,
            error: "Appointment already converted to GST",
          });
          continue;
        }

        if (appointment.status !== "invoiced") {
          errors.push({
            appointment_id,
            error: "Appointment must be invoiced before GST conversion",
          });
          continue;
        }

        if (spares && Array.isArray(spares)) {
          for (const spare of spares) {
            const { spare_id, gst_percent, gst_amount } = spare;

            if (!spare_id) continue;

            if (typeof gst_percent !== "number" || gst_percent < 0 || gst_percent > 100) {
              throw new Error(`Invalid GST percent for spare ${spare_id}`);
            }

            if (typeof gst_amount !== "number" || gst_amount < 0) {
              throw new Error(`Invalid GST amount for spare ${spare_id}`);
            }

            const result = await trx("items_required")
              .join("services_actual", "items_required.service_id", "services_actual.service_id")
              .where("items_required.id", spare_id)
              .andWhere("services_actual.appointment_id", appointment_id)
              .update({
                "items_required.tax": gst_percent,
                "items_required.item_gst_amount": gst_amount,
              });

            if (result === 0) {
              throw new Error(`Spare ${spare_id} not found for appointment ${appointment_id}`);
            }

            console.log(`✓ Updated spare ${spare_id}: GST ${gst_percent}% = ₹${gst_amount}`);
          }
        }

        if (labour && Array.isArray(labour)) {
          for (const labourItem of labour) {
            const { service_id, gst_percent, gst_amount } = labourItem;

            if (!service_id) continue;

            if (typeof gst_percent !== "number" || gst_percent < 0 || gst_percent > 100) {
              throw new Error(`Invalid GST percent for service ${service_id}`);
            }

            if (typeof gst_amount !== "number" || gst_amount < 0) {
              throw new Error(`Invalid GST amount for service ${service_id}`);
            }

            await trx("services_actual")
              .where("service_id", service_id)
              .andWhere("appointment_id", appointment_id)
              .update({
                labour_gst_percent: gst_percent,
                labour_gst_amount: gst_amount,
              });
          }
        }

        await trx("appointments")
          .where("appointment_id", appointment_id)
          .update({
            is_gst_converted: true,
            gst_conversion_date: new Date().toISOString().split("T")[0],
          });

        results.push({
          appointment_id,
          status: "success",
          message: "GST conversion completed successfully",
        });
      } catch (error) {
        errors.push({
          appointment_id: aptData.appointment_id || "unknown",
          error: error.message,
        });
      }
    }

    await trx.commit();

    if (results.length > 0) {
      try {
        await logChange(token, "appointments", "BULK_UPDATE_GST", "bulk", {
          converted_count: results.length,
          error_count: errors.length,
          appointment_ids: results.map((r) => r.appointment_id),
        });
      } catch (logError) {
        console.error("Error logging change:", logError.message);
      }
    }

    res.status(200).json({
      message: "Bulk GST conversion completed",
      successful: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    await trx.rollback();
    console.error("Error in bulk GST conversion:", error.message);
    res.status(500).json({
      error: "Error processing bulk GST conversion",
      details: error.message,
    });
  }
}
