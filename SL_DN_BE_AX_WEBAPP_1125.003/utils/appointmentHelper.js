/**
 * Appointment Helper Functions
 * Handles common appointment operations with company_code validation
 */

import * as appointmentModel from "../models/appointment.model.js";
import jwt from "jsonwebtoken";

/**
 * Extract company_code from request
 * @param {Object} req - Express request
 * @returns {string|null} - Company code
 */
export function getCompanyCodeFromRequest(req) {
  // Try body first (for POST/PUT)
  if (req.body && req.body.company_code) {
    return req.body.company_code;
  }

  // Try query parameters
  if (req.query && req.query.company_code) {
    return req.query.company_code;
  }

  // Try custom header
  if (req.headers['x-company-code']) {
    return req.headers['x-company-code'];
  }

  // Try to extract from JWT token
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      return decoded.company_code || null;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Validate that appointment belongs to the specified company_code
 * @param {string} appointmentId - Appointment ID
 * @param {string} companyCode - Company code to validate
 * @returns {Promise<boolean>} - True if appointment belongs to company
 */
export async function validateAppointmentCompanyCode(appointmentId, companyCode) {
  const appointment = await appointmentModel.getAppointmentByIdAndCompanyCode(appointmentId, companyCode);
  return appointment !== null && appointment !== undefined;
}

/**
 * Get appointment with company code validation
 * @param {string} appointmentId - Appointment ID
 * @param {string} companyCode - Company code
 * @returns {Promise<Object|null>} - Appointment or null
 */
export async function getAppointmentSafe(appointmentId, companyCode) {
  return appointmentModel.getAppointmentByIdAndCompanyCode(appointmentId, companyCode);
}

/**
 * Update appointment with company code validation
 * @param {string} appointmentId - Appointment ID
 * @param {string} companyCode - Company code
 * @param {Object} updateData - Data to update
 * @returns {Promise} - Update result
 */
export async function updateAppointmentSafe(appointmentId, companyCode, updateData) {
  return appointmentModel.updateAppointmentWithCompanyCode(appointmentId, companyCode, updateData);
}

/**
 * Delete appointment with company code validation
 * @param {string} appointmentId - Appointment ID
 * @param {string} companyCode - Company code
 * @returns {Promise} - Delete result
 */
export async function deleteAppointmentSafe(appointmentId, companyCode) {
  return appointmentModel.deleteAppointmentWithCompanyCode(appointmentId, companyCode);
}

/**
 * Ensure appointment includes company_code when creating
 * @param {Object} appointmentData - Appointment data from request
 * @param {string} companyCode - Company code from request
 * @returns {Object} - Appointment data with company_code included
 */
export function enrichAppointmentData(appointmentData, companyCode) {
  return {
    ...appointmentData,
    company_code: companyCode,
  };
}
