import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

export async function createImage(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  const { type } = req.params;
  const { category, subcategory, description } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "Image file is required" });
  }

  try {
    const uniqueName = req.file.filename;

    const [id] = await knex("images").insert({
      name: uniqueName,
      category: category,
      subcategory: subcategory,
      description: description,
      type: type,
    });

    await logChange(token, "Image", "INSERT", id, { name: uniqueName, category, subcategory, description });

    res.status(201).json({ id, name: uniqueName });
  } catch (error) {
    console.error("Error creating image:", error.message);
    res.status(500).json({ error: "Error creating image", details: error.message });
  }
}

export async function createImageByCategory(req, res) {
  const { category, type } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: "Image file is required" });
  }

  try {
    const { description } = req.body;
    const uniqueName = req.file.filename;

    const [id] = await knex("images").insert({
      name: uniqueName,
      category,
      description,
      type,
    });

    res.status(201).json({ id, name: uniqueName });
  } catch (error) {
    console.error("Error creating image by category:", error.message);
    res.status(500).json({ error: "Error creating image by category", details: error.message });
  }
}

export async function getImagesByType(req, res) {
  try {
    const images = await knex("images").where({ type: req.params.type }).select("*");
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ error: "Error fetching images", details: error.message });
  }
}

export async function getImageById(req, res) {
  try {
    const image = await knex("images").where({ id: req.params.id }).first();
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    res.status(200).json(image);
  } catch (error) {
    res.status(500).json({ error: "Error fetching image", details: error.message });
  }
}

export async function getImagesByCategory(req, res) {
  const { category } = req.params;
  try {
    const images = await knex("images").where({ category }).select("*");
    if (!images) {
      return res.status(404).json({ error: "Images not found" });
    }
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ error: "Error fetching images", details: error.message });
  }
}

export async function updateImage(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const newData = req.body;
  if (req.file) {
    newData.name = req.file.filename;
  }

  try {
    const { id } = req.params;
    const currentData = await knex("images").where({ id }).first();
    if (!currentData) {
      return res.status(404).json({ error: "Image not found" });
    }

    const changes = {};
    for (const key in newData) {
      if (currentData[key] !== newData[key]) {
        changes[key] = {
          old: currentData[key],
          new: newData[key],
        };
      }
    }

    if (Object.keys(changes).length > 0) {
      await logChange(token, "Image", "UPDATE", id, changes);
    }

    const updatedRows = await knex("images").where({ id }).update(newData);

    if (updatedRows) {
      res.status(200).json({ message: "Image updated successfully", changes });
    } else {
      res.status(404).json({ message: "Image not updated" });
    }
  } catch (error) {
    console.error("Error updating image:", error.message);
    res.status(500).json({ error: "Error updating image", details: error.message });
  }
}

export async function deleteImage(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { id } = req.params;

    const imageDetails = await knex("images").where({ id }).first();

    if (!imageDetails) {
      return res.status(404).json({ error: "Image not found" });
    }

    const deletedRows = await knex("images").where({ id }).del();

    if (deletedRows === 0) {
      return res.status(404).json({ error: "Image could not be deleted" });
    }

    const changes = {
      deleted_image: imageDetails,
    };
    await logChange(token, "Image", "DELETE", id, changes);

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Error deleting image", details: error.message });
  }
}
