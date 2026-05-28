import knexLib from "knex";
import knexConfig from "./knexfile.js";

const knex = knexLib(knexConfig);

async function inspect() {
  try {
    const tables = await knex.raw('SHOW TABLES');
    const tableKeys = tables[0].map(t => Object.values(t)[0]);
    console.log("Tables:", tableKeys);

    for (const table of tableKeys) {
        const columns = await knex.raw(`SHOW COLUMNS FROM ??`, [table]);
        console.log(`\nTable ${table}:`, columns[0].map(c => `${c.Field} (${c.Type})`).join(', '));
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

inspect();
