import express from "express";
import knexLib from "knex";
import knexConfig from "../knexfile.js";
import authenticateToken from "../middleware/authenticate.js";
import logChange from "../middleware/changeLog.js";
import { body, validationResult } from "express-validator";

const knex = knexLib(knexConfig);

const getTzDate = (req) => {
  if (req.tzHelpers) return req.tzHelpers.format(new Date(), "YYYY-MM-DD");
  return new Date().toISOString().slice(0, 10);
};

const router = express.Router();

//? CREATE: Add credit when creating customer invoice
router.post("/customer/credit", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const appointment_id = req.body.appointment_id;
  const customer_id = req.body.customer_id;
  const creation_date = getTzDate(req);
  let credit = req.body.credit;
  let expense_type = "Credit";
  let description;
  let invoice_id;

  // Get active invoice ID
  const invoice = await knex("appointment_to_invoice")
    .where({ appointment_id: appointment_id, invoice_status: "active" })
    .first();

  invoice_id = invoice.invoice_id;
  description = `Credit for customer #${customer_id} against invoice #${invoice_id}`;

  let dataForFinanceTable = {
    appointment_id: appointment_id,
    customer_id: customer_id,
    creation_date: creation_date,
    credit: credit,
    expense_type: expense_type,
    description: description,
    invoice_no: invoice_id,
    type: "customer",
  };

  try {
    const postedData = await knex("finance").insert(dataForFinanceTable);

    await logChange(
      token,
      "finance",
      "INSERT",
      postedData[0],
      dataForFinanceTable
    );

    res.status(201).json({
      message: "Credit added successfully",
      creditId: postedData[0],
    });
  } catch (error) {
    console.error("Error adding credit:", error.message);
    res
      .status(500)
      .json({ error: "Error adding credit", details: error.message });
  }
});

//? CREATE: Add debit in customer payments
router.post("/customer/debit", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const appointment_id = req.body.appointment_id;
  const customer_id = req.body.customer_id;
  const creation_date = getTzDate(req);
  let debit = req.body.debit;
  let expense_type = "Debit";
  let description;
  let invoice_id;

  //   Get active invoice ID
  const invoice = await knex("appointment_to_invoice")
    .where({ appointment_id: appointment_id, invoice_status: "active" })
    .first();

  invoice_id = invoice?.invoice_id || appointment_id;
  description = `Debit to customer #${customer_id} against invoice #${invoice_id}`;

  let dataForFinanceTable = {
    appointment_id: appointment_id,
    customer_id: customer_id,
    creation_date: creation_date,
    debit: debit,
    expense_type: expense_type,
    description: description,
    invoice_no: invoice_id,
    type: "customer",
  };

  try {
    const postedData = await knex("finance").insert(dataForFinanceTable);

    await logChange(
      token,
      "finance",
      "INSERT",
      postedData[0],
      dataForFinanceTable
    );

    res.status(201).json({
      message: "Credit added successfully",
      creditId: postedData[0],
    });
  } catch (error) {
    console.error("Error adding credit:", error.message);
    res
      .status(500)
      .json({ error: "Error adding credit", details: error.message });
  }
});

router.post("/supplier/credit", async (req, res) => {
  console.log(req.body);
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const appointment_id = req.body.appointment_id;
  const customer_id = req.body.formData.customer_id;
  const creation_date = getTzDate(req);
  let credit = req.body.formData.credit;
  let expense_type = "Credit";
  let description;
  let invoice_id = req.body.formData.invoice_id;

  // Get active invoice ID
  // const invoice = await knex("appointment_to_invoice")
  //   .where({ customer_id: customer_id, invoice_status: "active" })
  //   .first();

  invoice_id = invoice_id;
  description = `Credit for Supplier #${customer_id} against invoice #${invoice_id}`;

  let dataForFinanceTable = {
    appointment_id: appointment_id || "",
    customer_id: customer_id,
    creation_date: creation_date,
    credit: credit,
    expense_type: expense_type,
    description: description,
    invoice_no: invoice_id,
    type: "supplier",
  };
  console.log("my", dataForFinanceTable);
  try {
    const postedData = await knex("finance").insert(dataForFinanceTable);

    await logChange(
      token,
      "finance",
      "INSERT",
      postedData[0],
      dataForFinanceTable
    );

    res.status(201).json({
      message: "Credit added successfully",
      creditId: postedData[0],
    });
  } catch (error) {
    console.error("Error adding credit:", error.message);
    res
      .status(500)
      .json({ error: "Error adding credit", details: error.message });
  }
});

