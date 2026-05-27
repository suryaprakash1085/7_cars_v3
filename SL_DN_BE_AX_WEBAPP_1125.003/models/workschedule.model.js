import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

export async function createWorkSchedule(scheduleData) {
  return knex("work_schedules").insert(scheduleData);
}

export async function getAllWorkSchedules() {
  return knex("work_schedules").select("*");
}

export async function getWorkScheduleById(scheduleId) {
  return knex("work_schedules").where({ id: scheduleId }).first();
}

export async function updateWorkSchedule(scheduleId, updateData) {
  return knex("work_schedules").where({ id: scheduleId }).update(updateData);
}

export async function endWorkSchedule(scheduleId, enddate) {
  return knex("work_schedules")
    .where({ id: scheduleId })
    .update({ enddate: enddate || new Date().toISOString().split("T")[0] });
}

export async function deleteWorkSchedule(scheduleId) {
  return knex("work_schedules").where({ id: scheduleId }).del();
}

export async function createWorkReport(reportData) {
  return knex("work_reports").insert(reportData);
}

export async function getAllWorkReports() {
  return knex("work_reports").select("*");
}

export async function getWorkReportById(reportId) {
  return knex("work_reports").where({ id: reportId }).first();
}

export async function updateWorkReport(reportId, updateData) {
  return knex("work_reports").where({ id: reportId }).update(updateData);
}
