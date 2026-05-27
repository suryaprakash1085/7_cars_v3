import knexLib from "knex";
import knexConfig from "../knexfile.js";
import { validationResult } from "express-validator";
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

export async function createGST(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { gst_name, gst_percentage } = req.body;

    const lastId = await knex("gst").max("id as maxId").first();
    const newId = (lastId.maxId || 0) + 1;

    const [id] = await knex("gst").insert({
      id: newId,
      gst_name,
      gst_percentage,
    });

    try {
      await logChange(token, "GST", "INSERT", gst_name, req.body);
    } catch (logError) {
      console.error("Error logging change:", logError.message);
    }

    res.status(201).json({ id, gst_name, gst_percentage });
  } catch (error) {
    console.error("Error creating GST:", error.message);
    res.status(500).json({
      error: "Error creating GST",
      details: error.message,
    });
  }
}

export async function getAllGSTs(req, res) {
  try {
    const gsts = await knex("gst").select("*");
    res.status(200).json(gsts);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching GSTs",
      details: error.message,
    });
  }
}

export async function getGSTById(req, res) {
  try {
    const gst = await knex("gst").where({ id: req.params.id }).first();
    if (!gst) {
      return res.status(404).json({ error: "GST not found" });
    }
    res.status(200).json(gst);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching GST",
      details: error.message,
    });
  }
}

export async function updateGST(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  const newData = req.body;

  try {
    const { id } = req.params;

    const currentData = await knex("gst").where({ id }).first();

    if (!currentData) {
      return res.status(404).json({ error: "GST not found" });
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
      await logChange(token, "gst", "UPDATE", id, changes);
    }

    const updatedRows = await knex("gst").where({ id }).update(newData);

    if (!updatedRows) {
      return res.status(404).json({ error: "GST not found" });
    }

    res.status(200).json({ message: "GST updated successfully" });
  } catch (error) {
    console.error("Error updating GST:", error.message);
    res.status(500).json({
      error: "Error updating GST",
      details: error.message,
    });
  }
}

export async function deleteGST(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const { id } = req.params;

    const gst = await knex("gst").where({ id }).first();

    if (!gst) {
      return res.status(404).json({ error: "GST not found" });
    }

    const deletedRows = await knex("gst").where({ id }).del();

    if (!deletedRows) {
      return res.status(404).json({ error: "GST could not be deleted" });
    }

    await logChange(token, "gst", "DELETE", id, gst);

    res.status(200).json({ message: "GST deleted successfully" });
  } catch (error) {
    console.error("Error deleting GST:", error.message);
    res.status(500).json({
      error: "Error deleting GST",
      details: error.message,
    });
  }
}
