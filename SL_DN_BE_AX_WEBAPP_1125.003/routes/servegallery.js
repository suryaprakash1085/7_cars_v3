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
    cb(null, path.join(__dirname, "../gallery/servegallery")); // Specify the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
  }
});
const upload = multer({ storage: storage });

// Endpoint to create a new subcategory
router.post("/", authenticateToken, upload.array("images"), async (req, res) => {
  try {
    const { name } = req.body;
    const{sub_id}=req.body;

    // Validate request body
    if (!name || !req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Name and images are required." });
    }

    // Create an array to hold the insert promises
    const insertPromises = [];

    // Loop through the images and create a subcategory for each
    req.files.forEach((file, index) => {
      const name = req.body.name; // Get the name for the current image using the index
      const categoryName = req.body.categoryName; // Get the category name from the request body
      console.log(req.body);
      
      const servegalleryData = {
        subcategory_id: sub_id,
        image: JSON.stringify([file.filename]), // Store each image as a separate entry
        name: name, // Use the unique name for each image
        category_id: categoryName
      };

      // Push the insert promise to the array
      insertPromises.push(knex("servegallery").insert(servegalleryData));
    });

    // Wait for all insertions to complete
    await Promise.all(insertPromises);

    res.status(201).json({ message: "Servegallery created successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: "Failed to create servegallery", details: error.message });
  }
});

// serve a category image by filename
router.get("/image/:id", (req, res) => {
  const { id } = req.params;
  const filePath = path.join(__dirname, "../gallery/servegallery", id); // Construct the file path
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error serving category image:", err);
      res.status(err.status).end();
    }
  });
});
// get all items from servegallery by subcategory id
router.get("/:subcategoryId", async (req, res) => {
  const { subcategoryId } = req.params;
  const items = await knex("servegallery").where("subcategory_id", subcategoryId);
  res.json(items);
});

router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Retrieve servegallery item data
    const serveItem = await knex("servegallery").where("id", id).select("image").first();
    if (serveItem && serveItem.image) {
      const images = JSON.parse(serveItem.image); // Parse the JSON string

      // Delete images from the servegallery folder
      for (const image of images) {
        const filePath = path.join(__dirname, "../gallery/servegallery", image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Delete the servegallery item from the database
    await knex("servegallery").where("id", id).del();

    res.json({ message: "Servegallery item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting servegallery item", error: error.message });
  }
});

export default router;