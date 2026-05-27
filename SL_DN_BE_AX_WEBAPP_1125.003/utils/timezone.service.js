import knexLib from "knex";
import knexConfig from "../knexfile.js";

const knex = knexLib(knexConfig);

let cachedTimezone = null;
let lastCacheFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getActiveTimezone(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && cachedTimezone && (now - lastCacheFetch) < CACHE_DURATION) {
    return cachedTimezone;
  }

  try {
    const timezone = await knex("timezone_settings")
      .where({ is_active: true })
      .first();

    if (timezone) {
      cachedTimezone = timezone;
      lastCacheFetch = now;
      return timezone;
    }

    console.warn("No active timezone found in database");
    return null;
  } catch (error) {
    console.error("Error fetching active timezone:", error);
    return cachedTimezone || null;
  }
}

export function clearTimezoneCache() {
  cachedTimezone = null;
  lastCacheFetch = 0;
}

export function parseUTCOffset(utcOffset) {
  const regex = /UTC([+-])(\d{1,2}):?(\d{0,2})/;
  const match = utcOffset.match(regex);

  if (!match) return 0;

  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3] || "0", 10);

  return sign * (hours * 60 + minutes);
}

export function convertToTimezone(date, utcOffset) {
  const dateObj = new Date(date);
  if (!utcOffset || typeof utcOffset !== "string") {
    return dateObj;
  }
  const offsetMinutes = parseUTCOffset(utcOffset);
  const offsetMs = offsetMinutes * 60 * 1000;
  const tzDate = new Date(dateObj.getTime() + offsetMs);
  return tzDate;
}

export function convertFromTimezone(dateString, utcOffset) {
  const dateObj = new Date(dateString);
  if (!utcOffset || typeof utcOffset !== "string") {
    return dateObj;
  }
  const offsetMinutes = parseUTCOffset(utcOffset);
  const offsetMs = offsetMinutes * 60 * 1000;
  const utcDate = new Date(dateObj.getTime() - offsetMs);
  return utcDate;
}

export function getCurrentTimeInTimezone(timezone) {
  if (!timezone || !timezone.utc_offset) {
    return new Date();
  }
  return convertToTimezone(new Date(), timezone.utc_offset);
}

export function formatDateInTimezone(date, timezone, format = "YYYY-MM-DD HH:mm:ss") {
  if (!timezone || !timezone.utc_offset) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const da = String(d.getUTCDate()).padStart(2, "0");
    const h = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    const s = String(d.getUTCSeconds()).padStart(2, "0");
    return format
      .replace("YYYY", y)
      .replace("MM", mo)
      .replace("DD", da)
      .replace("HH", h)
      .replace("mm", mi)
      .replace("ss", s);
  }

  const tzDate = convertToTimezone(date, timezone.utc_offset);

  const year = tzDate.getUTCFullYear();
  const month = String(tzDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(tzDate.getUTCDate()).padStart(2, "0");
  const hours = String(tzDate.getUTCHours()).padStart(2, "0");
  const minutes = String(tzDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(tzDate.getUTCSeconds()).padStart(2, "0");

  return format
    .replace("YYYY", year)
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

export async function insertWithTimezone(tableName, data, timezone) {
  if (!timezone || !timezone.utc_offset) {
    return knex(tableName).insert(data);
  }

  const enrichedData = { ...data };

  // Convert any date fields to UTC for storage
  const dateFields = ["created_at", "updated_at", "date", "appointment_date", "invoice_date"];
  for (const field of dateFields) {
    if (enrichedData[field]) {
      const utcDate = convertFromTimezone(enrichedData[field], timezone.utc_offset);
      enrichedData[field] = utcDate.toISOString();
    }
  }

  return knex(tableName).insert(enrichedData);
}

export async function updateWithTimezone(tableName, whereClause, data, timezone) {
  if (!timezone || !timezone.utc_offset) {
    return knex(tableName).where(whereClause).update(data);
  }

  const enrichedData = { ...data };
  const dateFields = ["updated_at", "date", "appointment_date", "invoice_date"];

  for (const field of dateFields) {
    if (enrichedData[field]) {
      const utcDate = convertFromTimezone(enrichedData[field], timezone.utc_offset);
      enrichedData[field] = utcDate.toISOString();
    }
  }

  return knex(tableName).where(whereClause).update(enrichedData);
}

/**
 * Current instant in UTC (same semantics as legacy `new Date()` for DB timestamps).
 * Use formatDateInTimezone(new Date(), timezone, ...) for calendar strings in the app timezone.
 */
export function getCurrentDateInTimezone(timezone) {
  return new Date();
}

export function getTodayUTCInTimezone(timezone) {
  if (!timezone || !timezone.utc_offset) {
    return getTodayUTC();
  }
  const tzWall = convertToTimezone(new Date(), timezone.utc_offset);
  return new Date(Date.UTC(tzWall.getUTCFullYear(), tzWall.getUTCMonth(), tzWall.getUTCDate())).toISOString();
}

export function getTodayUTC() {
  return new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())).toISOString();
}

export function dateToUTC(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Wall-calendar day in the active offset, shifted by dayDelta from baseInstant, then formatted.
 * Matches telecall scheduledDate keys like DD-MM-YYYY (use format "DD-MM-YYYY").
 */
export function formatCalendarWallPlusDays(timezone, baseInstant, dayDelta, format) {
  const tz =
    timezone && timezone.utc_offset
      ? timezone
      : { utc_offset: "UTC+0:00" };
  const wall = convertToTimezone(new Date(baseInstant), tz.utc_offset);
  const y = wall.getUTCFullYear();
  const mo = wall.getUTCMonth();
  const da = wall.getUTCDate();
  const rolled = new Date(Date.UTC(y, mo, da + dayDelta, 12, 0, 0));
  return formatDateInTimezone(rolled, tz, format);
}
