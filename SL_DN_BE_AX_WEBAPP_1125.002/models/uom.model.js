import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createUom(uomData) {
  return knex("uom").insert(uomData);
}

export async function getAllUoms() {
  return knex("uom").select("*");
}

export async function getUomById(uomId) {
  return knex("uom").where({ id: uomId }).first();
}

export async function getLastUomId() {
  return knex("uom").max("id as maxId").first();
}

export async function updateUom(uomId, updateData) {
  return knex("uom").where({ id: uomId }).update(updateData);
}

export async function deleteUom(uomId) {
  return knex("uom").where({ id: uomId }).del();
}
