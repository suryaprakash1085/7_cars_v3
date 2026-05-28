import { getActiveTimezone, getCurrentDateInTimezone, getTodayUTCInTimezone, formatDateInTimezone, dateToUTC, getTodayUTC, formatCalendarWallPlusDays } from "../utils/timezone.service.js";

export default async function timezoneMiddleware(req, res, next) {
  try {
    const timezone = await getActiveTimezone();
    req.timezone = timezone;
    req.tzHelpers = {
      getActiveTimezone: () => timezone,
      getCurrentDate: () => getCurrentDateInTimezone(timezone),
      getTodayUTC: () => getTodayUTCInTimezone(timezone),
      format: (date, format) => formatDateInTimezone(date, timezone, format),
      formatCalendarPlusDays: (dayDelta, format) =>
        formatCalendarWallPlusDays(timezone, new Date(), dayDelta, format),
      dateToUTC,
    };
    next();
  } catch (error) {
    console.error("Error loading timezone in middleware:", error);
    const neutralTz = { utc_offset: "UTC+0:00" };
    req.tzHelpers = {
      getActiveTimezone: () => null,
      getCurrentDate: () => new Date(),
      getTodayUTC: () => getTodayUTC(),
      format: (date, formatStr) => formatDateInTimezone(date, neutralTz, formatStr),
      formatCalendarPlusDays: (dayDelta, formatStr) =>
        formatCalendarWallPlusDays(null, new Date(), dayDelta, formatStr),
      dateToUTC,
    };
    next();
  }
}
