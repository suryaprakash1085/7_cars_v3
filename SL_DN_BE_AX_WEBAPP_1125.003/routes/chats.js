import express from "express";
import * as chatsController from "../controllers/chats.controller.js";

const router = express.Router();

router.post("/", chatsController.createChat);
router.get("/", chatsController.getAllChats);

export default router;
