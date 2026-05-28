import knexLib from "knex";
import knexConfig from "../knexfile.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const knex = knexLib(knexConfig);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createSubcategory(req, res) {
  console.log(req.body);
  try {
    const { categoryName } = req.body;

    if (!categoryName || !req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Category name and images are required." });
    }

    const insertPromises = [];

    req.files.forEach((file, index) => {
      const name = req.body.name;
      console.log("name", name);
      const subcategoryData = {
        category_id: categoryName,
        images: JSON.stringify([file.filename]),
        name: name
      };

      insertPromises.push(knex("subcategories").insert(subcategoryData));
    });

    await Promise.all(insertPromises);

    res.status(201).json({ message: "Subcategories created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create subcategory", details: error.message });
  }
}

export async function getSubcategoriesByCategory(req, res) {
  const { categoryId } = req.params;
  try {
    const subcategories = await knex("subcategories").where("category_id", categoryId);
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ error: "Error fetching subcategories", details: error.message });
  }
}

export async function getSubcategoryImage(req, res) {
  const { id } = req.params;
  const filePath = path.join(__dirname, "../gallery/subcategory", id);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error serving category image:", err);
      res.status(err.status).end();
    }
  });
}

export async function deleteSubcategory(req, res) {
  const { id } = req.params;

  try {
    const subcategory = await knex("subcategories").where("id", id).select("images").first();
    if (subcategory && subcategory.images) {
      const images = JSON.parse(subcategory.images);

      for (const image of images) {
        const filePath = path.join(__dirname, "../gallery/subcategory", image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    const servegalleryImages = await knex("servegallery").where("subcategory_id", id).select("image");

    for (const serve of servegalleryImages) {
      const images = JSON.parse(serve.image);
      for (const image of images) {
        const filePath = path.join(__dirname, "../gallery/servegallery", image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await knex("servegallery").where("subcategory_id", id).del();
    await knex("subcategories").where("id", id).del();

    res.json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting subcategory", error: error.message });
  }
}
