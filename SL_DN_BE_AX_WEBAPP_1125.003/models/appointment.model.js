import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createAppointment(appointmentData) {
  return knex("appointments").insert(appointmentData);
}

export async function getAppointments(limit, offset) {
  return knex("appointments")
    .leftJoin("customers", "appointments.customer_id", "customers.customer_id")
    .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
    .select("appointments.*", "customers.customer_name", "vehicles.make", "vehicles.model")
    .limit(parseInt(limit))
    .offset(parseInt(offset));
}

export async function getAppointmentById(appointmentId) {
  return knex("appointments")
    .where({ appointment_id: appointmentId })
    .first();
}

export async function getAppointmentWithDetails(appointmentId) {
  return knex("appointments")
    .leftJoin("customers", "appointments.customer_id", "customers.customer_id")
    .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
    .select("appointments.*", "customers.*", "vehicles.*")
    .where("appointments.appointment_id", appointmentId);
}

export async function updateAppointment(appointmentId, updateData) {
  return knex("appointments")
    .where({ appointment_id: appointmentId })
    .update(updateData);
}

export async function updateAppointmentDateTime(appointmentId, dateTime) {
  return knex("appointments")
    .where({ appointment_id: appointmentId })
    .update({ appointment_date: dateTime.date, appointment_time: dateTime.time });
}

export async function updatePlateNumber(vehicleId, plateNumber) {
  return knex("vehicles")
    .where({ vehicle_id: vehicleId })
    .update({ plate_number: plateNumber });
}

export async function deleteAppointment(appointmentId) {
  return knex("appointments")
    .where({ appointment_id: appointmentId })
    .del();
}

export async function addServiceEstimate(serviceData) {
  return knex("services_estimate").insert(serviceData);
}

export async function addServiceActual(serviceData) {
  return knex("services_actual").insert(serviceData);
}

export async function addItemRequired(itemData) {
  return knex("items_required").insert(itemData);
}

export async function getServiceEstimates(appointmentId) {
  return knex("services_estimate")
    .where({ appointment_id: appointmentId });
}

export async function getServiceActuals(appointmentId) {
  return knex("services_actual")
    .where({ appointment_id: appointmentId });
}

export async function getItemsRequired(appointmentId) {
  return knex("items_required")
    .where({ appointment_id: appointmentId });
}

export async function deleteService(serviceId) {
  return knex("services_actual")
    .where({ id: serviceId })
    .del();
}

export async function deleteItemRequired(itemId) {
  return knex("items_required")
    .where({ id: itemId })
    .del();
}

export async function createTransaction(transactionData) {
  return knex("transactions").insert(transactionData);
}

export async function reverseQuantity(inventoryId, quantityToReverse) {
  return knex("inventory")
    .where({ inventory_id: inventoryId })
    .increment("quantity", quantityToReverse);
}

export async function getAppointmentsByDateRange(startDate, endDate) {
  return knex("appointments")
    .whereBetween("appointment_date", [startDate, endDate]);
}

export async function markInvoice(appointmentId, invoiceData) {
  return knex("appointment_to_invoice")
    .where({ appointment_id: appointmentId })
    .update(invoiceData);
}

export async function createAppointmentToInvoice(data) {
  return knex("appointment_to_invoice").insert(data);
}

/**
 * Get appointments filtered by company code
 * @param {string} companyCode - The company code to filter by
 * @param {number} limit - Limit results
 * @param {number} offset - Offset results
 * @returns {Promise<Array>} - Array of appointments
 */
export async function getAppointmentsByCompanyCode(companyCode, limit = 100, offset = 0) {
  return knex("appointments")
    .where({ company_code: companyCode })
    .leftJoin("customers", "appointments.customer_id", "customers.customer_id")
    .leftJoin("vehicles", "appointments.vehicle_id", "vehicles.vehicle_id")
    .select("appointments.*", "customers.customer_name", "vehicles.make", "vehicles.model")
    .limit(parseInt(limit))
    .offset(parseInt(offset));
}

/**
 * Get appointment by ID and company code (ensures data isolation)
 * @param {string} appointmentId - The appointment ID
 * @param {string} companyCode - The company code
 * @returns {Promise<Object>} - The appointment or null
 */
export async function getAppointmentByIdAndCompanyCode(appointmentId, companyCode) {
  return knex("appointments")
    .where({ appointment_id: appointmentId, company_code: companyCode })
    .first();
}

/**
 * Update appointment with company code validation
 * @param {string} appointmentId - The appointment ID
 * @param {string} companyCode - The company code
 * @param {Object} updateData - Data to update
 * @returns {Promise} - Update result
 */
export async function updateAppointmentWithCompanyCode(appointmentId, companyCode, updateData) {
  return knex("appointments")
    .where({ appointment_id: appointmentId, company_code: companyCode })
    .update(updateData);
}

/**
 * Delete appointment with company code validation
 * @param {string} appointmentId - The appointment ID
 * @param {string} companyCode - The company code
 * @returns {Promise} - Delete result
 */
export async function deleteAppointmentWithCompanyCode(appointmentId, companyCode) {
  return knex("appointments")
    .where({ appointment_id: appointmentId, company_code: companyCode })
    .del();
}

/**
 * Update next_service_km for an appointment
 * @param {string} appointmentId - The appointment ID
 * @param {string} companyCode - The company code
 * @param {number|null} nextServiceKm - The next service km value
 * @returns {Promise} - Update result
 */
export async function updateNextServiceKm(appointmentId, companyCode, nextServiceKm) {
  return knex("appointments")
    .where({ appointment_id: appointmentId, company_code: companyCode })
    .update({ next_service_km: nextServiceKm });
}

/**
 * Get appointments by date range for a specific company code
 * @param {string} companyCode - The company code
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Array>} - Appointments within date range
 */
export async function getAppointmentsByDateRangeAndCompanyCode(companyCode, startDate, endDate) {
  return knex("appointments")
    .where({ company_code: companyCode })
    .whereBetween("appointment_date", [startDate, endDate]);
}
