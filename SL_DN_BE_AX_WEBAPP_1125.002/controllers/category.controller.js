import knexLib from "knex";
import knexConfig from "../knexfile.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const knex = knexLib(knexConfig);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getAllCategories(req, res) {
  try {
    const categories = await knex("categories").select("*");
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
}

export async function getCategoryImage(req, res) {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "..", "gallery/category", filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error serving category image:", err);
      res.status(err.status).end();
    }
  });
}

export async function createCategory(req, res) {
  try {
    const { name } = req.body;
    const image = req.file.filename;

    await knex("categories").insert({ name, image });
    res.status(201).json({ message: "Category created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create category" });
  }
}

export async function deleteCategory(req, res) {
  const { id } = req.params;

  try {
    const dbname = await knex("categories").where("id", id).select("image").first();
    if (dbname && dbname.image) {
      const filePath = path.join(__dirname, "..", "gallery/category", dbname.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const subcategories = await knex("subcategories").where("category_id", id).select("images");
    const servegallery = await knex("servegallery").where("category_id", id).select("image");

    for (const subcategory of subcategories) {
      const images = JSON.parse(subcategory.images);
      for (const image of images) {
        const filePath = path.join(__dirname, "..", "gallery/subcategory", image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    for (const serve of servegallery) {
      const images = JSON.parse(serve.image);
      for (const image of images) {
        const filePath = path.join(__dirname, "..", "gallery/servegallery", image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await knex("subcategories").where("category_id", id).del();
    await knex("servegallery").where("category_id", id).del();
    await knex("categories").where("id", id).del();

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error: error.message });
  }
}

export async function searchCategory(req, res) {
  const { name } = req.params;
  try {
    const category = await knex("categories").where("name", "like", `%${name}%`).select("*");
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Error searching category", details: error.message });
  }
}
