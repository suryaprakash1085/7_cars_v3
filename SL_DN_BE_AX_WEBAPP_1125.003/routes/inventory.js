import express from "express";
import * as inventoryController from "../controllers/inventory.controller.js";

const router = express.Router();

router.get("/", inventoryController.getAllInventory);
router.get("/excelDownload", inventoryController.getInventoryExcelDownload);
router.get("/searchInventory", inventoryController.searchInventory);
router.post("/", inventoryController.createInventory);
router.post("/bulkUpload", inventoryController.bulkUploadInventory);
router.post("/reconcile/balance", inventoryController.reconcileInventoryBalance);
router.get("/:id", inventoryController.getInventoryById);
router.put("/:id", inventoryController.updateInventory);
router.put("/updateQuantity/:id", inventoryController.updateInventoryQuantity);
router.put("/decreaseQuantity/:id", inventoryController.decreaseInventoryQuantity);
router.delete("/:id", inventoryController.deleteInventory);

export default router;
