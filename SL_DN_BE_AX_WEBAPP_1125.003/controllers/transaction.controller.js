import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";
import jwt from "jsonwebtoken";

const knex = knexLib(knexConfig);

export async function createTransaction(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const userRole = decoded.role;

  try {
    const {
      transaction_type,
      transaction_date,
      quantity,
      inventory_id,
      description,
    } = req.body;

    console.log(req.body);

    const data = {
      transaction_type,
      transaction_date,
      quantity,
      inventory_id,
      description,
    };

    if (userRole === "Admin") {
      data.description = "Initial Upload-" + data.description;
    } else {
      data.description = "RE-" + data.description;
    }

    await knex("transactions").insert(data);
    await logChange(token, "material movement", "INSERT", inventory_id, data);

    res.status(201).json({ message: "Transaction created successfully" });
  } catch (error) {
    console.log("Error creating transaction:", error);
    res
      .status(400)
      .json({ error: "Error creating transaction", details: error.message });
  }
}

export async function getAllTransactions(req, res) {
  try {
    const transactions = await knex("transactions").select("*");
    res.status(200).json(transactions);
  } catch (error) {
    console.log("Error fetching transactions:", error);
    res
      .status(500)
      .json({ error: "Error fetching transactions", details: error.message });
  }
}

export async function getTransactionById(req, res) {
  try {
    const transaction = await knex("transactions")
      .where("transaction_id", req.params.transaction_id)
      .first();
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.status(200).json(transaction);
  } catch (error) {
    console.log("Error fetching transaction:", error);
    res
      .status(500)
      .json({ error: "Error fetching transaction", details: error.message });
  }
}

export async function getTransactionByInventoryId(req, res) {
  try {
    const transaction = await knex("transactions")
      .where("inventory_id", req.params.inventory_id)
      .orderBy("transaction_date", "asc")
      .select("*");

    if (!transaction || transaction.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(transaction);
  } catch (error) {
    console.log("Error fetching transaction:", error);
    res
      .status(500)
      .json({ error: "Error fetching transaction", details: error.message });
  }
}

export async function updateTransaction(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  const newData = req.body;

  try {
    const { transaction_id } = req.params;

    const currentData = await knex("transactions")
      .where({ transaction_id })
      .first();

    if (!currentData) {
      return res.status(404).json({ message: "Transaction not found" });
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
      await logChange(token, "transactions", "UPDATE", transaction_id, changes);
    }

    const updatedRows = await knex("transactions")
      .where({ transaction_id })
      .update(newData);

    if (updatedRows) {
      res
        .status(200)
        .json({ message: "Transaction updated successfully", changes });
    } else {
      res.status(404).json({ message: "Transaction not updated" });
    }
  } catch (error) {
    console.error("Error updating transaction:", error.message);
    res
      .status(500)
      .json({ error: "Failed to update transaction", details: error.message });
  }
}

export async function deleteTransaction(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { transaction_id } = req.params;

    const transactionDetails = await knex("transactions")
      .where({ transaction_id })
      .first();

    if (!transactionDetails) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const deletedRows = await knex("transactions")
      .where({ transaction_id })
      .del();

    if (deletedRows === 0) {
      return res.status(404).json({ error: "Transaction could not be deleted" });
    }

    const changes = {
      deleted_transaction: transactionDetails,
    };
    await logChange(token, "transactions", "DELETE", transaction_id, changes);

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res
      .status(500)
      .json({ error: "Failed to delete transaction", details: error.message });
  }
}
