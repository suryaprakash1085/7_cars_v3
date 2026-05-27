import express from "express";
import { body } from "express-validator";
import authenticateToken from "../middleware/authenticate.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

// Register a new user
router.post("/register", authController.register);

// Register a new employee
router.post("/create/employee", authController.createEmployee);

// Get all users
router.get("/users", authController.getUsers);

// get all roles
router.get("/roles", authController.getAllRoles);

//delete role by role_id  
router.delete("/role/:role_id", authController.deleteRole);

// update user shift type
router.put("/shift/update-shift-type", authController.updateShiftType);

// NULL THE USERS SHIFT TYPE BY USER ID
router.put("/shift/null-shift-type", authController.nullShiftType);

// Login a user
router.post("/login", authController.login);

// Update user by user ID
router.put("/update/:userId", authController.updateUser);

// Update access for multiple roles
router.put("/update-access", authController.updateAccess);




router.put("/change_password",authController.changePassword);
// Add a new role
router.post("/add-role", authController.addRole);

// Create a new time entry
router.post("/time/time-entry", authController.createTimeEntry);

// Get all time entries
router.get("/time/time-entries", authController.getTimeEntries);

// Update a time entry by ID
router.put("/time/time-entry/:id", authController.updateTimeEntry);

// Delete a time entry by ID
router.delete("/time/time-entry/:id", authController.deleteTimeEntry);

// Update user by user ID
router.put("/update_employee/:userId", authController.updateEmployee);

// Delete employee by user ID
router.delete("/delete_employee/:userId", authController.deleteEmployee);

// Assign company code to user (admin only)
router.post("/assign-company-code", authenticateToken, authController.assignCompanyCode);

export default router;
