import express from "express";
const router = express.Router();
import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);
// ! get all templates
router.get("/", async (req, res) => {
  const templates = await knex("whatsapp_template").select("*");
  res.json(templates);
});
// ! get a template by id
router.get("/:id", async (req, res) => {
  const template = await knex("whatsapp_template")
    .where("id", req.params.id)
    .first();
  res.json(template);
});
//! get a template by name
router.get("/name/:name", async (req, res) => {
  const name = decodeURIComponent(req.params.name); // decode the URL-encoded name
  // console.log(name);
  const template = await knex("whatsapp_template")
    .where("intiator", "like", `%${name}%`)
    .first();
  res.json(template);
  // console.log(template);
});
// ! create a template
router.post("/", async (req, res) => {
  const template = await knex("whatsapp_template").insert(req.body);
  res.json(template);
});
// ! update a template
router.put("/update/:id", async (req, res) => {
  const template = await knex("whatsapp_template")
    .where("id", req.params.id)
    .update(req.body);
  res.json(template);
});
// ! delete a template
router.delete("/:id", async (req, res) => {
  const deleted = await knex("whatsapp_template")
    .where("id", req.params.id)
    .del();
  res.json(deleted);
});
// !update intiator value by id
router.put("/intiator/", async (req, res) => {
  // we need to update the intiator value for each object in the array
  for (const obj of req.body) {
    await knex("whatsapp_template")
      .where("id", obj.intiator)
      .update({ intiator: obj.templateId });
  }
  res.json({ message: "Initiator values updated successfully" });
});
export default router;
