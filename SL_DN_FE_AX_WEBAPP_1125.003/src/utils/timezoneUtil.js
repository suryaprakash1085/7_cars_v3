"use client";

import { useState, useEffect, useCallback } from "react";

let cachedTimezone = null;
let lastCacheFetch = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000;

export async function getActiveTimezone(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedTimezone != null && now - lastCacheFetch < CACHE_DURATION_MS) {
    return cachedTimezone;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/ss/timezone`,
      {
        headers: {
          Authorization: `Bearer ${typeof document !== 'undefined' ? getCookie('token') : ''}`,
        },
      }
    );
    const data = await response.json();
    const active = data.timezones?.find((tz) => tz.is_active);
    if (active) {
      cachedTimezone = active;
      lastCacheFetch = Date.now();
      return active;
    }
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

export function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
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

/**
 * Wall-calendar day in app offset, shifted by dayDelta from baseInstant (same semantics as backend).
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

/** YYYY-MM-DD string: wall "today" in app tz minus `months` (for default date ranges). */
export function wallYmdMinusMonthsFromNow(timezone, months) {
  if (!timezone?.utc_offset) {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  }
  const end = formatDateInTimezone(new Date(), timezone, "YYYY-MM-DD");
  const [y, mo, da] = end.split("-").map(Number);
  const rolled = new Date(Date.UTC(y, mo - 1 - months, da));
  return `${rolled.getUTCFullYear()}-${String(rolled.getUTCMonth() + 1).padStart(2, "0")}-${String(rolled.getUTCDate()).padStart(2, "0")}`;
}

/** Wall-calendar date in app offset: `baseInstant` plus `months`, formatted (e.g. DD/MM/YYYY). */
export function formatWallDatePlusMonths(timezone, baseInstant, months, format = "DD/MM/YYYY") {
  if (!timezone?.utc_offset) {
    const d = new Date(baseInstant);
    d.setMonth(d.getMonth() + months);
    if (format === "DD/MM/YYYY") {
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }
    return d.toLocaleDateString();
  }
  const ymd = formatDateInTimezone(baseInstant, timezone, "YYYY-MM-DD");
  const [y, mo, d] = ymd.split("-").map(Number);
  const rolled = new Date(Date.UTC(y, mo - 1 + months, d));
  return formatDateInTimezone(rolled, timezone, format);
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** e.g. "May 12" in app timezone wall (for chart axis labels). */
export function formatShortMonthDayInTimezone(date, timezone) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  if (!timezone?.utc_offset) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  const mm = formatDateInTimezone(date, timezone, "MM");
  const dd = formatDateInTimezone(date, timezone, "DD");
  const idx = parseInt(mm, 10) - 1;
  return `${MONTH_SHORT[idx] || "?"} ${parseInt(dd, 10)}`;
}

export function useAppTimezone() {
  const [timezone, setTimezone] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getActiveTimezone().then((tz) => {
      if (!cancelled) setTimezone(tz);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fmtDate = useCallback(
    (value, pattern = "DD/MM/YYYY") => {
      if (value == null || value === "") return "N/A";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "N/A";
      if (!timezone?.utc_offset) return d.toLocaleDateString();
      return formatDateInTimezone(value, timezone, pattern);
    },
    [timezone]
  );

  const fmtTime = useCallback(
    (value, pattern = "HH:mm:ss") => {
      if (!value) return "";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      if (!timezone?.utc_offset) return d.toLocaleTimeString("en-US", { hour12: false });
      return formatDateInTimezone(value, timezone, pattern);
    },
    [timezone]
  );

  const fmtShortMonthDay = useCallback(
    (value) => formatShortMonthDayInTimezone(value, timezone),
    [timezone]
  );

  return { timezone, fmtDate, fmtTime, fmtShortMonthDay };
}

export async function displayDateInAppTimezone(date, customFormat = "DD/MM/YYYY HH:mm") {
  const timezone = await getActiveTimezone();
  if (!timezone) {
    return new Date(date).toLocaleString();
  }
  return formatDateInTimezone(date, timezone, convertFormatToDayjs(customFormat));
}

function convertFormatToDayjs(format) {
  return format
    .replace("DD", "DD")
    .replace("MM", "MM")
    .replace("YYYY", "YYYY")
    .replace("HH", "HH")
    .replace("mm", "mm")
    .replace("ss", "ss");
}
