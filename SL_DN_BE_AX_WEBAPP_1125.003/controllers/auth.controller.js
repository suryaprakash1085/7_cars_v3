import {
  generateToken,
  hashPassword,
  comparePassword,
} from "../utils/auth.js";
import { generateCustomId } from "../utils/idGenerator.js";
import logChange from "../middleware/changeLog.js";
import * as authModel from "../models/auth.model.js";

export async function register(req, res) {
  const { role } = req.body;
  if (!role) {
    return res.status(400).send({ error: "Role is required" });
  }

  // Fetch role_id and access from the Roles table
  const roleData = await authModel.getRoleByName(role);
  if (!roleData) {
    return res.status(400).send({ error: "Invalid role" });
  }

  try {
    const { username, password, email, firstName, lastName, phone, button_status } = req.body;
    const passwordHash = await hashPassword(password);
    const userId = await generateCustomId("USER");

    await authModel.createUser({
      user_id: userId,
      username,
      passwordHash,
      email,
      role_id: roleData.role_id,
      firstName,
      lastName,
      phone,
      user_type: "user",
      role_type: roleData.role_name,
      button_status,
    });

    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).send({ error: "Registration failed", details: error.message });
  }
}

export async function createEmployee(req, res) {
  const { role } = req.body;
  if (!role) {
    return res.status(400).send({ error: "Role is required" });
  }

  // Fetch role_id and access from the Roles table
  const roleData = await authModel.getRoleByName(role);
  if (!roleData) {
    return res.status(400).send({ error: "Invalid role" });
  }

  try {
    const { email, firstName, lastName, phone, button_status } = req.body;
    const userId = await generateCustomId("USER");

    await authModel.createUser({
      user_id: userId,
      email,
      role_id: roleData.role_id,
      firstName,
      lastName,
      phone,
      user_type: "Employee",
      button_status,
      role_type: roleData.role_name,
    });

    res.status(201).send({ message: "User registered successfully" });
    console.log("User registered successfully");
  } catch (error) {
    res.status(400).send({ error: "Registration failed", details: error.message });
    console.log("Registration failed", error.message);
  }
}

export async function getUsers(req, res) {
  try {
    const users = await authModel.getUsersWithRoles();

    // Parse roles.access to array and normalize company codes
    const parsedUsers = users.map(user => {
      // Parse access
      let access = [];
      try {
        access = JSON.parse(user.access || "[]");
      } catch {
        access = [];
      }

      // Parse and normalize company codes
      let companyCodesArray = [];
      if (user.company_codes) {
        try {
          const parsed = JSON.parse(user.company_codes);
          companyCodesArray = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          companyCodesArray = [user.company_codes];
        }
      }

      return {
        ...user,
        access,
        company_codes: companyCodesArray,
        // Include company_code for backward compatibility (first code if available)
        company_code: companyCodesArray.length > 0 ? companyCodesArray[0] : null,
      };
    });

    res.status(200).send(parsedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send({ error: "Internal server error", details: error.message });
  }
}

export async function getAllRoles(req, res) {
  try {
    const roles = await authModel.getAllRoles();
    //parse roles.access to array
    const parsedRoles = roles.map(role => ({
      ...role,
      access: JSON.parse(role.access)
    }));
    res.status(200).send(parsedRoles);
  } catch (error) {
    res.status(500).send({ error: "Error fetching roles", details: error.message });
  }
}

export async function deleteRole(req, res) {
  try {
    const { role_id } = req.params;

    // First, detach all users from this role by setting role_id to NULL
    // This ensures users are not deleted when a role is deleted
    await authModel.detachUsersFromRole(role_id);

    // Then delete the role
    const deleted = await authModel.deleteRoleById(role_id);
    if (!deleted) {
      return res.status(404).send({ error: "Role not found" });
    }
    res.status(200).send({ message: "Role deleted successfully and users have been detached" });
  } catch (error) {
    res.status(500).send({ error: "Error deleting role", details: error.message });
  }
}

export async function updateShiftType(req, res) {
  try {
    const { user_id, shift_type, description } = req.body;

    if (!user_id || shift_type === undefined || !description) {
      return res.status(400).send({ error: "User ID, shift type, and description are required" });
    }

    const updatedRows = await authModel.updateUserShiftType(user_id, shift_type, description);

    if (updatedRows) {
      res.status(200).send({ message: "Shift type and description updated successfully" });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).send({ error: "Update failed", details: error.message });
  }
}

export async function nullShiftType(req, res) {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).send({ error: "User ID is required" });
    }

    const updatedRows = await authModel.nullifyUserShiftType(user_id);

    if (updatedRows) {
      res.status(200).send({ message: "Shift type updated successfully" });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).send({ error: "Update failed", details: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await authModel.getUserByEmail(email);
    if (!user) {
      console.log("User not found");
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return res.status(401).send({ error: "Invalid credentials" });
    }

    const token = generateToken(user, user.role_name);

    console.log("Login successful for user:", email);

    // Parse company codes from user
    let companyCodes = [];
    if (user.company_codes) {
      try {
        companyCodes = JSON.parse(user.company_codes);
      } catch {
        companyCodes = [];
      }
    }

    // Return user data with company_codes
    const userData = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role_name: user.role_name,
      access: user.access,
      company_codes: companyCodes, // Include company codes array for frontend to cache
      // Keep company_code for backward compatibility (use first code if available)
      company_code: companyCodes.length > 0 ? companyCodes[0] : null,
    };

    res.status(200).send({ token, user: userData });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).send({ error: "Login failed", details: error.message });
  }
}

