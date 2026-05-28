import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";
import { generateVehicleMakeId } from "../utils/idGenerator.js";

const knex = knexLib(knexConfig);

export async function getAllVehicles(req, res) {
  try {
    const vehicles = await knex("vehiclesmake").select("*");
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: "Error fetching vehicles", details: error.message });
  }
}

export async function createVehicleMake(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const { make_name, models } = req.body;

    if (!make_name) {
      return res.status(400).json({ error: "make_name is required" });
    }

    let modelsArray = models;
    if (typeof models === "string") {
      modelsArray = [models];
    } else if (!Array.isArray(models)) {
      modelsArray = [];
    }

    const make_id = await generateVehicleMakeId();

    await knex("vehiclesmake").insert({
      make_id,
      make_name,
      models: JSON.stringify(modelsArray),
    });

    await logChange(token, "vehiclesmake", "INSERT", make_id, { make_name, models: modelsArray });

    res.status(201).json({ make_id, make_name, models: modelsArray });
  } catch (error) {
    console.error("Error creating vehicle make:", error.message);
    res.status(500).json({ error: "Error creating vehicle make", details: error.message });
  }
}

export async function updateVehicleMake(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const { make_id } = req.params;
    const { make_name, models } = req.body;

    if (!make_name) {
      return res.status(400).json({ error: "make_name is required" });
    }

    let modelsArray = models;
    if (typeof models === "string") {
      modelsArray = [models];
    } else if (!Array.isArray(models)) {
      modelsArray = [];
    }

    const currentVehicle = await knex("vehiclesmake").where({ make_id }).first();

    if (!currentVehicle) {
      return res.status(404).json({ error: "Vehicle make not found" });
    }

    const changes = {};
    if (currentVehicle.make_name !== make_name) {
      changes.make_name = { old: currentVehicle.make_name, new: make_name };
    }
    if (currentVehicle.models !== JSON.stringify(modelsArray)) {
      changes.models = { old: JSON.parse(currentVehicle.models), new: modelsArray };
    }

    if (Object.keys(changes).length > 0) {
      await logChange(token, "vehiclesmake", "UPDATE", make_id, changes);
    }

    await knex("vehiclesmake").where({ make_id }).update({
      make_name,
      models: JSON.stringify(modelsArray),
    });

    res.status(200).json({ message: "Vehicle make updated successfully" });
  } catch (error) {
    console.error("Error updating vehicle make:", error.message);
    res.status(500).json({ error: "Error updating vehicle make", details: error.message });
  }
}

export async function deleteVehicleMake(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { make_id } = req.params;

    const vehicleDetails = await knex("vehiclesmake").where({ make_id }).first();

    if (!vehicleDetails) {
      return res.status(404).json({ error: "Vehicle make not found" });
    }

    const deletedRows = await knex("vehiclesmake").where({ make_id }).del();

    if (deletedRows === 0) {
      return res.status(404).json({ error: "Vehicle make could not be deleted" });
    }

    await logChange(token, "vehiclesmake", "DELETE", make_id, vehicleDetails);

    res.status(200).json({ message: "Vehicle make deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle make:", error);
    res.status(500).json({ error: "Error deleting vehicle make", details: error.message });
  }
}
