import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import * as categoryController from "../controllers/category.controller.js";
import authenticateToken from "../middleware/authenticate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../gallery/category"));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.get("/", categoryController.getAllCategories);
router.get("/image/file/:filename", categoryController.getCategoryImage);
router.post("/", authenticateToken, upload.single("image"), categoryController.createCategory);
router.delete("/:id", authenticateToken, categoryController.deleteCategory);
router.get("/search/:name", authenticateToken, categoryController.searchCategory);

export default router;