export async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { password, email, role } = req.body;

    const updateData = {};

    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }
    if (email) {
      updateData.email = email;
    }
    if (role) {
      const roleData = await authModel.getRoleByName(role);
      if (!roleData) {
        return res.status(400).send({ error: "Invalid role" });
      }
      updateData.role_id = roleData.role_id;
    }

    const updatedRows = await authModel.updateUserData(userId, updateData);

    if (updatedRows) {
      res.status(200).send({ message: "User updated successfully" });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).send({ error: "Update failed", details: error.message });
  }
}

export async function updateAccess(req, res) {
  try {
    const { accessData } = req.body;

    if (typeof accessData !== 'object' || accessData === null) {
      return res.status(400).send({ error: "Invalid data format" });
    }

    const updatePromises = Object.keys(accessData).map(async (roleName) => {
      const accessArray = accessData[roleName];

      if (Array.isArray(accessArray)) {
        await authModel.updateRoleAccessByName(roleName, accessArray);
      } else {
        console.warn(`Invalid access array for role: ${roleName}`);
        return Promise.resolve();
      }
    });

    await Promise.all(updatePromises);

    res.status(200).send({ message: "Access updated successfully for all roles" });
  } catch (error) {
    console.error("Error updating access:", error);
    res.status(400).send({ error: "Update failed", details: error.message });
  }
}

export async function addRole(req, res) {
  try {
    const { role_name } = req.body;

    if (!role_name) {
      return res.status(400).send({ error: "Role name is required" });
    }

    await authModel.createRole(role_name);

    res.status(201).send({ message: "Role added successfully" });
  } catch (error) {
    console.error("Error adding role:", error);
    res.status(400).send({ error: "Insert failed", details: error.message });
  }
}

export async function createTimeEntry(req, res) {
  try {
    const { id, time, name, color, date, employeeId } = req.body;
    await authModel.createTimeEntry({
      id,
      time,
      name,
      color,
      date,
      employeeId
    });
    res.status(201).send({ message: "Time entry created successfully" });
  } catch (error) {
    res.status(400).send({ error: "Creation failed", details: error.message });
  }
}

export async function getTimeEntries(req, res) {
  try {
    const timeEntries = await authModel.getAllTimeEntries();
    res.status(200).send(timeEntries);
  } catch (error) {
    res.status(500).send({ error: "Internal server error", details: error.message });
  }
}

export async function updateTimeEntry(req, res) {
  try {
    const { id } = req.params;
    const { time, name, color, date, employeeId } = req.body;
    const updatedRows = await authModel.updateTimeEntry(id, { time, name, color, date, employeeId });

    if (updatedRows) {
      res.status(200).send({ message: "Time entry updated successfully" });
    } else {
      res.status(404).send({ error: "Time entry not found" });
    }
  } catch (error) {
    res.status(400).send({ error: "Update failed", details: error.message });
  }
}

export async function deleteTimeEntry(req, res) {
  try {
    const { id } = req.params;
    const deletedRows = await authModel.deleteTimeEntry(id);

    if (deletedRows) {
      res.status(200).send({ message: "Time entry deleted successfully" });
    } else {
      res.status(404).send({ error: "Time entry not found" });
    }
  } catch (error) {
    res.status(400).send({ error: "Deletion failed", details: error.message });
  }
}

