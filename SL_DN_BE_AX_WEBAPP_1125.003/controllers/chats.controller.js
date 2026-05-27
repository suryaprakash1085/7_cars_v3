import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

export async function createChat(req, res) {
  console.log({ hi: "hi" });
  try {
    const lastId = await knex("chats").max("id as maxId").first();
    const id = lastId.maxId ? lastId.maxId + 1 : 1;

    const { userId, name, chat, Date, time, seen_by } = req.body;
    console.log({ body: req.body });

    const newChat = await knex("chats").insert({
      id: id,
      customer_id: userId,
      name: name,
      chat: chat,
      date: Date,
      time: time,
      seen_by: seen_by,
    });

    console.log(newChat);
    res.status(200).send({ newChat });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: "An error occurred while inserting the chat.",
    });
  }
}

export async function getAllChats(req, res) {
  try {
    const chats = await knex("chats").select("*");
    res.status(200).send({ chats });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: "An error occurred while fetching chats.",
      details: error.message,
    });
  }
}
