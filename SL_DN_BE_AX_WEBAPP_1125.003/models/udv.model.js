import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createUDVItem(itemData) {
  return knex("udv_items").insert(itemData);
}

export async function checkDuplicateHash(uniqueKeyHash) {
  return knex("udv_items")
    .where({ unique_key_hash: uniqueKeyHash })
    .first();
}

export async function getUDVItems(entity = null, status = null, limit = 50, offset = 0) {
  let query = knex("udv_items");
  
  if (entity) {
    query = query.where("entity", entity);
  }
  
  if (status) {
    query = query.where("status", status);
  }
  
  return query
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);
}

export async function getUDVStats(entity = null) {
  let query = knex("udv_items");
  
  if (entity) {
    query = query.where("entity", entity);
  }
  
  return query
    .select("status")
    .count("* as count")
    .groupBy("status");
}

export async function getUDVItemsByStatus(entity, status) {
  return knex("udv_items")
    .where({ entity, status })
    .orderBy("created_at", "desc");
}

export async function deleteUDVItem(id) {
  return knex("udv_items")
    .where({ id })
    .del();
}

export async function deleteUDVItemsByEntity(entity) {
  return knex("udv_items")
    .where({ entity })
    .del();
}
