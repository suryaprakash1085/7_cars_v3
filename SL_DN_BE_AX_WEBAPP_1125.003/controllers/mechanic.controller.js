import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

export async function createMechanic(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const newData = req.body;

  try {
    const { mechanic_id, mechanic_name, phone, email, specialties } = req.body;
    await knex("mechanics").insert({
      mechanic_id,
      mechanic_name,
      phone,
      email,
      specialties: JSON.stringify(specialties),
    });

    await logChange(token, "mechanics", "INSERT", mechanic_id, newData);
    res.status(201).json({ message: "Mechanic created successfully" });
  } catch (error) {
    console.log("Error creating mechanic:", error);
    res.status(400).json({
      error: "Error creating mechanic",
      details: error.message,
    });
  }
}

export async function getAllMechanics(req, res) {
  try {
    const mechanics = await knex("mechanics").select("*");
    mechanics.forEach((mechanic) => {
      mechanic.specialties = JSON.parse(mechanic.specialties);
    });
    res.status(200).json(mechanics);
  } catch (error) {
    console.log("Error fetching mechanics:", error);
    res.status(500).json({
      error: "Error fetching mechanics",
      details: error.message,
    });
  }
}

export async function getMechanicById(req, res) {
  try {
    const mechanic = await knex("mechanics")
      .where("mechanic_id", req.params.mechanic_id)
      .first();

    if (!mechanic) {
      return res.status(404).json({ error: "Mechanic not found" });
    }

    mechanic.specialties = JSON.parse(mechanic.specialties);
    res.status(200).json(mechanic);
  } catch (error) {
    console.log("Error fetching mechanic:", error);
    res.status(500).json({
      error: "Error fetching mechanic",
      details: error.message,
    });
  }
}

export async function updateMechanic(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  let mechanicId = req.params.mechanic_id;

  try {
    const { mechanic_name, phone, email, specialties } = req.body;

    const newData = {
      mechanic_name,
      phone,
      email,
      specialties: JSON.stringify(specialties),
    };

    const updated = await knex("mechanics")
      .where("mechanic_id", mechanicId)
      .update(newData);

    if (!updated) {
      return res.status(404).json({ error: "Mechanic not found" });
    }

    await logChange(token, "mechanics", "UPDATE", mechanicId, newData);
    res.status(200).json({ message: "Mechanic updated successfully" });
  } catch (error) {
    console.log("Error updating mechanic:", error);
    res.status(500).json({
      error: "Error updating mechanic",
      details: error.message,
    });
  }
}

export async function deleteMechanic(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const mechanicId = req.params.mechanic_id;

  try {
    const mechanic = await knex("mechanics")
      .where("mechanic_id", mechanicId)
      .first();

    if (!mechanic) {
      return res.status(404).json({ error: "Mechanic not found" });
    }

    await knex("mechanics").where("mechanic_id", mechanicId).del();

    await logChange(token, "mechanics", "DELETE", mechanicId, mechanic);
    res.status(200).json({ message: "Mechanic deleted successfully" });
  } catch (error) {
    console.log("Error deleting mechanic:", error);
    res.status(500).json({
      error: "Error deleting mechanic",
      details: error.message,
    });
  }
}
