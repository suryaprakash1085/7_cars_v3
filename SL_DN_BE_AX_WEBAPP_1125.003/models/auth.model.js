import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createUser(userData) {
  return knex('UsersCollection').insert(userData);
}

export async function getUserByEmail(email) {
  return knex('UsersCollection')
    .join('Roles', 'UsersCollection.role_id', 'Roles.role_id')
    .where({ email })
    .first();
}

export async function getUsersWithRoles() {
  return knex('UsersCollection')
    .leftJoin('Roles', 'UsersCollection.role_id', 'Roles.role_id')
    .leftJoin('work_schedules', 'UsersCollection.shift_type', 'work_schedules.id')
    .select(
      'UsersCollection.*',
      'Roles.role_name',
      'Roles.access',
      'work_schedules.description as shift_description'
    );
}

export async function getAllRoles() {
  return knex('Roles').select('*');
}

export async function deleteRoleById(roleId) {
  return knex('Roles').where({ role_id: roleId }).del();
}

/**
 * Detach all users from a role by setting their role_id to NULL
 * This prevents users from being deleted when a role is deleted
 * @param {string} roleId - The role ID
 * @returns {Promise} - Update result
 */
export async function detachUsersFromRole(roleId) {
  return knex('UsersCollection')
    .where({ role_id: roleId })
    .update({ role_id: null });
}

export async function updateUserShiftType(userId, shiftType, description) {
  return knex('UsersCollection')
    .where({ user_id: userId })
    .update({ shift_type: shiftType, description });
}

export async function nullifyUserShiftType(userId) {
  return knex('UsersCollection')
    .where({ user_id: userId })
    .update({ shift_type: null, description: null });
}

export async function updateUserData(userId, updateData) {
  return knex('UsersCollection')
    .where({ user_id: userId })
    .update(updateData);
}

export async function deleteUserById(userId) {
  return knex('UsersCollection')
    .where({ user_id: userId })
    .del();
}

export async function getRoleByName(roleName) {
  return knex('Roles').where({ role_name: roleName }).first();
}

export async function createRole(roleName) {
  return knex('Roles').insert({
    role_name: roleName,
    access: JSON.stringify([])
  });
}

export async function updateRoleAccess(roleId, accessArray) {
  return knex('Roles')
    .where({ role_id: roleId })
    .update({ access: JSON.stringify(accessArray) });
}

export async function updateRoleAccessByName(roleName, accessArray) {
  const roleData = await knex('Roles').where({ role_name: roleName }).first();
  if (roleData) {
    return knex('Roles')
      .where({ role_id: roleData.role_id })
      .update({ access: JSON.stringify(accessArray) });
  }
  return null;
}

export async function createTimeEntry(timeEntryData) {
  return knex('time_entry').insert(timeEntryData);
}

export async function getAllTimeEntries() {
  return knex('time_entry').select('*');
}

export async function updateTimeEntry(id, timeEntryData) {
  return knex('time_entry')
    .where({ id })
    .update(timeEntryData);
}

export async function deleteTimeEntry(id) {
  return knex('time_entry').where({ id }).del();
}

export async function getUserById(userId) {
  return knex('UsersCollection')
    .where({ user_id: userId })
    .first();
}

/**
 * Assign company codes to a user (supports multiple codes)
 * @param {string} userId - The user ID
 * @param {string|string[]} companyCodes - Single company code or array of codes
 * @returns {Promise} - Update result
 */
export async function assignCompanyCodeToUser(userId, companyCodes) {
  // Normalize input - convert single code to array
  const codesArray = Array.isArray(companyCodes) ? companyCodes : [companyCodes];

  return knex('UsersCollection')
    .where({ user_id: userId })
    .update({ company_codes: JSON.stringify(codesArray) });
}

/**
 * Add a company code to user's existing codes (no duplicates)
 * @param {string} userId - The user ID
 * @param {string} companyCode - The company code to add
 * @returns {Promise} - Update result
 */
export async function addCompanyCodeToUser(userId, companyCode) {
  const user = await knex('UsersCollection')
    .where({ user_id: userId })
    .select('company_codes')
    .first();

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  let codes = [];
  if (user.company_codes) {
    codes = JSON.parse(user.company_codes);
  }

  // Add code if not already present
  if (!codes.includes(companyCode)) {
    codes.push(companyCode);
  }

  return knex('UsersCollection')
    .where({ user_id: userId })
    .update({ company_codes: JSON.stringify(codes) });
}

/**
 * Remove a company code from user's codes
 * @param {string} userId - The user ID
 * @param {string} companyCode - The company code to remove
 * @returns {Promise} - Update result
 */
export async function removeCompanyCodeFromUser(userId, companyCode) {
  const user = await knex('UsersCollection')
    .where({ user_id: userId })
    .select('company_codes')
    .first();

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  let codes = [];
  if (user.company_codes) {
    codes = JSON.parse(user.company_codes);
  }

  // Remove the code
  codes = codes.filter(code => code !== companyCode);

  return knex('UsersCollection')
    .where({ user_id: userId })
    .update({ company_codes: JSON.stringify(codes.length > 0 ? codes : null) });
}

/**
 * Get user's company codes
 * @param {string} userId - The user ID
 * @returns {Promise<string[]>} - Array of company codes or empty array
 */
export async function getUserCompanyCodes(userId) {
  const user = await knex('UsersCollection')
    .where({ user_id: userId })
    .select('company_codes')
    .first();

  if (!user || !user.company_codes) {
    return [];
  }

  try {
    return JSON.parse(user.company_codes);
  } catch {
    return [];
  }
}

/**
 * Get all users for a specific company code
 * @param {string} companyCode - The company code
 * @returns {Promise<Array>} - Array of users with this company code
 */
export async function getUsersByCompanyCode(companyCode) {
  // Fetch all users and filter by company code (since JSON search is DB-specific)
  const users = await knex('UsersCollection').select('*');

  return users.filter(user => {
    if (!user.company_codes) return false;
    try {
      const codes = JSON.parse(user.company_codes);
      return codes.includes(companyCode);
    } catch {
      return false;
    }
  });
}
