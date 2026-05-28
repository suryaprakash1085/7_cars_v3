import express from "express";
import { body } from "express-validator";
import * as gstController from "../controllers/gst.controller.js";
import * as gstBulkController from "../controllers/gstBulk.controller.js";

const router = express.Router();

router.post(
  "/",
  [
    body("gst_name")
      .notEmpty()
      .withMessage("GST name is required")
      .isLength({ max: 100 })
      .withMessage("GST name cannot exceed 100 characters"),
    body("gst_percentage")
      .notEmpty()
      .withMessage("GST percentage is required")
      .isDecimal({ decimal_digits: "1,2" })
      .withMessage("GST percentage must be a valid decimal"),
  ],
  gstController.createGST
);

router.get("/", gstController.getAllGSTs);

router.get("/:id", gstController.getGSTById);

router.put(
  "/:id",
  [
    body("gst_name")
      .optional()
      .notEmpty()
      .withMessage("GST name cannot be empty")
      .isLength({ max: 100 })
      .withMessage("GST name cannot exceed 100 characters"),
    body("gst_percentage")
      .optional()
      .isDecimal({ decimal_digits: "1,2" })
      .withMessage("GST percentage must be a valid decimal"),
  ],
  gstController.updateGST
);

router.delete("/:id", gstController.deleteGST);

// Bulk GST conversion routes
router.get("/bulk/appointments", gstBulkController.getBulkAppointments);
router.post("/bulk/convert", gstBulkController.bulkConvertGST);

export default router;
