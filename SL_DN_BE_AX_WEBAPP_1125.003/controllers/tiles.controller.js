import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

export async function getAllTiles(req, res) {
  try {
    const tiles = await knex("tiles").select("*");
    res.status(200).json(tiles);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching tiles",
      details: error.message,
    });
  }
}

export async function createTile(req, res) {
  const tileDetails = req.body;
  console.log({ tileDetails });

  try {
    const newTile = await knex("tiles").insert(tileDetails).returning("*");
    res.status(201).json(newTile);
  } catch (error) {
    res.status(500).json({
      error: "Error creating tile",
      details: error.message,
    });
  }
}

export async function updateTile(req, res) {
  const { id } = req.params;
  const tileDetails = req.body;

  try {
    const existingTile = await knex("tiles")
      .where("tile_name", tileDetails.tile_name)
      .whereNot("tile_id", id)
      .first();

    if (existingTile) {
      return res.status(400).json({ error: "Tile name already exists" });
    }

    const updatedTile = await knex("tiles")
      .where("tile_id", id)
      .update(tileDetails)
      .returning("*");

    if (!updatedTile) {
      return res.status(404).json({ error: "Tile not found" });
    }

    res.status(200).json(updatedTile);
  } catch (error) {
    res.status(500).json({
      error: "Error updating tile",
      details: error.message,
    });
  }
}
