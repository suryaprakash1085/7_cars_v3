import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createMechanic(mechanicData) {
  return knex("mechanics").insert(mechanicData);
}

export async function getAllMechanics() {
  return knex("mechanics").select("*");
}

export async function getMechanicById(mechanicId) {
  return knex("mechanics").where({ mechanic_id: mechanicId }).first();
}

export async function updateMechanic(mechanicId, updateData) {
  return knex("mechanics").where({ mechanic_id: mechanicId }).update(updateData);
}

export async function deleteMechanic(mechanicId) {
  return knex("mechanics").where({ mechanic_id: mechanicId }).del();
}
