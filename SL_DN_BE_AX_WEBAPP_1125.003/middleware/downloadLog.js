import knexLib from "knex";
import knexConfig from "../knexfile.js";
import jwt from "jsonwebtoken";

const knex = knexLib(knexConfig);

const logDownload = async (token, referenceId, documentType) => {
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const userId = decoded.user_id;
  const userName = decoded.user_name;

  // Check if an entry exists with the same reference_id and document_type
  const existingEntry = await knex("download_logs")
    .where({ reference_id: referenceId, document_type: documentType })
    .first();

  let insertData = {
    reference_id: referenceId,
    document_type: documentType,
    user_id: userId,
    user_name: userName,
    print: existingEntry ? "Re-Print" : "Initial Print",
  };

  await knex("download_logs").insert(insertData);
};

export default logDownload;
