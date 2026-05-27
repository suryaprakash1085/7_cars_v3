import express from "express";
import * as transactionController from "../controllers/transaction.controller.js";

const router = express.Router();

router.use(express.json());

router.post("/", transactionController.createTransaction);
router.get("/", transactionController.getAllTransactions);
router.get("/:transaction_id", transactionController.getTransactionById);
router.get("/inv/:inventory_id", transactionController.getTransactionByInventoryId);
router.put("/:transaction_id", transactionController.updateTransaction);
router.delete("/:transaction_id", transactionController.deleteTransaction);

export default router;
