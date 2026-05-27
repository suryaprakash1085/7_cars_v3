import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createGst(gstData) {
  return knex("gst").insert(gstData);
}

export async function getAllGsts() {
  return knex("gst").select("*");
}

export async function getGstById(gstId) {
  return knex("gst").where({ id: gstId }).first();
}

export async function getLastGstId() {
  return knex("gst").max("id as maxId").first();
}

export async function updateGst(gstId, updateData) {
  return knex("gst").where({ id: gstId }).update(updateData);
}

export async function deleteGst(gstId) {
  return knex("gst").where({ id: gstId }).del();
}
