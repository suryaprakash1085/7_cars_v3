import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function getAllTemplates(req, res) {
  try {
    const templates = await knex("whatsapp_template").select("*");
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ error: "Error fetching templates", details: error.message });
  }
}

export async function getTemplateById(req, res) {
  try {
    const template = await knex("whatsapp_template").where({ id: req.params.id }).first();
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ error: "Error fetching template", details: error.message });
  }
}

export async function getTemplateByName(req, res) {
  try {
    const { name } = req.params;
    const decodedName = decodeURIComponent(name);
    const template = await knex("whatsapp_template").where("intiator", "like", `%${decodedName}%`).first();
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ error: "Error fetching template", details: error.message });
  }
}

export async function createTemplate(req, res) {
  try {
    const [id] = await knex("whatsapp_template").insert(req.body);
    res.status(201).json({ id, ...req.body });
  } catch (error) {
    console.error("Error creating template:", error.message);
    res.status(500).json({ error: "Error creating template", details: error.message });
  }
}

export async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const updatedRows = await knex("whatsapp_template").where({ id }).update(req.body);
    if (updatedRows === 0) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(200).json({ message: "Template updated successfully" });
  } catch (error) {
    console.error("Error updating template:", error.message);
    res.status(500).json({ error: "Error updating template", details: error.message });
  }
}

export async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;
    const deletedRows = await knex("whatsapp_template").where({ id }).del();
    if (deletedRows === 0) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(200).json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Error deleting template", details: error.message });
  }
}

export async function updateInitiators(req, res) {
  try {
    const updateArray = req.body;
    for (const obj of updateArray) {
      await knex("whatsapp_template").where({ id: obj.intiator }).update({ intiator: obj.templateId });
    }
    res.status(200).json({ message: "Initiators updated successfully" });
  } catch (error) {
    console.error("Error updating initiators:", error);
    res.status(500).json({ error: "Error updating initiators", details: error.message });
  }
}
