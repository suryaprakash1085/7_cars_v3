/**
 * Company Code Helper Utility
 * Provides functions to include company_codes in API requests
 * Supports both single and multiple company codes
 */

import Cookies from "js-cookie";

/**
 * Get the user's assigned company codes from cookies
 * @returns {string[]} - Array of company codes
 */
export function getCompanyCodesFromCookies() {
  try {
    const companyCodes = Cookies.get("company_codes");
    if (companyCodes) {
      return JSON.parse(companyCodes);
    }
  } catch (error) {
    console.error("Error parsing company_codes from cookies:", error);
  }
  return [];
}

/**
 * Get the currently active company code (first in list)
 * @returns {string} - Current company code or empty string if not found
 */
export function getCompanyCodeFromCookies() {
  // Try to get from company_codes array first
  const companyCodes = getCompanyCodesFromCookies();
  if (companyCodes.length > 0) {
    // Get the active one or first one
    const activeCode = Cookies.get("current_company_code");
    if (activeCode && companyCodes.includes(activeCode)) {
      return activeCode;
    }
    return companyCodes[0];
  }

  // Fall back to old single code cookies for backward compatibility
  return Cookies.get("current_company_code") || Cookies.get("companyCode") || "";
}

/**
 * Set the company codes in cookies
 * @param {string|string[]} companyCodes - Single company code or array of codes
 */
export function setCompanyCodesInCookies(companyCodes) {
  if (!companyCodes) return;

  const codesArray = Array.isArray(companyCodes) ? companyCodes : [companyCodes];

  if (codesArray.length > 0) {
    Cookies.set("company_codes", JSON.stringify(codesArray));
    // Set current_company_code to the first one
    Cookies.set("current_company_code", codesArray[0]);
    Cookies.set("companyCode", codesArray[0]);
  }
}

/**
 * Set the currently active company code
 * @param {string} companyCode - The company code to activate
 */
export function setActiveCompanyCode(companyCode) {
  const codes = getCompanyCodesFromCookies();
  if (codes.includes(companyCode)) {
    Cookies.set("current_company_code", companyCode);
    Cookies.set("companyCode", companyCode);
  }
}

/**
 * Set the company_code in cookies (backward compatibility)
 * @deprecated Use setCompanyCodesInCookies instead
 * @param {string} companyCode - The company code to store
 */
export function setCompanyCodeInCookies(companyCode) {
  setCompanyCodesInCookies([companyCode]);
}

/**
 * Build query string with company_code
 * @param {string} baseUrl - The base URL
 * @param {Object} params - Query parameters
 * @returns {string} - Complete URL with query parameters
 */
export function buildUrlWithCompanyCode(baseUrl, params = {}) {
  const companyCode = getCompanyCodeFromCookies();
  const allParams = {
    ...params,
    company_code: companyCode,
  };

  const queryString = new URLSearchParams(allParams).toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Build headers with company_code
 * @param {Object} baseHeaders - Base headers object
 * @returns {Object} - Headers with company_code included
 */
export function buildHeadersWithCompanyCode(baseHeaders = {}) {
  const companyCode = getCompanyCodeFromCookies();
  return {
    ...baseHeaders,
    "x-company-code": companyCode,
  };
}

/**
 * Make a GET request with company_code
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithCompanyCode(url, options = {}) {
  const companyCode = getCompanyCodeFromCookies();
  const finalUrl = url.includes("?")
    ? `${url}&company_code=${encodeURIComponent(companyCode)}`
    : `${url}?company_code=${encodeURIComponent(companyCode)}`;

  const finalOptions = {
    ...options,
    headers: buildHeadersWithCompanyCode(options.headers || {}),
  };

  return fetch(finalUrl, finalOptions);
}

/**
 * Enhanced fetch for POST/PUT/DELETE with company_code
 * @param {string} url - API endpoint
 * @param {string} method - HTTP method (POST, PUT, DELETE)
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export async function fetchWithCompanyCodeAndData(url, method, data = {}, options = {}) {
  const companyCode = getCompanyCodeFromCookies();
  
  const finalUrl = url.includes("?")
    ? `${url}&company_code=${encodeURIComponent(companyCode)}`
    : `${url}?company_code=${encodeURIComponent(companyCode)}`;

  const finalData = {
    ...data,
    company_code: companyCode,
  };

  const finalOptions = {
    ...options,
    method,
    headers: {
      "Content-Type": "application/json",
      ...buildHeadersWithCompanyCode(options.headers || {}),
    },
    body: JSON.stringify(finalData),
  };

  return fetch(finalUrl, finalOptions);
}

/**
 * Get all company codes the user has access to
 * @returns {string[]} - Array of all company codes
 */
export function getAllCompanyCodes() {
  return getCompanyCodesFromCookies();
}

/**
 * Check if user has access to a specific company code
 * @param {string} companyCode - The company code to check
 * @returns {boolean} - True if user has access
 */
export function hasAccessToCompanyCode(companyCode) {
  const codes = getCompanyCodesFromCookies();
  return codes.includes(companyCode);
}

/**
 * Clear company codes from cookies (on logout)
 */
export function clearCompanyCode() {
  Cookies.remove("current_company_code");
  Cookies.remove("companyCode");
  Cookies.remove("company_codes");
}
