import knexLib from "knex";
import knexConfig from "../knexfile.js";
import { validationResult } from "express-validator";
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

export async function createUOM(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { unit_name, unit_shortcode } = req.body;

    const lastId = await knex("uom").max("id as maxId").first();
    const newId = (lastId.maxId || 0) + 1;

    const [id] = await knex("uom").insert({
      id: newId,
      unit_name,
      unit_shortcode,
    });

    try {
      await logChange(token, "UoM", "INSERT", unit_shortcode, req.body);
    } catch (logError) {
      console.error("Error logging change:", logError.message);
    }

    res.status(201).json({ id, unit_name, unit_shortcode });
  } catch (error) {
    console.error("Error creating UOM:", error.message);
    res.status(500).json({
      error: "Error creating UOM",
      details: error.message,
    });
  }
}

export async function getAllUOMs(req, res) {
  try {
    const uoms = await knex("uom").select("*");
    res.status(200).json(uoms);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching UOMs",
      details: error.message,
    });
  }
}

export async function getUOMById(req, res) {
  try {
    const uom = await knex("uom").where({ id: req.params.id }).first();
    if (!uom) {
      return res.status(404).json({ error: "UOM not found" });
    }
    res.status(200).json(uom);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching UOM",
      details: error.message,
    });
  }
}

export async function updateUOM(req, res) {
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

    const currentData = await knex("uom").where({ id }).first();

    if (!currentData) {
      return res.status(404).json({ error: "UOM not found" });
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
      await logChange(token, "uom", "UPDATE", id, changes);
    }

    const updatedRows = await knex("uom").where({ id }).update(newData);

    if (!updatedRows) {
      return res.status(404).json({ error: "UOM not found" });
    }

    res.status(200).json({ message: "UOM updated successfully" });
  } catch (error) {
    console.error("Error updating UOM:", error.message);
    res.status(500).json({
      error: "Error updating UOM",
      details: error.message,
    });
  }
}

export async function deleteUOM(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const { id } = req.params;

    const uom = await knex("uom").where({ id }).first();

    if (!uom) {
      return res.status(404).json({ error: "UOM not found" });
    }

    const deletedRows = await knex("uom").where({ id }).del();

    if (!deletedRows) {
      return res.status(404).json({ error: "UOM could not be deleted" });
    }

    await logChange(token, "uom", "DELETE", id, uom);

    res.status(200).json({ message: "UOM deleted successfully" });
  } catch (error) {
    console.error("Error deleting UOM:", error.message);
    res.status(500).json({
      error: "Error deleting UOM",
      details: error.message,
    });
  }
}
