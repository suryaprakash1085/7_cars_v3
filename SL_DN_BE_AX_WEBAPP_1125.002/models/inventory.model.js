import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function getInventoryItems(limit, offset) {
  return knex("inventory")
    .select(
      "inventory.inventory_id",
      "inventory.part_name",
      "inventory.part_number",
      "inventory.description",
      "inventory.category",
      "inventory.quantity",
      "inventory.price",
      "inventory.buying_price",
      "inventory.uom",
      knex.raw("GROUP_CONCAT(DISTINCT orders.id) as order_ids"),
      knex.raw("GROUP_CONCAT(DISTINCT orders.date) as order_dates"),
      knex.raw(
        "GROUP_CONCAT(DISTINCT orders.supplier_id) as order_supplier_ids"
      ),
      knex.raw("GROUP_CONCAT(DISTINCT orders.quantity) as order_quantities"),
      knex.raw(
        "GROUP_CONCAT(DISTINCT inventory_suppliers.supplier_id) as supplier_ids"
      )
    )
    .leftJoin("orders", "inventory.inventory_id", "orders.inventory_id")
    .leftJoin(
      "inventory_suppliers",
      "inventory.inventory_id",
      "inventory_suppliers.inventory_id"
    )
    .whereNot("inventory.is_deleted", 1)
    .groupBy("inventory.inventory_id")
    .limit(parseInt(limit))
    .offset(parseInt(offset));
}

export async function searchInventory(search, filter) {
  let query = knex("inventory").select("*");

  if (search) {
    query = query.andWhere(function () {
      this.where("part_name", "like", `%${search}%`).orWhere(
        "part_number",
        "like",
        `%${search}%`
      );
    });
  }

  if (filter) {
    query = query.andWhere("category", filter);
  }

  query = query.whereNot("is_deleted", 1);

  return query;
}

export async function getInventoryById(inventoryId) {
  return knex("inventory")
    .where({ inventory_id: inventoryId })
    .first();
}

export async function createInventory(inventoryData) {
  return knex("inventory").insert(inventoryData);
}

export async function updateInventory(inventoryId, updateData) {
  return knex("inventory")
    .where({ inventory_id: inventoryId })
    .update(updateData);
}

export async function updateInventoryQuantity(inventoryId, newQuantity) {
  return knex("inventory")
    .where({ inventory_id: inventoryId })
    .update({ quantity: newQuantity });
}

export async function softDeleteInventory(inventoryId) {
  return knex("inventory")
    .where({ inventory_id: inventoryId })
    .update({ is_deleted: true });
}

export async function createTransaction(transactionData) {
  return knex("transactions").insert(transactionData);
}

export async function getInventorySupplers(inventoryId) {
  return knex("inventory_suppliers")
    .where({ inventory_id: inventoryId })
    .select("supplier_id");
}

export async function createInventorySupplier(data) {
  return knex("inventory_suppliers").insert(data);
}

export async function getInventoryForExport(limit, offset) {
  return knex("inventory")
    .select("*")
    .whereNot("is_deleted", 1)
    .limit(parseInt(limit))
    .offset(parseInt(offset));
}