export async function updateEmployee(req, res) {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Ensure user_id is not part of the update data
    delete updateData.user_id;

    // Normalize company_codes to JSON string if provided as array
    if (updateData.company_codes) {
      if (Array.isArray(updateData.company_codes)) {
        updateData.company_codes = JSON.stringify(updateData.company_codes);
      } else if (typeof updateData.company_codes === 'string') {
        // Try to parse and re-stringify to ensure valid JSON
        try {
          const parsed = JSON.parse(updateData.company_codes);
          updateData.company_codes = JSON.stringify(Array.isArray(parsed) ? parsed : [parsed]);
        } catch {
          // If it's a plain string, wrap in array
          updateData.company_codes = JSON.stringify([updateData.company_codes]);
        }
      }
      // Always remove company_code when company_codes is being set (avoid updating non-existent column)
      delete updateData.company_code;
    }

    // Handle single company_code for backward compatibility (only if company_codes not provided)
    if (updateData.company_code && !updateData.company_codes) {
      updateData.company_codes = JSON.stringify([updateData.company_code]);
      delete updateData.company_code;
    }

    // Retrieve the current data before updating
    const currentData = await authModel.getUserById(userId);

    if (!currentData) {
      return res.status(404).send({ error: "User not found" });
    }

    const updatedRows = await authModel.updateUserData(userId, updateData);

    if (updatedRows) {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      // Create a change log with only the fields that were updated
      const changeLog = {
        old: {},
        new: {}
      };

      for (const key in updateData) {
        if (updateData.hasOwnProperty(key)) {
          // Decode company_codes for display in log
          const newValue = key === 'company_codes' && typeof updateData[key] === 'string'
            ? JSON.parse(updateData[key])
            : updateData[key];
          const oldValue = key === 'company_codes' && currentData[key]
            ? (typeof currentData[key] === 'string' ? JSON.parse(currentData[key]) : currentData[key])
            : currentData[key];

          changeLog.old[key] = oldValue;
          changeLog.new[key] = newValue;
        }
      }

      await logChange(token, "users", "UPDATE", userId, changeLog);

      res.status(200).send({ message: "User updated successfully" });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    res.status(400).send({ error: "Update failed", details: error.message });
  }
}

export async function deleteEmployee(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  const userId = req.params.userId;

  try {
    const deleted = await authModel.deleteUserById(userId);
    if (!deleted) {
      return res.status(404).send({ error: "User not found" });
    }

    let deletionMsg = { Deleted: `${deleted} User` };

    await logChange(token, "users", "DELETE", userId, deletionMsg);
    res.status(200).send({ message: "User deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error deleting user", details: error.message });
  }
}


/**
 * Assign company codes to a user
 * Used by admins to set which company codes a user has access to
 * Can accept single code (string) or multiple codes (array)
 */
export async function assignCompanyCode(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    if (!token) {
      return res.status(401).send({ error: "Unauthorized" });
    }

    const { userId, companyCode, companyCodes } = req.body;

    if (!userId) {
      return res.status(400).send({ error: "userId is required" });
    }

    // Support both companyCode (single) and companyCodes (array)
    const codesToAssign = companyCodes || (companyCode ? [companyCode] : null);

    if (!codesToAssign || (Array.isArray(codesToAssign) && codesToAssign.length === 0)) {
      return res.status(400).send({ error: "At least one company code is required" });
    }

    // Verify user exists
    const user = await authModel.getUserById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    // Get old company codes for logging
    let oldCodes = [];
    if (user.company_codes) {
      try {
        oldCodes = JSON.parse(user.company_codes);
      } catch {
        oldCodes = [];
      }
    }

    // Update user's company codes
    await authModel.assignCompanyCodeToUser(userId, codesToAssign);

    await logChange(token, "users", "UPDATE", userId, {
      field: "company_codes",
      old: oldCodes,
      new: codesToAssign,
    });

    res.status(200).send({
      message: "Company codes assigned successfully",
      user_id: userId,
      company_codes: codesToAssign,
    });
  } catch (error) {
    console.error("Error assigning company code:", error);
    res.status(400).send({ error: "Failed to assign company code", details: error.message });
  }
}


export async function changePassword(req, res) {
  const { user_id, password } = req.body;

  authModel.getUserById(user_id)
    .then(user => {
      if (!user) {
        throw { status: 404, message: "User not found" };
      }

      return hashPassword(password);
    })
    .then(newHashedPassword => {
      return authModel.updateUserData(user_id, { passwordHash: newHashedPassword });
    })
    .then(() => {
      res.status(200).send({ message: "Password changed successfully" });
    })
    .catch(err => {
      if (err.status) {
        res.status(err.status).send({ error: err.message });
      } else {
        res.status(400).send({ error: "Password change failed", details: err.message || err });
      }
    });
}
