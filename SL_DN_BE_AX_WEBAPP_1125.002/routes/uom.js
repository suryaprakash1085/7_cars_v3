import express from "express";
import { body } from "express-validator";
import * as uomController from "../controllers/uom.controller.js";

const router = express.Router();

router.post(
  "/",
  [
    body("unit_name")
      .notEmpty()
      .withMessage("Unit name is required")
      .isLength({ max: 255 })
      .withMessage("Unit name cannot exceed 255 characters"),
    body("unit_shortcode")
      .notEmpty()
      .withMessage("Unit shortcode is required")
      .isLength({ max: 10 })
      .withMessage("Unit shortcode cannot exceed 10 characters"),
  ],
  uomController.createUOM
);

router.get("/", uomController.getAllUOMs);

router.get("/:id", uomController.getUOMById);

router.put(
  "/:id",
  [
    body("unit_name")
      .optional()
      .notEmpty()
      .withMessage("Unit name cannot be empty")
      .isLength({ max: 255 })
      .withMessage("Unit name cannot exceed 255 characters"),
    body("unit_shortcode")
      .optional()
      .notEmpty()
      .withMessage("Unit shortcode cannot be empty")
      .isLength({ max: 10 })
      .withMessage("Unit shortcode cannot exceed 10 characters"),
  ],
  uomController.updateUOM
);

router.delete("/:id", uomController.deleteUOM);

export default router;
