import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createTransaction(transactionData) {
  return knex("transactions").insert(transactionData);
}

export async function getAllTransactions() {
  return knex("transactions").select("*");
}

export async function getTransactionById(transactionId) {
  return knex("transactions").where({ transaction_id: transactionId }).first();
}

export async function getTransactionByInventory(inventoryId) {
  return knex("transactions").where({ inventory_id: inventoryId });
}

export async function getTransactionByService(serviceId) {
  return knex("transactions").where({ service_id: serviceId });
}

export async function updateTransaction(transactionId, updateData) {
  return knex("transactions").where({ transaction_id: transactionId }).update(updateData);
}

export async function deleteTransaction(transactionId) {
  return knex("transactions").where({ transaction_id: transactionId }).del();
}

export async function deleteTransactionByService(serviceId) {
  return knex("transactions").where({ service_id: serviceId }).del();
}
