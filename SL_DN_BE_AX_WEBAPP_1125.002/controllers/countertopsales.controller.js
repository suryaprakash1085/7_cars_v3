import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

export async function getAllCountertopSales(req, res) {
  try {
    const prefix = await knex("number_range").where("id_type", "countersales");
    const finalPrefix = prefix[0].prefix;

    const appointments = await knex("appointments")
      .select("*")
      .where("appointment_id", "like", `%${finalPrefix}%`)
      .where("status", "not like", "%deleted%")
      .orderBy("appointment_id");

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Error fetching countertop sales", details: error.message });
  }
}

export async function getCountertopSaleById(req, res) {
  try {
    const { id } = req.params;
    const sale = await knex("appointments").where("appointment_id", id).first();

    if (!sale) {
      return res.status(404).json({ error: "Countertop sale not found" });
    }

    res.status(200).json(sale);
  } catch (error) {
    res.status(500).json({ error: "Error fetching countertop sale", details: error.message });
  }
}