//? CREATE: Add debit in customer payments
router.post("/supplier/debit", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const appointment_id = req.body.appointment_id;
  const customer_id = req.body.customer_id;
  const creation_date = getTzDate(req);
  let debit = req.body.debit;
  let expense_type = "Debit";
  let description;
  let invoice_id;

  //   Get active invoice ID
  const invoice = await knex("appointment_to_invoice")
    .where({ appointment_id: appointment_id, invoice_status: "active" })
    .first();

  invoice_id = invoice.invoice_id;
  description = `Debit for Supplier #${customer_id} against invoice #${invoice_id}`;

  let dataForFinanceTable = {
    appointment_id: appointment_id || "",
    customer_id: customer_id,
    creation_date: creation_date,
    debit: debit,
    expense_type: expense_type,
    description: description,
    invoice_no: invoice_id,
    type: "supplier",
  };

  try {
    const postedData = await knex("finance").insert(dataForFinanceTable);

    await logChange(
      token,
      "finance",
      "INSERT",
      postedData[0],
      dataForFinanceTable
    );

    res.status(201).json({
      message: "Credit added successfully",
      creditId: postedData[0],
    });
  } catch (error) {
    console.error("Error adding credit:", error.message);
    res
      .status(500)
      .json({ error: "Error adding credit", details: error.message });
  }
});

// route to check if appointment or invoice is already exists
router.get("/check-appointment-invoice", async (req, res) => {
  const appointment_id = req.query.appointment_id;

  try {
    const appointment = await knex("finance").where({ appointment_id });

    if (appointment.length > 0) {
      return res.status(200).json({
        message: "Appointment exists",
        appointment,
      });
    }


    return res.status(200).json({
      message: "No appointment or invoice exists",
    });
  } catch (error) {
    console.error("Error checking appointment/invoice:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});


//  Possible Methos for fetching
// GET /transactions?supplier_id=123
// GET /transactions?customer_id=456&transaction_type=Debit
// GET /transactions?start_date=2025-01-01&end_date=2025-01-31
// GET /transactions?supplier_id=123&transaction_type=Debit&start_date=2025-01-01&end_date=2025-01-31
// GET /transactions?type=Refund
// GET /transactions?supplier_id=123&type=Payment&start_date=2025-01-01&end_date=2025-02-28
// GET /transactions?searchText=SUPP-300001
// GET /transactions?supplier_id=SUPP-300001&searchText=dish

// old code

// router.get("/transactions", async (req, res) => {
//   const {
//     supplier_id,
//     customer_id,
//     transaction_type,
//     start_date,
//     end_date,
//     type,
//     searchText,
//   } = req.query;

//   // Build the query dynamically based on available filters
//   let query = knex("finance");

//   // Apply supplier filter if provided
//   if (supplier_id) {
//     query = query.where({ customer_id: supplier_id }); // Assuming `supplier_id` is stored as `customer_id`
//   }

//   // Apply customer filter if provided
//   if (customer_id) {
//     query = query.where({ customer_id: customer_id });
//   }

//   // Apply transaction type filter (debit/credit) if provided
//   if (transaction_type) {
//     query = query.where({ expense_type: transaction_type });
//   }

//   // Apply type filter if provided (new field)
//   if (type) {
//     query = query.where({ type: type });
//   }

//   // Apply date range filter if provided
//   if (start_date && end_date) {
//     query = query.whereBetween("creation_date", [start_date, end_date]);
//   } else if (start_date) {
//     query = query.where("creation_date", ">=", start_date);
//   } else if (end_date) {
//     query = query.where("creation_date", "<=", end_date);
//   }

//   // Apply searchText filter if provided (search across multiple fields)
//   if (searchText) {
//     query = query.where(function () {
//       this.where("customer_id", "like", `%${searchText}%`)
//         .orWhere("invoice_no", "like", `%${searchText}%`)
//         .orWhere("description", "like", `%${searchText}%`)
//         .orWhere("expense_type", "like", `%${searchText}%`)
//         .orWhere("type", "like", `%${searchText}%`);
//     });
//   }

//   try {
//     // Fetch the filtered data
//     const transactions = await query;

//     res.status(200).json({
//       message: "Transactions fetched successfully",
//       data: transactions,
//     });
//   } catch (error) {
//     console.error("Error fetching transactions:", error.message);
//     res
//       .status(500)
//       .json({ error: "Error fetching transactions", details: error.message });
//   }
// });



router.get("/transactions", async (req, res) => {
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
      .leftJoin(
        "appointments as a",
        "f.appointment_id",
        "a.appointment_id" // ✅ CORRECT JOIN
      )
      .select(
        "f.*",
        "a.payment_method"
      );

    // Supplier filter
    if (supplier_id) {
      query.where("f.customer_id", supplier_id);
    }

    // Customer filter
    if (customer_id) {
      query.where("f.customer_id", customer_id);
    }

    // Transaction type
    if (transaction_type) {
      query.where("f.expense_type", transaction_type);
    }

    // Finance type
    if (type) {
      query.where("f.type", type);
    }

    // Date filter
    if (start_date && end_date) {
      query.whereBetween("f.creation_date", [start_date, end_date]);
    } else if (start_date) {
      query.where("f.creation_date", ">=", start_date);
    } else if (end_date) {
      query.where("f.creation_date", "<=", end_date);
    }

    // Search filter
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
});




//? CREATE: Add debit in customer payments
router.post("/ledgerBook", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const creation_date = req.body.date || getTzDate(req);
  // let debit = req.body.amount;
  let expense_type = req.body.type;
  let credit = req.body.credit;
  let debit = req.body.debit;
  let description = req.body.description;

  let dataForFinanceTable = {
    creation_date: creation_date,
    debit: debit,
    credit: credit,
    expense_type: expense_type,
    description: description,
    // expense_type: type,
  };

  try {
    const postedData = await knex("finance").insert(dataForFinanceTable);

    await logChange(
      token,
      "finance",
      "INSERT",
      postedData[0],
      dataForFinanceTable
    );

    res.status(201).json({
      message: "Credit added successfully",
      creditId: postedData[0],
    });
  } catch (error) {
    console.error("Error adding credit:", error.message);
    res
      .status(500)
      .json({ error: "Error adding credit", details: error.message });
  }
});

// Update a row in the finance table dynamically
router.put("/update_ledger", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const {
    id,
    appointment_id,
    customer_id,
    invoice_no,
    status,
    creation_date,
    expense_type,
    type,
    description,
    credit,
    debit,
  } = req.body;

  // Initialize the base query
  let query = knex("finance");

  if (!id) {
    return res.status(400).json({ message: "ID is required to update a row" });
  }

  // Dynamically build the update data object
  let updateData = {};

  // Add each field if it's provided in the request body
  if (appointment_id) updateData.appointment_id = appointment_id;
  if (customer_id) updateData.customer_id = customer_id;
  if (invoice_no) updateData.invoice_no = invoice_no;
  if (status) updateData.status = status;
  if (creation_date) updateData.creation_date = creation_date;
  if (expense_type) updateData.expense_type = expense_type;
  if (type) updateData.type = type;
  if (description) updateData.description = description;
  if (credit) updateData.credit = credit;
  if (debit) updateData.debit = debit;

  // Ensure there's at least one field to update
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: "No data to update" });
  }

  try {
    // Dynamically apply the where condition for the update
    query = query.where({ id });

    // Perform the update query dynamically
    const updatedRows = await query.update(updateData);

    if (updatedRows === 0) {
      return res
        .status(404)
        .json({ message: "No record found to update with the given ID" });
    }

    // Log the change (assuming logChange function exists and works correctly)
    await logChange(token, "finance", "UPDATE", id, updateData);

    return res.status(200).json({
      message: "Row updated successfully",
      updatedRows: updatedRows,
    });
  } catch (error) {
    console.error("Error updating row:", error.message);
    return res
      .status(500)
      .json({ error: "Error updating row", details: error.message });
  }
});

