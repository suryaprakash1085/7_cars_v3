import express from "express";
import authenticateToken from "../middleware/authenticate.js";
import * as supplierController from "../controllers/supplier.controller.js";

const router = express.Router();

router.post("/", supplierController.createSupplier);
router.get("/search", supplierController.searchSupplier);
router.get("/download-template", supplierController.downloadSupplierTemplate);
router.get("/", supplierController.getAllSuppliers);
router.get("/:id", supplierController.getSupplierById);
router.put("/:id", authenticateToken, supplierController.updateSupplier);
router.post("/bulkUpload", supplierController.bulkUploadSuppliers);
router.delete("/:id", authenticateToken, supplierController.deleteSupplier);
router.put("/vehicles/:supplier_id", supplierController.addVehicleToSupplier);

export default router;
