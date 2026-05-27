import express from "express";
import * as mechanicController from "../controllers/mechanic.controller.js";

const router = express.Router();

router.post("/", mechanicController.createMechanic);
router.get("/", mechanicController.getAllMechanics);
router.get("/:mechanic_id", mechanicController.getMechanicById);
router.put("/:mechanic_id", mechanicController.updateMechanic);
router.delete("/:mechanic_id", mechanicController.deleteMechanic);

export default router;
