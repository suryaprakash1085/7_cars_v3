import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

export async function createExpense(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const { expenseDate, type, description, credit, debit } = req.body;

    const dt = new Date(expenseDate);
    const day = String(dt.getDate()).padStart(2, "0");
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const year = dt.getFullYear();
    const formattedDate = `${year}-${month}-${day}`;

    let expenseData = {
      date: formattedDate,
      type: type,
      description: description,
      credit: credit,
      debit: debit,
    };

    const postedData = await knex("expenses").insert(expenseData);

    await logChange(token, "expenses", "INSERT", type, expenseData);

    res.status(201).json({
      message: "Expense added successfully",
      expenseId: postedData[0],
    });
  } catch (error) {
    console.error("Error adding expense:", error.message);
    res
      .status(500)
      .json({ error: "Failed to add expense", details: error.message });
  }
}

export async function getAllExpenses(req, res) {
  try {
    const expenses = await knex("expenses").select("*");
    res.status(200).json(expenses);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch expenses", details: error.message });
  }
}

export async function getExpenseById(req, res) {
  try {
    const { id } = req.params;
    const expense = await knex("expenses").where({ id }).first();
    if (expense) {
      res.status(200).json(expense);
    } else {
      res.status(404).json({ message: "Expense not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch expense", details: error.message });
  }
}

export async function updateExpense(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const newData = req.body;

  try {
    const { id } = req.params;
    const { date, description, credit, debit } = newData;

    const currentData = await knex("expenses").where({ id }).first();

    if (!currentData) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const changes = {};
    for (const key in newData) {
      if (currentData[key] !== newData[key]) {
        changes[key] = {
          old: currentData[key],
          new: newData[key],
        };
      }
    }

    if (Object.keys(changes).length > 0) {
      await logChange(token, "expenses", "UPDATE", id, changes);
    }

    const updatedRows = await knex("expenses")
      .where({ id })
      .update({ date, description, credit, debit });

    if (updatedRows) {
      res
        .status(200)
        .json({ message: "Expense updated successfully", changes });
    } else {
      res.status(404).json({ message: "Expense not updated" });
    }
  } catch (error) {
    console.error("Error updating expense:", error.message);
    res
      .status(500)
      .json({ error: "Failed to update expense", details: error.message });
  }
}

export async function deleteExpense(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { id } = req.params;

    const expenseDetails = await knex("expenses").where({ id }).first();

    if (!expenseDetails) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const deletedRows = await knex("expenses").where({ id }).del();

    if (deletedRows === 0) {
      return res.status(404).json({ error: "Expense could not be deleted." });
    }

    const changes = {
      deleted_expense: expenseDetails,
    };
    await logChange(token, "expenses", "DELETE", id, changes);

    res.status(200).json({ message: "Expense deleted successfully." });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({
      error: "Failed to delete expense.",
      details: error.message,
    });
  }
}
