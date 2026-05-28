import express from "express";
import knexLib from "knex";
import knexConfig from "../knexfile.js";
import { body, validationResult } from "express-validator";
import logChange from "../middleware/changeLog.js";
import { generateVehicleMakeId } from "../utils/idGenerator.js";
import authenticateToken from "../middleware/authenticate.js";

const knex = knexLib(knexConfig);

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
  const vehiclesmake = await knex("vehiclesmake").select("*");
  res.status(200).json(vehiclesmake);
});

router.post("/make", 
  authenticateToken,
  [
    body("make_name").notEmpty().trim(),
    //that models data store in 'A,B,C' format
    //so we need to convert it to array
    body("models").custom(value => {
      if (Array.isArray(value)) return true;
      if (typeof value === 'string') return true;
      return false;
    })
  ],
  async (req, res) => {
    console.log("request body", req.body);
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { make_name, models } = req.body;
      const make_id = await generateVehicleMakeId('VSM');
      
      // const modelsArray = Array.isArray(models) ? models : models.split(',').map(m => m.trim());

      // console.log('Attempting to insert:', {
      //   make_id,
      //   make_name,
      //   models: JSON.stringify(modelsArray)
      // });

      // Database insertion
      try {
        await knex("vehiclesmake").insert({
          make_id : make_id,
          make_name : make_name,
          models: models
        });
        res.status(201).json({ make_id, make_name, models: models });
      } catch (dbError) {
        console.error('Database insertion error:', dbError);
        throw dbError;
      }
    } catch (error) {
      console.error('Error creating vehicle make:', error);
      const errorMessage = error.name === 'JsonWebTokenError' 
        ? 'Authentication token is invalid or expired'
        : 'Failed to create vehicle make';
      
      res.status(error.name === 'JsonWebTokenError' ? 401 : 500).json({ 
        error: errorMessage,
        details: error.message
      });
    }
});

router.delete("/make/:make_id", authenticateToken, async (req, res) => {
  // console.log("request body", req.body);
  try {
    const { make_id } = req.params;
    await knex("vehiclesmake").where({ make_id }).del();
    await logChange("vehiclesmake", "delete", make_id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete vehicle make" });
  }
});

router.put("/make/:make_id",
  authenticateToken,
  [
    body("make_name").notEmpty().trim(),
    body("models").custom(value => {
      if (Array.isArray(value)) return true;
      if (typeof value === 'string') return true;
      return false;
    })
  ],
  async (req, res) => {
    console.log(req.body)
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { make_id } = req.params;
      const { make_name, models } = req.body;
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      const updated = await knex("vehiclesmake")
        .where({ make_id })
        .update({
          make_name,
          models: models
        });

      console.log("updated", updated);
      if (!updated) {
        return res.status(404).json({ error: "Vehicle make not found" });
      }

      await logChange(token,"vehiclesmake", "update", make_id);

      console.log("updated", updated);
      res.status(200).json({ make_id, make_name, models: models });
    } catch (error) {
      console.error('Error updating vehicle make:', error);
      res.status(500).json({ error: "Failed to update vehicle make" });
    }
});

export default router;
