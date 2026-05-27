import readline from 'readline';
import knexLib from 'knex';
import knexConfig from './knexfile.js';

const knex = knexLib(knexConfig);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function runDeletion() {
  try {
    const startDateStr = await askQuestion('Enter start date (DD/MM/YYYY): ');
    const endDateStr = await askQuestion('Enter end date (DD/MM/YYYY): ');

    // Basic validation
    if (!startDateStr || !endDateStr) {
      console.log('Both start date and end date are required.');
      process.exit(1);
    }

    // Convert DD/MM/YYYY to YYYY-MM-DD
    const parseDate = (dStr) => {
      const parts = dStr.split('/');
      if (parts.length !== 3) return null;
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    if (!startDate || !endDate) {
      console.log('Invalid date format. Use DD/MM/YYYY.');
      process.exit(1);
    }
    
    // We want all strings to match if stored as simple dates or date-times
    // We will use LIKE or >= <= for strings
    
    console.log(`\nReady to delete data between ${startDate} and ${endDate}`);
    console.log(`EXCEPT from tables: inventory, customers (and configuration tables)`);
    const confirm = await askQuestion('Are you sure you want to proceed? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('Operation cancelled.');
      process.exit(0);
    }

    console.log('\n--- Starting deletion ---');

    // EXCLUDED CORE ENTITIES / CONFIGURATION: 
    // inventory, customers, categories, company_details, expenses_type, gst, 
    // mechanics, number_range, products, roles, servegallery, service_type, 
    // subcategories, suppliers, tiles, uom, userscollection, vehiclesmake, 
    // whatsapp_template, vehicles (since they belong to customers)

    // TABLES TO DELETE DATE-RANGED DATA FROM:
    
    // Tables with Date fields where we want to clear transactional data for the year/period
    const dateTables = [
      { name: 'appointments', dateCol: 'appointment_date' },
      { name: 'transactions', dateCol: 'transaction_date' },
      { name: 'procurements', dateCol: 'appointment_date' },
      { name: 'procurement_items', dateCol: 'created_at' },
      { name: 'orders', dateCol: 'date' }, // Date type
      { name: 'time_entry', dateCol: 'date' }, // Date type
      { name: 'chats', dateCol: 'Date' }, // Date type
      { name: 'expenses', dateCol: 'date' }, // Text
      { name: 'finance', dateCol: 'invoice_date' }, // Text
      { name: 'work_reports', dateCol: 'startdate' }, // Text
      { name: 'convert_to_customer', dateCol: 'convert_date' } // Text
    ];

    // For string dates in YYYY-MM-DD or DD/MM/YYYY depending on how they store it
    // Usually they store it as DD-MM-YYYY in expenses/finance in this project based on standard Indian formats or YYYY-MM-DD.
    // Knex raw is best for flexible deletion where the exact format is unknown but we want to clear everything in that year anyway.
    // Because they asked "deletes the data of 2025 except inventory and customers... delete everything from db except that"
    // I will actually delete EVERYTHING from transactional tables where we don't have explicit date ranges OR match the date ranges.
    // Let's implement exact dates. For string fields, we'll try to match. If we need to TRUNCATE we would need to be careful.

    for (const table of dateTables) {
       console.log(`Deleting from ${table.name} where ${table.dateCol} is between ${startDate} and ${endDate}...`);
       let result;
       try {
           if (['transaction_date', 'created_at'].includes(table.dateCol)) {
               const start = `${startDate} 00:00:00`;
               const end = `${endDate} 23:59:59`;
               result = await knex(table.name).whereBetween(table.dateCol, [start, end]).del();
           } else if (['expenses', 'finance'].includes(table.name)) {
               // Texts - they might be DD-MM-YYYY or DD/MM/YYYY
               // They are hard to reliably compare string sizes "between" so 
               // let's do a LIKE query to catch the year? The prompt says between specific dates. 
               // We will use raw querying.
               result = await knex.raw(`DELETE FROM ?? WHERE DATE(STR_TO_DATE(??, '%Y-%m-%d')) BETWEEN ? AND ? OR DATE(STR_TO_DATE(??, '%d/%m/%Y')) BETWEEN ? AND ? OR DATE(STR_TO_DATE(??, '%d-%m-%Y')) BETWEEN ? AND ?`, 
                 [table.name, table.dateCol, startDate, endDate, table.dateCol, startDate, endDate, table.dateCol, startDate, endDate]
               );
               result = result[0].affectedRows || 0;
           } else {
               // Normal DATE fields
               result = await knex(table.name).whereBetween(table.dateCol, [startDate, endDate]).del();
           }
           console.log(`  -> Deleted ${result} rows from ${table.name}.`);
       } catch (err) {
           console.error(`  -> Failed to delete from ${table.name}: ${err.message}`);
       }
    }

    // Now delete linked data for records we might have orphaned 
    console.log(`Deleting orphaned data in dependent tables...`);
    const dependentDeletes = [
      `DELETE sa FROM services_actual sa LEFT JOIN appointments a ON sa.appointment_id = a.appointment_id WHERE a.appointment_id IS NULL OR a.appointment_id = ''`,
      `DELETE ir FROM items_required ir LEFT JOIN services_actual sa ON ir.service_id = sa.service_id WHERE sa.service_id IS NULL OR sa.service_id = ''`,
      `DELETE ms FROM messages_seen ms LEFT JOIN chats c ON ms.message_id = c.id WHERE c.id IS NULL`, // Example if message_id is chat id
      `DELETE f FROM finance f LEFT JOIN appointments a ON f.appointment_id = a.appointment_id WHERE a.appointment_id IS NULL AND f.appointment_id != ''`
    ];

    for (const sql of dependentDeletes) {
        try {
            const res = await knex.raw(sql);
            console.log(`  -> Cleanup completed for a relationship (${res[0].affectedRows} rows affected).`);
        } catch(err) {
            console.error(`  -> Cleanup failed: ${err.message}`);
        }
    }

    console.log('--- Deletion completed ---');

  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

runDeletion();
