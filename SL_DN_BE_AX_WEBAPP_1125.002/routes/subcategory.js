import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import knexLib from "knex"; // Import the Knex library
import knexConfig from "../knexfile.js"; // Import your Knex configuration
import authenticateToken from "../middleware/authenticate.js";
const router = express.Router();
const knex = knexLib(knexConfig); // Initialize Knex with the configuration

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../gallery/subcategory")); // Specify the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
  }
});
const upload = multer({ storage: storage });

// Endpoint to create a new subcategory
router.post("/", authenticateToken, upload.array("images"), async (req, res) => {
  console.log(req.body);
  try {
    const { categoryName } = req.body;

    // Validate request body
    if (!categoryName || !req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Category name and images are required." });
    }

    // Create an array to hold the insert promises
    const insertPromises = [];

    // Loop through the images and create a subcategory for each
    req.files.forEach((file, index) => {
      const name = req.body.name; // Get the name for the current image using the index
      console.log("name", name);
      const subcategoryData = {
        category_id: categoryName,
        images: JSON.stringify([file.filename]), // Store each image as a separate entry
        name: name // Use the unique name for each image
      };

      // Push the insert promise to the array
      insertPromises.push(knex("subcategories").insert(subcategoryData));
    });

    // Wait for all insertions to complete
    await Promise.all(insertPromises);

    res.status(201).json({ message: "Subcategories created successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "Failed to create subcategory", details: error.message });
  }
});

// get all subcategories by category id
router.get("/:categoryId", async (req, res) => {
  const { categoryId } = req.params;
  const subcategories = await knex("subcategories").where("category_id", categoryId);
  res.json(subcategories);
});

// serve a single image by id
// serve a category image by filename
router.get("/image/:id", (req, res) => {
  const { id } = req.params;
  const filePath = path.join(__dirname, "../gallery/subcategory", id); // Construct the file path
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error serving category image:", err);
      res.status(err.status).end();
    }
  });
});

router.delete("/delete/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Retrieve subcategory data
    const subcategory = await knex("subcategories").where("id", id).select("images").first();
    if (subcategory && subcategory.images) {
      const images = JSON.parse(subcategory.images); // Parse the JSON string

      // Delete images from the subcategory folder
      for (const image of images) {
        const filePath = path.join(__dirname, "../gallery/subcategory", image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Retrieve servegallery items related to the subcategory
    const servegallery = await knex("servegallery").where("subcategory_id", id).select("image");
    
    // Delete images from servegallery if found
    for (const serve of servegallery) {
      const images = JSON.parse(serve.image); // Parse the JSON string
      for (const image of images) {
        const filePath = path.join(__dirname, "../gallery/servegallery", image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Delete related database entries
    await knex("servegallery").where("subcategory_id", id).del();
    await knex("subcategories").where("id", id).del();

    res.json({ message: "Subcategory and related servegallery items deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error deleting subcategory", error: error.message });
  }
});
export default router;