router.post("/post_ledger", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const {
    id,
    appointment_id,
    customer_id,
    invoice_no,
    status,
    creation_date,
    expense_type,
    type,
    description,
    credit,
    debit,
  } = req.body;

  console.log({ hajflak: req.body });

  // Initialize the base query
  let query = knex("finance");

  // Dynamically build the update data object
  let updateData = {};

  // Add each field if it's provided in the request body
  if (appointment_id) updateData.appointment_id = appointment_id;
  if (customer_id) updateData.customer_id = customer_id;
  if (invoice_no) updateData.invoice_no = invoice_no;
  if (status) updateData.status = status;
  if (creation_date) updateData.creation_date = creation_date;
  if (expense_type) updateData.expense_type = expense_type;
  if (type) updateData.type = type;
  if (description) updateData.description = description;
  if (credit) updateData.credit = credit;
  if (debit) updateData.debit = debit;

  // Ensure there's at least one field to update
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: "No data to update" });
  }

  try {
    // Perform the update query dynamically
    const updatedRows = await query.insert(updateData);

    if (updatedRows === 0) {
      return res
        .status(404)
        .json({ message: "No record found to update with the given ID" });
    }

    // Log the change (assuming logChange function exists and works correctly)
    await logChange(token, "finance", "UPDATE", id, updateData);

    return res.status(200).json({
      message: "Row updated successfully",
      updatedRows: updatedRows,
    });
  } catch (error) {
    console.error("Error updating row:", error.message);
    return res
      .status(500)
      .json({ error: "Error updating row", details: error.message });
  }
});

router.get("/supplier/outstanding/:supplierId", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const { supplierId } = req.params;

  try {
    const supplierDetails = await knex("finance")
      .where("customer_id", supplierId)
      .select(
        knex.raw("SUM(credit) AS totalCredit"),
        knex.raw("SUM(debit) AS totalDebit")
      )
      .first(); // To get a single result object

    // Calculate the difference
    const difference =
      (supplierDetails.totalCredit || 0) - (supplierDetails.totalDebit || 0);

    res.send({ outstanding: difference });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error Getting Supplier Outstanding",
      details: error.message,
    });
  }
});

export default router;
