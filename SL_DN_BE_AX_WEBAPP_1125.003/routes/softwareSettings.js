import express from "express";
import knexLib from "knex"; // Import the Knex library
import knexConfig from "../knexfile.js"; // Import your Knex configuration
import authenticateToken from "../middleware/authenticate.js";
import { body, validationResult } from "express-validator";
import logChange from "../middleware/changeLog.js"; // Add this import
import { clearTimezoneCache } from "../utils/timezone.service.js";
const knex = knexLib(knexConfig); // Initialize Knex with the configuration

const router = express.Router();
router.post("/", async (req, res) => {
  try {
    // console.log(req.body);
    const {
      company_code,
      company_gst,
      company_name,
      company_phone_number,
      pr_limit_config,
      logo,
      background_image,
    } = req.body;
    const new_company = await knex("company_details").insert({
      company_code,
      company_gst,
      company_name,
      company_phone_number,
      pr_limit_config,
      logo,
      background_image,
    });
    res
      .status(200)
      .send({ message: "Company details updated successfully", new_company });
  } catch (error) {
    console.error("Error updating company details:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const company_details = await knex("company_details").select("*");
    res.status(200).send({
      message: "Company details fetched successfully",
      company_details,
    });
  } catch (error) {
    console.error("Error fetching company details:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});

router.get("/codes/all", async (req, res) => {
  try {
    const companyCodes = await knex("company_details")
      .select("company_code", "company_name")
      .whereNotNull("company_code")
      .orderBy("company_code");
    res.status(200).json(companyCodes);
  } catch (error) {
    console.error("Error fetching company codes:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const {
      id,
      company_code,
      company_gst,
      company_name,
      company_phone_number,
      pr_limit_config,
      logo,
      background_image,
      company_upi,
    } = req.body;
    const updated_company = await knex("company_details")
      .where("id", id)
      .update({
        company_code,
        pr_limit_config,
        company_gst,
        company_name,
        company_phone_number,
        pr_limit_config,
        logo,
        background_image,
        company_upi,
      });
    res.status(200).send({
      message: "Company details updated successfully",
      updated_company,
    });
  } catch (error) {
    console.error("Error updating company details:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});

router.post("/service", async (req, res) => {
  try {
    // console.log(req.body);
    const { service_name } = req.body;
    const new_service = await knex("service_type").insert({
      service_name,
    });
    res
      .status(200)
      .send({ message: "Service added successfully", new_service });
  } catch (error) {
    console.error("Error adding service:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});
router.get("/service", async (req, res) => {
  try {
    const services = await knex("service_type").select("*");
    res
      .status(200)
      .send({ message: "Services fetched successfully", services });
  } catch (error) {
    console.error("Error fetching services:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});

router.delete("/service/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { id } = req.params;

    // Fetch service details before deletion for logging purposes
    const serviceDetails = await knex("service_type").where("id", id).first();

    if (!serviceDetails) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Delete the service
    const deletedCount = await knex("service_type").where("id", id).delete();

    if (deletedCount === 0) {
      return res.status(404).json({ error: "Service could not be deleted" });
    }

    // Log the deletion
    const changes = {
      deleted_service: serviceDetails,
    };
    await logChange(token, "service_type", "DELETE", id, changes);

    // Respond with success message
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({
      error: "Error deleting service.",
      details: error.message,
    });
  }
});

router.put("/service/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { service_name } = req.body;
    const updated_service = await knex("service_type")
      .where("id", id)
      .update({ service_name });
    res
      .status(200)
      .send({ message: "Service updated successfully", updated_service });
  } catch (error) {
    console.error("Error updating service:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});

router.post("/expenses", async (req, res) => {
  try {
    const { expenses_name } = req.body;
    const new_expense = await knex("expenses_type").insert({ expenses_name });
    res
      .status(200)
      .send({ message: "Expense added successfully", new_expense });
  } catch (error) {
    console.error("Error adding expense:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});
router.get("/expenses", async (req, res) => {
  try {
    const expenses = await knex("expenses_type").select("*");
    res
      .status(200)
      .send({ message: "Expenses fetched successfully", expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});

router.delete("/expenses/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { id } = req.params;

    // Fetch expense details before deletion for logging purposes
    const expenseDetails = await knex("expenses_type").where("id", id).first();

    if (!expenseDetails) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Delete the expense
    const deletedCount = await knex("expenses_type").where("id", id).delete();

    if (deletedCount === 0) {
      return res.status(404).json({ error: "Expense could not be deleted" });
    }

    // Log the deletion
    const changes = {
      deleted_expense: expenseDetails,
    };
    await logChange(token, "expenses_type", "DELETE", id, changes);

    // Respond with success message
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({
      error: "Error deleting expense.",
      details: error.message,
    });
  }
});

router.put("/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { expenses_name } = req.body;
    const updated_expense = await knex("expenses_type")
      .where("id", id)
      .update({ expenses_name });
    res
      .status(200)
      .send({ message: "Expense updated successfully", updated_expense });
  } catch (error) {
    console.error("Error updating expense:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});

router.post("/number_range", async (req, res) => {
  try {
    // Support both old and new payload formats for backward compatibility
    const {
      company_code,
      id_type,
      type,  // Old format
      range_start,
      startRange,  // Old format
      range_end,
      endRange,  // Old format
      running_number,
      currentRange,  // Old format
      prefix
    } = req.body;

    // Use new format if provided, otherwise fall back to old format
    const finalIdType = id_type || type;
    const finalRangeStart = range_start !== undefined ? range_start : (startRange ? parseInt(startRange) : null);
    const finalRangeEnd = range_end !== undefined ? range_end : (endRange ? parseInt(endRange) : null);
    const finalRunningNumber = running_number !== undefined ? running_number : (currentRange ? parseInt(currentRange) : finalRangeStart);
    const finalPrefix = prefix;

    // Validate required fields
    if (!finalIdType || finalRangeStart === null || finalRangeEnd === null || !finalPrefix) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "id_type (or type), range_start (or startRange), range_end (or endRange), and prefix are required"
      });
    }

    // Validate that start is less than end
    if (finalRangeStart >= finalRangeEnd) {
      return res.status(400).json({
        error: "Invalid range",
        details: "range_start must be less than range_end"
      });
    }

    // Insert the new number range with all fields
    const new_number_range = await knex("number_range").insert({
      company_code: company_code || null,
      id_type: finalIdType,
      range_start: finalRangeStart,
      range_end: finalRangeEnd,
      running_number: finalRunningNumber || finalRangeStart,
      prefix: finalPrefix,
    });

    // Log the change
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    await logChange(token, "number_range", "INSERT", new_number_range[0], {
      company_code,
      id_type: finalIdType,
      range_start: finalRangeStart,
      range_end: finalRangeEnd,
      running_number: finalRunningNumber || finalRangeStart,
      prefix: finalPrefix,
    });

    res
      .status(201)
      .json({
        message: "Number range added successfully",
        id: new_number_range[0],
        company_code: company_code || null,
        id_type: finalIdType,
        range_start: finalRangeStart,
        range_end: finalRangeEnd,
        running_number: finalRunningNumber || finalRangeStart,
        prefix: finalPrefix,
      });
  } catch (error) {
    console.error("Error adding number range:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});

router.get("/number_range", async (req, res) => {
  try {
    const number_range = await knex("number_range").select("*");
    res
      .status(200)
      .send({ message: "Number range fetched successfully", number_range });
  } catch (error) {
    console.error("Error fetching number range:", error);
    res
      .status(500)
      .send({ error: "Internal server error", details: error.message });
  }
});

router.put("/number_range/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    const { id } = req.params;
    const {
      company_code,
      id_type,
      type,  // Old format
      range_start,
      startRange,  // Old format
      range_end,
      endRange,  // Old format
      running_number,
      currentRange,  // Old format
      prefix
    } = req.body;

    // Update only the fields that are provided (support both old and new formats)
    const updateData = {};
    if (company_code !== undefined) updateData.company_code = company_code;
    if (id_type !== undefined) updateData.id_type = id_type;
    else if (type !== undefined) updateData.id_type = type;

    if (range_start !== undefined) updateData.range_start = range_start;
    else if (startRange !== undefined) updateData.range_start = parseInt(startRange);

    if (range_end !== undefined) updateData.range_end = range_end;
    else if (endRange !== undefined) updateData.range_end = parseInt(endRange);

    if (running_number !== undefined) updateData.running_number = running_number;
    else if (currentRange !== undefined) updateData.running_number = parseInt(currentRange);

    if (prefix !== undefined) updateData.prefix = prefix;

    // Validate range if both start and end are provided
    const finalStart = updateData.range_start;
    const finalEnd = updateData.range_end;
    if (finalStart !== undefined && finalEnd !== undefined) {
      if (finalStart >= finalEnd) {
        return res.status(400).json({
          error: "Invalid range",
          details: "range_start must be less than range_end"
        });
      }
    }

    // Retrieve the current data before updating
    const currentData = await knex("number_range").where("id", id).first();

    if (!currentData) {
      return res.status(404).send({ error: "Number range not found" });
    }

    const updatedRows = await knex("number_range")
      .where("id", id)
      .update(updateData);

    if (updatedRows) {
      // Create a change log with only the fields that were updated
      const changeLog = {
        old: {},
        new: {},
      };

      for (const key in updateData) {
        if (updateData.hasOwnProperty(key)) {
          changeLog.old[key] = currentData[key];
          changeLog.new[key] = updateData[key];
        }
      }

      await logChange(token, "number_range", "UPDATE", id, changeLog);

      res.status(200).send({
        message: "Number range updated successfully",
        updated_number_range: updatedRows,
      });
    } else {
      res.status(404).send({ error: "Number range not found" });
    }
  } catch (error) {
    console.error("Error updating number range:", error);
    res.status(500).send({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.delete("/number_range/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { id } = req.params;

    // Fetch number range details before deletion for logging purposes
    const numberRangeDetails = await knex("number_range")
      .where("id", id)
      .first();

    if (!numberRangeDetails) {
      return res.status(404).json({ error: "Number range not found" });
    }

    // Delete the number range
    const deletedCount = await knex("number_range").where("id", id).delete();

    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "Number range could not be deleted" });
    }

    // Log the deletion
    const changes = {
      deleted_number_range: numberRangeDetails,
    };
    await logChange(token, "number_range", "DELETE", id, changes);

    // Respond with success message
    res.status(200).json({
      message: "Number range deleted successfully",
      deleted_number_range: numberRangeDetails,
    });
  } catch (error) {
    console.error("Error deleting number range:", error);
    res.status(500).json({
      error: "Error deleting number range.",
      details: error.message,
    });
  }
});

router.post("/timezone", async (req, res) => {
  try {
    const { timezone_name, timezone_code, description, utc_offset } = req.body;

    if (!timezone_name || !timezone_code || !utc_offset) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "timezone_name, timezone_code, and utc_offset are required"
      });
    }

    const new_timezone = await knex("timezone_settings").insert({
      timezone_name,
      timezone_code,
      description,
      utc_offset,
    });

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    await logChange(token, "timezone_settings", "INSERT", new_timezone[0], {
      timezone_name,
      timezone_code,
      description,
      utc_offset,
    });

    res.status(201).json({
      message: "Timezone added successfully",
      id: new_timezone[0],
    });
  } catch (error) {
    console.error("Error adding timezone:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.get("/timezone", async (req, res) => {
  try {
    const timezones = await knex("timezone_settings").select("*");
    res.status(200).json({
      message: "Timezones fetched successfully",
      timezones,
    });
  } catch (error) {
    console.error("Error fetching timezones:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.put("/timezone/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    const { id } = req.params;
    const { timezone_name, timezone_code, description, utc_offset, is_active } = req.body;

    const currentData = await knex("timezone_settings").where("id", id).first();

    if (!currentData) {
      return res.status(404).json({ error: "Timezone not found" });
    }

    const updateData = {};
    if (timezone_name !== undefined) updateData.timezone_name = timezone_name;
    if (timezone_code !== undefined) updateData.timezone_code = timezone_code;
    if (description !== undefined) updateData.description = description;
    if (utc_offset !== undefined) updateData.utc_offset = utc_offset;
    if (is_active !== undefined) updateData.is_active = is_active;

    // If setting this timezone as active, deactivate all others
    if (is_active === true) {
      await knex("timezone_settings").update({ is_active: false });
      updateData.is_active = true;
    }

    const updatedRows = await knex("timezone_settings").where("id", id).update(updateData);

    if (updatedRows) {
      const changeLog = {
        old: {},
        new: {},
      };

      for (const key in updateData) {
        if (updateData.hasOwnProperty(key)) {
          changeLog.old[key] = currentData[key];
          changeLog.new[key] = updateData[key];
        }
      }

      await logChange(token, "timezone_settings", "UPDATE", id, changeLog);

      // Clear the timezone cache when settings are updated
      clearTimezoneCache();

      res.status(200).json({
        message: "Timezone updated successfully",
      });
    } else {
      res.status(404).json({ error: "Timezone not found" });
    }
  } catch (error) {
    console.error("Error updating timezone:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.delete("/timezone/:id", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { id } = req.params;

    const timezoneDetails = await knex("timezone_settings").where("id", id).first();

    if (!timezoneDetails) {
      return res.status(404).json({ error: "Timezone not found" });
    }

    const deletedCount = await knex("timezone_settings").where("id", id).delete();

    if (deletedCount === 0) {
      return res.status(404).json({ error: "Timezone could not be deleted" });
    }

    const changes = {
      deleted_timezone: timezoneDetails,
    };
    await logChange(token, "timezone_settings", "DELETE", id, changes);

    res.status(200).json({ message: "Timezone deleted successfully" });
  } catch (error) {
    console.error("Error deleting timezone:", error);
    res.status(500).json({
      error: "Error deleting timezone.",
      details: error.message,
    });
  }
});

export default router;
