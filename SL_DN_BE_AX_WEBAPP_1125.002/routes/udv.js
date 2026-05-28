import express from "express";
import multer from "multer";
import * as udvController from "../controllers/udv.controller.js";
import authenticateToken from "../middleware/authenticate.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/udv/upload - Upload and process file (no auth required)
router.post(
  "/upload",
  upload.single("file"),
  udvController.uploadUDVFile
);

// GET /api/udv - Get uploaded items with pagination
router.get(
  "/",
  udvController.getUDVItems
);

// GET /api/udv/stats - Get statistics for uploads
router.get(
  "/stats",
  udvController.getUDVStats
);

// GET /api/udv/history - Get upload history with aggregated stats
router.get(
  "/history",
  udvController.getUDVUploadHistory
);

// DELETE /api/udv/history - Clear all upload history
router.delete(
  "/history",
  udvController.clearUDVHistory
);

export default router;
