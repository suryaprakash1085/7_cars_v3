import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";
import { getTodayUTC, dateToUTC, formatDateInTimezone } from "../utils/timezone.service.js";

const knex = knexLib(knexConfig);

export async function addCustomerCredit(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const appointment_id = req.body.appointment_id;
  const customer_id = req.body.customer_id;
  const creation_date = req.tzHelpers ? req.tzHelpers.format(new Date(), "YYYY-MM-DD") : new Date().toISOString().slice(0, 10);
  let credit = req.body.credit;
  let expense_type = "Credit";
  let description;
  let invoice_id;

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
}

export async function addCustomerDebit(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const appointment_id = req.body.appointment_id;
  const customer_id = req.body.customer_id;
  const creation_date = req.tzHelpers ? req.tzHelpers.format(new Date(), "YYYY-MM-DD") : new Date().toISOString().slice(0, 10);
  let debit = req.body.debit;
  let expense_type = "Debit";
  let description;
  let invoice_id;

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
      message: "Debit added successfully",
      debitId: postedData[0],
    });
  } catch (error) {
    console.error("Error adding debit:", error.message);
    res
      .status(500)
      .json({ error: "Error adding debit", details: error.message });
  }
}

export async function addSupplierCredit(req, res) {
  console.log(req.body);
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const appointment_id = req.body.appointment_id;
  const customer_id = req.body.formData.customer_id;
  const creation_date = req.tzHelpers ? req.tzHelpers.format(new Date(), "YYYY-MM-DD") : new Date().toISOString().slice(0, 10);
  let credit = req.body.formData.credit;
  let expense_type = "Credit";
  let description;
  let invoice_id = req.body.formData.invoice_id;

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
}

export async function addSupplierDebit(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const appointment_id = req.body.appointment_id;
  const customer_id = req.body.customer_id;
  const creation_date = req.tzHelpers ? req.tzHelpers.format(new Date(), "YYYY-MM-DD") : new Date().toISOString().slice(0, 10);
  let debit = req.body.debit;
  let expense_type = "Debit";
  let description;
  let invoice_id;

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
      message: "Debit added successfully",
      debitId: postedData[0],
    });
  } catch (error) {
    console.error("Error adding debit:", error.message);
    res
      .status(500)
      .json({ error: "Error adding debit", details: error.message });
  }
}
