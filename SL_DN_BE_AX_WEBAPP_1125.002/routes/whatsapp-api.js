// routes/whatsappApi.js
import express from "express";
import multer from 'multer';
import {
  login,
  logout,
  sendMessage,
  sendFile,
  reset
} from "../utils/whatsapp-api.js";

const router = express.Router();
const upload = multer(); // Initialize multer for file uploads

// /login route
router.post('/login', login);

// /logout route
router.post('/logout', logout);

// resetting auth files 
router.post ('/reset',reset)

// /send route
router.post('/send', sendMessage);

// /send-file route
router.post('/send-file', upload.single('file'), sendFile);

export default router;
