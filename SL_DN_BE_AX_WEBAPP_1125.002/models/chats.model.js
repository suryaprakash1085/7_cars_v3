import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createChat(chatData) {
  return knex("chats").insert(chatData);
}

export async function getAllChats() {
  return knex("chats").select("*");
}

export async function getLastChatId() {
  return knex("chats").max("id as maxId").first();
}
