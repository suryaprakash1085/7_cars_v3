import knexLib from "knex";
import knexConfig from "../knexfile.js";
import jwt from "jsonwebtoken";

const knex = knexLib(knexConfig);

const logChange = async (token, tableName, operation, recordId, changes) => {
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const userId = decoded.user_id;

  await knex("change_logs").insert({
    table_id: tableName,
    operation,
    record_id: recordId,
    changes: typeof changes == "object" ? JSON.stringify(changes) : changes,
    user_id: userId,
  });
};

export default logChange;
