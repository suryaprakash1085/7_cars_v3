import express from "express";
import authenticateToken from "../middleware/authenticate.js";
import { body } from "express-validator";
import multer from "multer";
import * as customerController from "../controllers/customer.controller.js";

const router = express.Router();

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// create a new customer but only customer_name, phone, street, city,and type state are required, type is Customer ,Lead,Blacklisted
router.post("/addLeads", customerController.addLeads);

// delete a customer by customer_id
router.delete("/delete/:customer_id", authenticateToken, customerController.deleteCustomer);

// Bulk upload leads
router.post("/leads/bulkUpload", upload.single("file"), customerController.bulkUploadLeads);

// Create a new customer
router.post(
  "/",
  [
    body("leads_owner").notEmpty().withMessage("leads_owner is required"),
    body("prefix").notEmpty().withMessage("prefix is required"),
    body("customer_name").notEmpty().withMessage("Customer name is required"),
    body("contact.phone")
      .notEmpty()
      .withMessage("Phone number is required")
      .if((value, { req }) => !req.body.one_time)
      .isMobilePhone()
      .withMessage("Valid phone number is required for regular customers"),
    // body("contact.address.street")
    //   .if((value, { req }) => !req.body.one_time)
    //   .notEmpty()
    //   .withMessage("Street is required"),


    body("contact.address.street")
      .optional({ checkFalsy: true, nullable: true }),

    body("contact.address.city").notEmpty().withMessage("City is required"),
    body("contact.address.state").notEmpty().withMessage("State is required"),
    body("vehicles")
      .if((value, { req }) => !req.body.one_time || req.body.vehicles?.length > 0)
      .isArray()
      .withMessage("Vehicles must be an array"),
    // body("vehicles.*.make")
    //   .if((value, { req }) => req.body.vehicles?.length > 0)
    //   .notEmpty()
    //   .withMessage("Vehicle make is required"),
    // body("vehicles.*.model")
    //   .if((value, { req }) => req.body.vehicles?.length > 0)
    //   .notEmpty()
    //   .withMessage("Vehicle model is required"),
    // body("vehicles.*.year")
    //   .if((value, { req }) => req.body.vehicles?.length > 0)
    //   .isInt({ min: 1886 })
    //   .withMessage("Valid vehicle year is required"),
    body("vehicles.*.year")
      .optional({ nullable: true, checkFalsy: true }),
    // .customSanitizer((value) =>
    //     value == null || value === "" ? new Date().getFullYear() : value
    //   )
    //   .toInt(),



  body("vehicles.*.plate_number")
  .if((value, { req }) => 
    req.body.vehicles?.length > 0 && req.body.sales_type !== "counterSales"  // 
  )
  .notEmpty()
  .withMessage("Vehicle plate number is required"),


  ],
  customerController.createCustomer
);

// Get total count of leads, customers, or blacklisted customers
router.get("/total/count", customerController.getTotal);

// Legacy route - Get total count of leads, customers, or blacklisted customers
router.get("/getotal/sum", customerController.getTotal);

// Get All Leads
router.get("/leads", customerController.getLeads);

// Get all customers
router.get("/", customerController.getAllCustomers);
router.put("/vehicle/:id", authenticateToken, customerController.updateVehicle);
router.delete("/vehicle/:id", authenticateToken, customerController.deleteVehicle);
// router.put("/vehicle/:id", customerController.updateVehicle);

// Update advance payment for a customer by ID
router.put("/advance_payment/:id", customerController.updateAdvancePayment);

// Update advance payment directly
router.put("/advance_payment_update/:id", customerController.updateAdvancePaymentDirect);

// Deduct advance payment
router.put("/deduct_advance_payment/:id", customerController.deductAdvancePayment);

// Get telecaller leads
router.get("/telecallerLeads", customerController.getTelecallerLeads);

// Search customers
router.get("/search", customerController.searchCustomers);

// Search leads
router.get("/leads/search", customerController.searchLeads);

// Search telecaller leads
router.get("/telecallerSearch", customerController.searchTelecallerLeads);

// Get a customer by ID
router.get("/:id", customerController.getCustomerById);

// Update a customer by ID
router.put(
  "/:id",
  authenticateToken,
  [
    body("customer_name")
      .optional()
      .notEmpty()
      .withMessage("Customer name is required"),
    body("contact.phone")
      .optional()
      .isMobilePhone()
      .withMessage("Valid phone number is required"),
    body("contact.address.street")
      .optional()
      .notEmpty()
      .withMessage("Street is required"),
    body("contact.address.city")
      .optional()
      .notEmpty()
      .withMessage("City is required"),
    body("contact.address.state")
      .optional()
      .notEmpty()
      .withMessage("State is required"),
  ],
  customerController.updateCustomer
);

// update customer name by ID
router.put(
  "/name/:id",
  authenticateToken,
  customerController.updateCustomerName
);


router.get("/getOwnerName/:id", customerController.getLeadsOwnerName);

router.put("/telecallUpdate/:id", authenticateToken, customerController.updateTelecallerLeads);

router.get("/:customer_id/vehicles", customerController.getCustomerVehicles);

router.get("/comments/:customer_id", customerController.getCustomerComments);

router.get("/leadsowner/search", customerController.searchLeadsByOwner);
router.put("/vehicles/:customer_id", authenticateToken, customerController.addCustomerVehicle);




export default router;
