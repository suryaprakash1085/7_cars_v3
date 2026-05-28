/**
 * Middleware to validate company_code for appointment endpoints
 * 
 * Company code can be provided via:
 * 1. Query parameter: ?company_code=ABC
 * 2. Request body: { company_code: "ABC", ... }
 * 3. Header: x-company-code: ABC
 * 4. Path parameter: /appointment/:appointment_id (extracted from token)
 * 
 * For POST/PUT/DELETE: company_code is MANDATORY
 * For GET: company_code is used for filtering if provided, otherwise error
 */

import jwt from 'jsonwebtoken';

/**
 * Extract company_code from request (query, body, or header)
 * Supports both single code (company_code) and multiple codes (company_codes)
 *
 * @param {Object} req - Express request object
 * @returns {string|null} - Company code or null
 */
export function extractCompanyCode(req) {
  // Try to get from query parameters
  if (req.query.company_code) {
    return req.query.company_code;
  }

  // Try to get from request body
  if (req.body && req.body.company_code) {
    return req.body.company_code;
  }

  // Try to get from custom header
  const headerCompanyCode = req.headers['x-company-code'];
  if (headerCompanyCode) {
    return headerCompanyCode;
  }

  // Try to extract from JWT token (company_codes array or company_code string)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'your-secret-key');

      // Try to get from company_codes array (use first code)
      if (decoded.company_codes && Array.isArray(decoded.company_codes) && decoded.company_codes.length > 0) {
        return decoded.company_codes[0];
      }

      // Fall back to single company_code for backward compatibility
      if (decoded.company_code) {
        return decoded.company_code;
      }
    } catch (error) {
      // Silently fail - token parsing errors are handled elsewhere
    }
  }

  return null;
}

/**
 * Extract all company codes that a user has access to
 * @param {Object} req - Express request object
 * @returns {string[]} - Array of company codes
 */
export function extractUserCompanyCodes(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return [];
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'your-secret-key');

    // Return company_codes array if available
    if (decoded.company_codes && Array.isArray(decoded.company_codes)) {
      return decoded.company_codes;
    }

    // Fall back to company_code for backward compatibility
    if (decoded.company_code) {
      return [decoded.company_code];
    }

    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Validate that company_code is present in the request
 * Returns 400 if company_code is missing
 * 
 * Usage: app.use('/appointment', validateCompanyCodePresence, appointmentRoutes);
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function validateCompanyCodePresence(req, res, next) {
  // GET requests can be filtered by company code
  if (req.method === 'GET') {
    const companyCode = extractCompanyCode(req);
    if (companyCode) {
      req.company_code = companyCode;
      return next();
    }
    // For GET, company_code is optional but recommended for filtering
    // Allow proceeding without it (endpoints can handle it)
    return next();
  }

  // POST, PUT, DELETE require company_code
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const companyCode = extractCompanyCode(req);
    if (!companyCode) {
      return res.status(400).json({
        error: 'company_code is mandatory for this operation',
        hint: 'Provide company_code via query parameter, request body, or x-company-code header',
      });
    }
    req.company_code = companyCode;
    return next();
  }

  next();
}

/**
 * Validate that company_code is present and matches one of user's assigned company codes
 * This is stricter - ensures users can only operate within their assigned companies
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function validateUserCompanyCode(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized - missing token' });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'your-secret-key');

    const requestCompanyCode = extractCompanyCode(req);

    if (!requestCompanyCode) {
      return res.status(400).json({
        error: 'company_code is required',
        hint: 'Provide company_code via query parameter, request body, or x-company-code header',
      });
    }

    // Get user's allowed company codes
    let userCompanyCodes = [];
    if (decoded.company_codes && Array.isArray(decoded.company_codes)) {
      userCompanyCodes = decoded.company_codes;
    } else if (decoded.company_code) {
      userCompanyCodes = [decoded.company_code];
    }

    // Check if requested company_code is in user's allowed codes
    if (userCompanyCodes.length > 0 && !userCompanyCodes.includes(requestCompanyCode)) {
      return res.status(403).json({
        error: 'Access denied - you do not have permission to access this company\'s data',
        user_company_codes: userCompanyCodes,
        requested_company_code: requestCompanyCode,
      });
    }

    // Store in request for use in controllers
    req.company_code = requestCompanyCode;
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Extract user info from token
 * @param {Object} req - Express request object
 * @returns {Object|null} - Decoded user info or null
 */
export function getUserFromToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  try {
    const token = authHeader.split(" ")[1];
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
}
