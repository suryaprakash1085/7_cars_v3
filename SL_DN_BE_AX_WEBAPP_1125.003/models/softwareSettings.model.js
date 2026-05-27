import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createCompanyDetails(detailsData) {
  return knex("company_details").insert(detailsData);
}

export async function getCompanyDetails() {
  return knex("company_details").select("*").first();
}

export async function updateCompanyDetails(updateData) {
  return knex("company_details").update(updateData);
}

export async function createServiceType(serviceData) {
  return knex("service_type").insert(serviceData);
}

export async function getAllServiceTypes() {
  return knex("service_type").select("*");
}

export async function deleteServiceType(serviceId) {
  return knex("service_type").where({ id: serviceId }).del();
}

export async function updateServiceType(serviceId, updateData) {
  return knex("service_type").where({ id: serviceId }).update(updateData);
}

export async function createExpenseType(expenseData) {
  return knex("expenses_type").insert(expenseData);
}

export async function getAllExpenseTypes() {
  return knex("expenses_type").select("*");
}

export async function deleteExpenseType(expenseId) {
  return knex("expenses_type").where({ id: expenseId }).del();
}

export async function updateExpenseType(expenseId, updateData) {
  return knex("expenses_type").where({ id: expenseId }).update(updateData);
}

/**
 * Get all number ranges (optionally filtered by company code)
 * @param {string} companyCode - Optional: filter by company code
 * @returns {Promise<Array>} - Array of number ranges
 */
export async function getAllNumberRanges(companyCode = null) {
  let query = knex("number_range").select("*");

  if (companyCode) {
    query = query.where({ company_code: companyCode });
  }

  return query;
}

/**
 * Get number range by ID type (optionally filtered by company code)
 * @param {string} idType - The ID type (e.g., "Appointment", "Customer")
 * @param {string} companyCode - Optional: specific company code
 * @returns {Promise<Object>} - Number range record
 */
export async function getNumberRange(idType, companyCode = null) {
  let query = knex("number_range").where({ id_type: idType });

  if (companyCode) {
    query = query.andWhere({ company_code: companyCode });
  }

  return query.first();
}

/**
 * Get number range for a specific company and ID type
 * @param {string} companyCode - Company code
 * @param {string} idType - ID type
 * @returns {Promise<Object>} - Number range record
 */
export async function getNumberRangeByCompanyAndType(companyCode, idType) {
  return knex("number_range")
    .where({ company_code: companyCode, id_type: idType })
    .first();
}

/**
 * Update number range by ID type
 * @param {string} idType - ID type
 * @param {Object} updateData - Fields to update
 * @param {string} companyCode - Optional: specific company code
 * @returns {Promise} - Update result
 */
export async function updateNumberRange(idType, updateData, companyCode = null) {
  let query = knex("number_range").where({ id_type: idType });

  if (companyCode) {
    query = query.andWhere({ company_code: companyCode });
  }

  return query.update(updateData);
}

/**
 * Create a new number range
 * @param {Object} rangeData - Range data (includes id_type, range_start, range_end, running_number, prefix, company_code)
 * @returns {Promise} - Insert result
 */
export async function createNumberRange(rangeData) {
  return knex("number_range").insert(rangeData);
}

/**
 * Delete number range by ID
 * @param {number} id - Range ID
 * @returns {Promise} - Delete result
 */
export async function deleteNumberRangeById(id) {
  return knex("number_range").where({ id }).del();
}

export async function getAllTimezones() {
  return knex("timezone_settings").select("*");
}

export async function createTimezone(timezoneData) {
  return knex("timezone_settings").insert(timezoneData);
}

export async function updateTimezone(id, updateData) {
  return knex("timezone_settings").where({ id }).update(updateData);
}

export async function deleteTimezone(id) {
  return knex("timezone_settings").where({ id }).del();
}

export async function getTimezoneById(id) {
  return knex("timezone_settings").where({ id }).first();
}

export async function getTimezoneByCode(code) {
  return knex("timezone_settings").where({ timezone_code: code }).first();
}
