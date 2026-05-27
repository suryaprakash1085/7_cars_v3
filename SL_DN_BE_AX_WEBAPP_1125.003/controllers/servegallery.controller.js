import knexLib from "knex";
import knexConfig from "../knexfile.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const knex = knexLib(knexConfig);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createServeGallery(req, res) {
  try {
    const { name, sub_id, categoryName } = req.body;

    if (!name || !sub_id || !categoryName || !req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Name, subcategory ID, category name, and images are required." });
    }

    const insertPromises = [];

    req.files.forEach((file) => {
      const galleryData = {
        subcategory_id: sub_id,
        category_id: categoryName,
        image: JSON.stringify([file.filename]),
        name: name
      };

      insertPromises.push(knex("servegallery").insert(galleryData));
    });

    await Promise.all(insertPromises);

    res.status(201).json({ message: "Serve gallery created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create serve gallery", details: error.message });
  }
}

export async function getServeGalleryImage(req, res) {
  const { id } = req.params;
  const filePath = path.join(__dirname, "../gallery/servegallery", id);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error serving gallery image:", err);
      res.status(err.status).end();
    }
  });
}

export async function getServeGalleryBySubcategory(req, res) {
  const { subcategoryId } = req.params;
  try {
    const gallery = await knex("servegallery").where("subcategory_id", subcategoryId);
    res.json(gallery);
  } catch (error) {
    res.status(500).json({ error: "Error fetching serve gallery", details: error.message });
  }
}

export async function deleteServeGallery(req, res) {
  const { id } = req.params;

  try {
    const gallery = await knex("servegallery").where("id", id).select("image").first();
    if (gallery && gallery.image) {
      const images = JSON.parse(gallery.image);

      for (const image of images) {
        const filePath = path.join(__dirname, "../gallery/servegallery", image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await knex("servegallery").where("id", id).del();

    res.json({ message: "Serve gallery deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting serve gallery", error: error.message });
  }
}
