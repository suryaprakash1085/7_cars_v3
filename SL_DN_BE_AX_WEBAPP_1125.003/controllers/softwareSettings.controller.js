import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";

const knex = knexLib(knexConfig);

export async function createCompanyDetails(req, res) {
  try {
    const { company_code, company_gst, company_name, company_phone_number, pr_limit_config, logo, background_image } = req.body;

    const [id] = await knex("company_details").insert({
      company_code,
      company_gst,
      company_name,
      company_phone_number,
      pr_limit_config,
      logo,
      background_image,
    });

    res.status(201).json({ id, message: "Company details created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error creating company details", details: error.message });
  }
}

export async function getAllCompanyDetails(req, res) {
  try {
    const details = await knex("company_details").select("*");
    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: "Error fetching company details", details: error.message });
  }
}

export async function getAllCompanyCodes(req, res) {
  try {
    const companyCodes = await knex("company_details")
      .select("company_code", "company_name")
      .whereNotNull("company_code")
      .orderBy("company_code");

    res.status(200).json(companyCodes);
  } catch (error) {
    res.status(500).json({ error: "Error fetching company codes", details: error.message });
  }
}

export async function updateCompanyDetails(req, res) {
  try {
    const { id } = req.params;
    const updatedRows = await knex("company_details").where({ id }).update(req.body);
    if (updatedRows === 0) {
      return res.status(404).json({ error: "Company details not found" });
    }
    res.status(200).json({ message: "Company details updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating company details", details: error.message });
  }
}

export async function createService(req, res) {
  try {
    const { service_name } = req.body;
    const [id] = await knex("service_type").insert({ service_name });
    res.status(201).json({ id, service_name });
  } catch (error) {
    res.status(500).json({ error: "Error creating service", details: error.message });
  }
}

export async function getAllServices(req, res) {
  try {
    const services = await knex("service_type").select("*");
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ error: "Error fetching services", details: error.message });
  }
}

export async function deleteService(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { id } = req.params;
    const serviceDetails = await knex("service_type").where({ id }).first();

    if (!serviceDetails) {
      return res.status(404).json({ error: "Service not found" });
    }

    const deletedRows = await knex("service_type").where({ id }).del();

    if (deletedRows === 0) {
      return res.status(404).json({ error: "Service could not be deleted" });
    }

    await logChange(token, "service_type", "DELETE", id, serviceDetails);
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting service", details: error.message });
  }
}

export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const updatedRows = await knex("service_type").where({ id }).update(req.body);
    if (updatedRows === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.status(200).json({ message: "Service updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating service", details: error.message });
  }
}

export async function createExpenseType(req, res) {
  try {
    const [id] = await knex("expenses_type").insert(req.body);
    res.status(201).json({ id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: "Error creating expense type", details: error.message });
  }
}

export async function getAllExpenseTypes(req, res) {
  try {
    const expenses = await knex("expenses_type").select("*");
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Error fetching expense types", details: error.message });
  }
}

export async function deleteExpenseType(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { id } = req.params;
    const expenseDetails = await knex("expenses_type").where({ id }).first();

    if (!expenseDetails) {
      return res.status(404).json({ error: "Expense type not found" });
    }

    const deletedRows = await knex("expenses_type").where({ id }).del();

    if (deletedRows === 0) {
      return res.status(404).json({ error: "Expense type could not be deleted" });
    }

    await logChange(token, "expenses_type", "DELETE", id, expenseDetails);
    res.status(200).json({ message: "Expense type deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting expense type", details: error.message });
  }
}

export async function updateExpenseType(req, res) {
  try {
    const { id } = req.params;
    const updatedRows = await knex("expenses_type").where({ id }).update(req.body);
    if (updatedRows === 0) {
      return res.status(404).json({ error: "Expense type not found" });
    }
    res.status(200).json({ message: "Expense type updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating expense type", details: error.message });
  }
}

export async function createNumberRange(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const [id] = await knex("number_range").insert(req.body);
    await logChange(token, "number_range", "INSERT", id, req.body);
    res.status(201).json({ id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: "Error creating number range", details: error.message });
  }
}

/**
 * Get all number ranges (optionally filtered by company code)
 */
export async function getAllNumberRanges(req, res) {
  try {
    const { company_code } = req.query;

    let query = knex("number_range").select("*");

    // Filter by company_code if provided
    if (company_code) {
      query = query.where({ company_code });
    }

    const ranges = await query;
    res.status(200).json({ number_range: ranges });
  } catch (error) {
    res.status(500).json({ error: "Error fetching number ranges", details: error.message });
  }
}

export async function updateNumberRange(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const { id } = req.params;
    const currentData = await knex("number_range").where({ id }).first();

    if (!currentData) {
      return res.status(404).json({ error: "Number range not found" });
    }

    const changes = {};
    for (const key in req.body) {
      if (currentData[key] !== req.body[key]) {
        changes[key] = { old: currentData[key], new: req.body[key] };
      }
    }

    if (Object.keys(changes).length > 0) {
      await logChange(token, "number_range", "UPDATE", id, changes);
    }

    const updatedRows = await knex("number_range").where({ id }).update(req.body);
    if (updatedRows === 0) {
      return res.status(404).json({ error: "Number range not found" });
    }
    res.status(200).json({ message: "Number range updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating number range", details: error.message });
  }
}

export async function deleteNumberRange(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token is missing" });
  }

  try {
    const { id } = req.params;
    const rangeDetails = await knex("number_range").where({ id }).first();

    if (!rangeDetails) {
      return res.status(404).json({ error: "Number range not found" });
    }

    const deletedRows = await knex("number_range").where({ id }).del();

    if (deletedRows === 0) {
      return res.status(404).json({ error: "Number range could not be deleted" });
    }

    await logChange(token, "number_range", "DELETE", id, rangeDetails);
    res.status(200).json({ message: "Number range deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting number range", details: error.message });
  }
}
