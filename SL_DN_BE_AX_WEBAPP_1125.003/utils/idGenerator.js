import knexLib from "knex";
import knexConfig from "../knexfile.js"; // Import your Knex configuration


const knex = knexLib(knexConfig); // Initialize Knex with the configuration

export async function generateCustomId(entityShortName) {
  try {
    // Start a transaction
    const trx = await knex.transaction();

    // Lock the row for update
    const numberRange = await trx("number_range")
      .where({ prefix: entityShortName })
      .first()
      .forUpdate();

    if (!numberRange) {
      throw new Error(`Number range for ${entityShortName} not found`);
    }

    if (numberRange.running_number >= numberRange.range_end) {
      throw new Error(`Number range for ${entityShortName} has been exhausted`);
    }

    const newId = `${entityShortName}-${numberRange.running_number + 1}`;

    // Increment the running number
    await trx("number_range")
      .where({ prefix: entityShortName })
      .update({ running_number: numberRange.running_number + 1 });

    // Commit the transaction
    await trx.commit();

    return newId;
  } catch (error) {
    console.error("Error generating custom ID:", error);
    throw error;
  }
}

// Wrapper functions for different entities to generate specific IDs
export async function generateCustomerId() {
  const numberRange = await knex("number_range")
    .where({ id_type: "Customer" })
    .first();
  //that prefix set to generateCustomId
  return generateCustomId(numberRange.prefix);
}


// In your generateGstInvoiceId()
export async function generateGstInvoiceId() {
  const numberRange = await knex("number_range")
    .where({ id_type: "GST-Invoice" })
    .first();
  return generateCustomId(numberRange.prefix); // What prefix is stored here?
}

export async function generateVehicleId() {
  const numberRange = await knex("number_range")
    .where({ id_type: "Vehicle" })
    .first();
  return generateCustomId(numberRange.prefix);
}

export async function generateInventoryId() {
  const numberRange = await knex("number_range")
    .where({ id_type: "Inventory" })
    .first();
  return generateCustomId(numberRange.prefix);
}

export async function generateInvoiceId() {
  const numberRange = await knex("number_range")
    .where({ id_type: "Invoice" })
    .first();
  return generateCustomId(numberRange.prefix);
}

export async function generateServiceId() {
  const numberRange = await knex("number_range")
    .where({ id_type: "Services" })
    .first();
  return generateCustomId(numberRange.prefix);
}

export async function generateAppointmentId() {
  const numberRange = await knex("number_range")
    .where({ id_type: "Appointment" })
    .first();
  return generateCustomId(numberRange.prefix);
}

export async function generatePrNo() {
  const numberRange = await knex("number_range")
    .where({ id_type: "Purchase" })
    .first();
  return generateCustomId(numberRange.prefix);
}

export async function generateExpenseId() {
  const numberRange = await knex("number_range")
    .where({ id_type: "Expenses" })
    .first();
  return generateCustomId(numberRange.prefix);
}

export async function generateSupplierId() {
  const numberRange = await knex("number_range")
    .where({ id_type: "Supplier" })
    .first();
  return generateCustomId(numberRange.prefix);
}

export async function generatecountesalesId() {
  const numberRange = await knex("number_range")
    .where({ id_type: "countersales" })
    .first();
  return generateCustomId(numberRange.prefix);
}

export async function generateCounterSalesVehicleId() {
  const numberRange = await knex("number_range")
    .where({ id_type: "countersales-veh" })
    .first();
  if (!numberRange) {
    return generateCustomId("CS");
  }
  return generateCustomId(numberRange.prefix);
}

export async function generateVehicleMakeId(prefix) {
  // If prefix is provided, use it directly
  if (prefix) {
    return generateCustomId(prefix);
  }

  // Fallback to database lookup
  const numberRange = await knex("number_range")
    .where({ id_type: "VehicleMake" })
    .first();
  return generateCustomId(numberRange?.prefix);
}
