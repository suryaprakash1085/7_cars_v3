import express from "express";
import * as expenseController from "../controllers/expense.controller.js";

const router = express.Router();

router.post("/postExpense", expenseController.createExpense);
router.get("/getAllExpenses", expenseController.getAllExpenses);
router.get("/:id", expenseController.getExpenseById);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

export default router;
