import express from "express";
import * as tilesController from "../controllers/tiles.controller.js";

const router = express.Router();

router.get("/", tilesController.getAllTiles);
router.post("/", tilesController.createTile);
router.put("/:id", tilesController.updateTile);

export default router;
