import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createProcurement(procurementData) {
  return knex("procurements").insert(procurementData);
}

export async function createProcurementItems(items) {
  return knex("procurement_items").insert(items);
}

export async function getProcurements(prType) {
  let query = knex("procurements").select("*");
  if (prType && prType !== "all") {
    query = query.where({ pr_type: prType });
  }
  return query;
}

export async function getProcurementByNumber(prNo) {
  return knex("procurements")
    .where({ pr_no: prNo })
    .first();
}

export async function getProcurementItems(prNo) {
  return knex("procurement_items")
    .where({ pr_no: prNo });
}

export async function updateProcurement(prNo, updateData) {
  return knex("procurements")
    .where({ pr_no: prNo })
    .update(updateData);
}

export async function updateProcurementStatus(prNo, status) {
  return knex("procurements")
    .where({ pr_no: prNo })
    .update({ status });
}

export async function deleteProcurement(prNo) {
  return knex("procurements")
    .where({ pr_no: prNo })
    .del();
}

export async function deleteProcurementItem(prNo, itemId) {
  return knex("procurement_items")
    .where({ pr_no: prNo, id: itemId })
    .del();
}

export async function getProcurementBySupplier(supplierId) {
  return knex("procurement_items")
    .where({ supplier_id: supplierId })
    .select("*");
}

export async function updateProcurementItem(itemId, updateData) {
  return knex("procurement_items")
    .where({ id: itemId })
    .update(updateData);
}

export async function getItemsRequired(appointmentId) {
  return knex("items_required")
    .where({ appointment_id: appointmentId });
}

export async function updateInventory(inventoryId, quantity) {
  return knex("inventory")
    .where({ inventory_id: inventoryId })
    .increment("quantity", quantity);
}

export async function createTransaction(transactionData) {
  return knex("transactions").insert(transactionData);
}

export async function getProcurementItemDetails(prNo, itemId) {
  return knex("procurement_items")
    .where({ pr_no: prNo, id: itemId })
    .first();
}
