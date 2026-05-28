import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import * as companyImagesController from "../controllers/companyImages.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir;
    switch (file.fieldname) {
      case "logo":
        dir = path.join(__dirname, "../company/logo");
        break;
      case "background":
        dir = path.join(__dirname, "../company/background");
        break;
      case "pdf_header":
        dir = path.join(__dirname, "../pdf/header");
        break;
      case "pdf_footer":
        dir = path.join(__dirname, "../pdf/footer");
        break;
      default:
        dir = path.join(__dirname, "../uploads");
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${file.fieldname}-${timestamp}.png`);
  },
});

const upload = multer({ storage });

router.post(
  "/",
  upload.fields([
    { name: "logo" },
    { name: "background" },
    { name: "pdf_header" },
    { name: "pdf_footer" },
  ]),
  companyImagesController.updateCompanyImages
);

router.get("/image/file/:type/:filename", companyImagesController.getCompanyImage);

export default router;
