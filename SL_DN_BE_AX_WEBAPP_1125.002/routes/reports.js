import express from "express";
import * as appointmentController from "../controllers/reports.controller.js";
import { validateCompanyCodePresence } from "../middleware/validateCompanyCode.js";
import authenticateToken from "../middleware/authenticate.js";

const router = express.Router();

// Apply company code validation to appointment routes
// POST, PUT, DELETE require company_code (mandatory)
// GET optionally uses company_code for filtering

router.use(validateCompanyCodePresence);



router.get("/get_appointments_by_date/:start_date/:end_date", appointmentController.getAppointmentsByDateRange);
router.get("/", appointmentController.getAllAppointments);

// router.get("/transactions", reportController.getTransactions);


// router.get("/inventory", reportController.getAllInventory);



router.get("/transactions", appointmentController.getTransactions);
router.get("/inventory", appointmentController.getAllInventory);

export default router;