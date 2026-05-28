import knexLib from "knex";
import knexConfig from "../knexfile.js";
import logChange from "../middleware/changeLog.js";

function getTzFormattedDate(req) {
  if (req?.tzHelpers) {
    return req.tzHelpers.format(new Date(), "DD/MM/YYYY");
  }
  const tzDate = new Date();
  return `${String(tzDate.getUTCDate()).padStart(2, "0")}/${String(tzDate.getUTCMonth() + 1).padStart(2, "0")}/${tzDate.getUTCFullYear()}`;
}

const knex = knexLib(knexConfig);

export async function createWorkSchedule(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const enddate = "9999-12-31";
    const { description, days, time, type, startdate, id } = req.body;

    const postData = { description, days, time, type, startdate, enddate };

    const [newSchedule] = await knex("work_schedules")
      .insert(postData)
      .returning("*");

    await logChange(token, "work_schedules", "INSERT", id, postData);

    res.status(201).json({
      message: "Work schedule created successfully",
      schedule: newSchedule,
    });
  } catch (error) {
    console.error("Error creating work schedule:", error);
    res.status(500).json({
      error: "Error creating work schedule",
      details: error.message,
    });
  }
}

export async function getAllWorkSchedules(req, res) {
  try {
    const schedules = await knex("work_schedules").select("*");
    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching work schedules:", error);
    res.status(500).json({
      error: "Error fetching work schedules",
      details: error.message,
    });
  }
}

export async function getWorkScheduleById(req, res) {
  try {
    const { id } = req.params;
    const schedule = await knex("work_schedules").where({ id }).first();

    if (!schedule) {
      return res.status(404).json({ error: "Work schedule not found" });
    }

    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching work schedule:", error);
    res.status(500).json({
      error: "Error fetching work schedule",
      details: error.message,
    });
  }
}

export async function updateWorkSchedule(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const { id } = req.params;
    const { description, days, time, type, startdate } = req.body;
    const newData = { description, days, time, type, startdate };

    const currentSchedule = await knex("work_schedules").where({ id }).first();
    if (!currentSchedule) {
      return res.status(404).json({ error: "Work schedule not found" });
    }

    const formattedDate = getTzFormattedDate(req);

    const changes = {};
    for (const key in newData) {
      if (currentSchedule[key] !== newData[key]) {
        changes[key] = {
          old: currentSchedule[key],
          new: newData[key],
        };
      }
    }

    await knex("work_schedules")
      .where({ id })
      .update({ enddate: formattedDate });

    const enddate = "9999-12-31";
    const [updatedSchedule] = await knex("work_schedules")
      .insert({ ...newData, startdate, enddate })
      .returning("*");

    if (Object.keys(changes).length > 0) {
      await logChange(token, "work_schedules", "UPDATE", id, changes);
    }

    res.status(200).json({
      message: "Work schedule updated successfully",
      schedule: updatedSchedule,
    });
  } catch (error) {
    console.error("Error updating work schedule:", error);
    res.status(500).json({
      error: "Error updating work schedule",
      details: error.message,
    });
  }
}

export async function deleteWorkSchedule(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const { id } = req.params;
    const schedule = await knex("work_schedules").where({ id }).first();

    if (!schedule) {
      return res.status(404).json({ error: "Work schedule not found" });
    }

    await knex("work_schedules").where({ id }).del();

    await logChange(token, "work_schedules", "DELETE", id, schedule);

    res.status(200).json({ message: "Work schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting work schedule:", error);
    res.status(500).json({
      error: "Error deleting work schedule",
      details: error.message,
    });
  }
}


export async function getWorkReport (req, res)  {
  const reports = await knex("work_reports").select("*");
  res.status(200).json(reports);
};


export async function updateWorkReport (req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token is required" });
  }

  try {
    const newId = await knex("work_reports").max("id as maxId").first();
    const uniqueId = newId.maxId + 1;
    const enddate = "9999-12-31";
    const {
      user_id,
      shift_type,
      startdate,
      description,
      time,
      days,
      name,
      phone,
      editdate,
    } = req.body;

    // Fetch the current report for the same shift_type (if it exists)
    const currentReport = await knex("work_reports")
      .where({ shift_type })
      .andWhere({ enddate: "9999-12-31" })
      .first();

    // Compare current data with new data
    const newData = {
      user_id,
      shift_type,
      startdate,
      description,
      time,
      days,
      name,
      phone,
      editdate,
      enddate,
    };

    const changes = {};
    if (currentReport) {
      for (const key in newData) {
        if (currentReport[key] !== newData[key]) {
          changes[key] = {
            old: currentReport[key],
            new: newData[key],
          };
        }
      }

      // Log changes if there are any
      if (Object.keys(changes).length > 0) {
        await logChange(
          token,
          "work_reports",
          "UPDATE",
          currentReport.id,
          changes
        );
      }

      // Update the enddate for the existing record
      const formattedDate = getTzFormattedDate(req);

      await knex("work_reports")
        .where({ id: currentReport.id })
        .update({ enddate: formattedDate });
    }

    // Insert a new record
    const [newReport] = await knex("work_reports")
      .insert({
        id: uniqueId,
        user_id,
        shift_type,
        startdate,
        description,
        time,
        days,
        name,
        phone,
        editdate,
        enddate,
      })
      .returning("*");

    res
      .status(201)
      .json({ message: "Work report created successfully", report: newReport });
  } catch (error) {
    console.error("Error creating work report:", error.message);
    res.status(500).json({
      error: "Failed to create work report",
      details: error.message,
    });
  }
};

