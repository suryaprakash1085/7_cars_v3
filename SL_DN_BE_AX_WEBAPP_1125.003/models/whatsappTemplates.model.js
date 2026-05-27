import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function getAllTemplates() {
  return knex("whatsapp_template").select("*");
}

export async function getTemplateById(templateId) {
  return knex("whatsapp_template").where({ id: templateId }).first();
}

export async function getTemplateByName(templateName) {
  return knex("whatsapp_template").where({ name: templateName }).first();
}

export async function createTemplate(templateData) {
  return knex("whatsapp_template").insert(templateData);
}

export async function updateTemplate(templateId, updateData) {
  return knex("whatsapp_template").where({ id: templateId }).update(updateData);
}

export async function deleteTemplate(templateId) {
  return knex("whatsapp_template").where({ id: templateId }).del();
}

export async function batchUpdateInitiator(initiatorData) {
  const updatePromises = Object.keys(initiatorData).map((templateId) =>
    knex("whatsapp_template")
      .where({ id: templateId })
      .update({ initiator: initiatorData[templateId] })
  );
  return Promise.all(updatePromises);
}
