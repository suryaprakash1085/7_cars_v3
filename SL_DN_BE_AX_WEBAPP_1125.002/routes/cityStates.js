import express from "express";
import * as cityStatesController from "../controllers/cityStates.controller.js";

const router = express.Router();

router.get("/", cityStatesController.getAllCitiesAndStates);
router.post("/", cityStatesController.addStateOrCity);
router.put("/city", cityStatesController.updateCity);
router.delete("/city", cityStatesController.deleteCity);
router.delete("/state", cityStatesController.deleteState);

export default router;
