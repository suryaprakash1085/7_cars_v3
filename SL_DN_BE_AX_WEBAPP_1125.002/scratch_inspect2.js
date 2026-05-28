import knexLib from "knex";
import knexConfig from "./knexfile.js";

const knex = knexLib(knexConfig);

async function inspect() {
  try {
    const tables = await knex.raw('SHOW TABLES');
    const tableKeys = tables[0].map(t => Object.values(t)[0]);
    
    for (const table of tableKeys) {
        const columns = await knex.raw(`SHOW COLUMNS FROM ??`, [table]);
        const cols = columns[0].map(c => `${c.Field} (${c.Type})`);
        console.log(`Table ${table}: ${cols.join(', ')}`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

inspect();
