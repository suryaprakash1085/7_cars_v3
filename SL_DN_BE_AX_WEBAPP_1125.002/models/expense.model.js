import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createExpense(expenseData) {
  return knex("expenses").insert(expenseData);
}

export async function getAllExpenses() {
  return knex("expenses").select("*");
}

export async function getExpenseById(expenseId) {
  return knex("expenses").where({ id: expenseId }).first();
}

export async function updateExpense(expenseId, updateData) {
  return knex("expenses").where({ id: expenseId }).update(updateData);
}

export async function deleteExpense(expenseId) {
  return knex("expenses").where({ id: expenseId }).del();
}
