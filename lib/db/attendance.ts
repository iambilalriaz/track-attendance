import clientPromise from "../mongodb";
import { Attendance, AttendanceStats, LeaveStats } from "@/models/Attendance";
import { getUserSettings } from "./user-settings";

// ============================================================================
// UTC Date Utility Functions - All dates should be normalized to UTC noon (12:00)
// ============================================================================

/**
 * Normalizes a date to UTC noon (12:00:00.000) for consistent storage.
 * This ensures all dates for the same calendar day are stored with the same time.
 */
export function normalizeToUTCNoon(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
}

/**
 * Creates UTC noon date from year, month (0-indexed), day components.
 */
export function createUTCNoonDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
}

/**
 * Gets the UTC date range for a specific day (start of day to end of day).
 * Used for querying records that fall on a specific calendar day.
 */
export function getUTCDayRange(year: number, month: number, day: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, month, day, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, month, day, 23, 59, 59, 999)),
  };
}

/**
 * Gets today's date components in UTC.
 */
export function getTodayUTC(): { year: number; month: number; day: number; dayOfWeek: number } {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
    day: now.getUTCDate(),
    dayOfWeek: now.getUTCDay(),
  };
}

/**
 * Formats a UTC date as YYYY-MM-DD string.
 */
export function formatDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ============================================================================

export async function getAttendanceCollection() {
  const client = await clientPromise;
  const db = client.db("track-attendance");
  return db.collection<Attendance>("attendance");
}

export async function getMonthlyStats(
  userId: string,
  year: number,
  month: number
): Promise<AttendanceStats> {
  const collection = await getAttendanceCollection();

  // Get first and last day of the month using UTC
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const lastDay = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));

  // Get all attendance records for the month
  const allRecords = await collection
    .find({
      userId,
      date: { $gte: firstDay, $lte: lastDay },
    })
    .toArray();

  // Filter out weekend records (only count weekdays)
  const records = allRecords.filter((r) => {
    const dayOfWeek = new Date(r.date).getUTCDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sunday (0) and Saturday (6)
  });

  // Calculate weekdays in the month (excluding weekends)
  const weekdays = getWeekdaysInMonth(year, month);

  // Count different types
  const workFromOffice = records.filter((r) => r.status === "present").length;
  const workFromHome = records.filter((r) => r.status === "wfh").length;
  const absentDays = records.filter((r) => r.status === "absent").length;

  const totalWorkingDays = workFromOffice + workFromHome;

  // Attendance rate = (working days / total weekdays) * 100
  const attendanceRate =
    weekdays > 0 ? Math.round((totalWorkingDays / weekdays) * 100) : 0;

  // Check today's status using UTC
  const todayUTC = getTodayUTC();
  const todayRecord = records.find((r) => {
    const recordDate = new Date(r.date);
    return (
      recordDate.getUTCFullYear() === todayUTC.year &&
      recordDate.getUTCMonth() === todayUTC.month &&
      recordDate.getUTCDate() === todayUTC.day
    );
  });

  return {
    totalWorkingDays,
    workFromOffice,
    workFromHome,
    absentDays,
    attendanceRate,
    todayStatus: todayRecord?.status,
  };
}

export async function getLeaveStats(
  userId: string,
  year: number
): Promise<LeaveStats> {
  const collection = await getAttendanceCollection();

  // Get user's leave quota from settings
  const userSettings = await getUserSettings(userId);
  const plannedLeaveQuota = userSettings?.leaveQuota?.planned || 15;
  const unplannedLeaveQuota = userSettings?.leaveQuota?.unplanned || 10;
  const parentalLeaveQuota = userSettings?.leaveQuota?.parentalLeave || 0;

  // Get all leave records for the year using UTC
  const firstDay = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const lastDay = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  // Get all absent records (leaves are marked as absent with specific notes)
  const records = await collection
    .find({
      userId,
      date: { $gte: firstDay, $lte: lastDay },
      status: "absent",
    })
    .toArray();

  // Count unpaid leaves separately (these don't count towards quota)
  const unpaidLeaves = records.filter(
    (r) => r.notes?.includes("Unpaid Leave")
  ).length;

  // Count paid leaves by checking notes for leave type labels (excluding unpaid)
  const plannedLeaves = records.filter(
    (r) => r.notes?.includes("Planned Leave") && !r.notes?.includes("Unpaid Leave")
  ).length;
  const unplannedLeaves = records.filter(
    (r) => r.notes?.includes("Unplanned Leave") && !r.notes?.includes("Unpaid Leave")
  ).length;
  const parentalLeaves = records.filter(
    (r) => r.notes?.includes("Parental Leave") && !r.notes?.includes("Unpaid Leave")
  ).length;

  const usedLeaves = plannedLeaves + unplannedLeaves + parentalLeaves;

  const totalQuota = plannedLeaveQuota + unplannedLeaveQuota + parentalLeaveQuota;
  const remainingLeaves = Math.max(0, totalQuota - usedLeaves);

  return {
    totalLeaves: usedLeaves,
    remainingLeaves,
    usedLeaves,
    plannedLeaves,
    unplannedLeaves,
    parentalLeaves,
    unpaidLeaves,
    plannedLeaveQuota,
    unplannedLeaveQuota,
    parentalLeaveQuota,
  };
}

export async function markAttendance(
  userId: string,
  userEmail: string,
  date: Date,
  status: Attendance["status"],
  notes?: string
): Promise<Attendance> {
  const collection = await getAttendanceCollection();

  // Extract year, month, day from the input date using UTC methods
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  // Create UTC noon date for consistent storage
  const normalizedDate = createUTCNoonDate(year, month, day);

  // Create date range for finding existing records (any time on this calendar day)
  const { start: dayStart, end: dayEnd } = getUTCDayRange(year, month, day);

  // Check if attendance already exists for this date using date range
  const existing = await collection.findOne({
    userId,
    date: { $gte: dayStart, $lte: dayEnd },
  });

  const now = new Date();

  if (existing) {
    // Update existing record
    await collection.updateOne(
      { _id: existing._id },
      {
        $set: {
          status,
          notes,
          updatedAt: now,
        },
      }
    );

    return {
      ...existing,
      status,
      notes,
      updatedAt: now,
    };
  } else {
    // Create new record
    const newRecord: Attendance = {
      userId,
      userEmail,
      date: normalizedDate,
      status,
      notes,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newRecord as any);
    return {
      ...newRecord,
      _id: result.insertedId,
    };
  }
}

export async function getTodayAttendance(
  userId: string
): Promise<Attendance | null> {
  const collection = await getAttendanceCollection();

  // Use UTC methods for today's date
  const { year, month, day } = getTodayUTC();

  // Use date range to find any record for today regardless of stored time
  const { start: dayStart, end: dayEnd } = getUTCDayRange(year, month, day);

  return await collection.findOne({
    userId,
    date: { $gte: dayStart, $lte: dayEnd },
  });
}

// Helper function to count weekdays in a month (excluding Saturdays and Sundays)
function getWeekdaysInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  let weekdayCount = 0;

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      weekdayCount++;
    }
  }

  return weekdayCount;
}

// Helper to convert day number to day name
function getDayName(dayNumber: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayNumber];
}

// Check for existing attendance records in a date range (excluding weekends)
export async function getExistingAttendanceInRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{ date: Date; status: string }[]> {
  const collection = await getAttendanceCollection();

  // Use UTC methods for consistent querying
  const start = new Date(Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
    0, 0, 0, 0
  ));

  const end = new Date(Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
    23, 59, 59, 999
  ));

  const records = await collection
    .find({
      userId,
      date: { $gte: start, $lte: end },
    })
    .toArray();

  return records.map((r) => ({
    date: r.date,
    status: r.status,
  }));
}

// Auto-mark attendance for today based on user settings
export async function autoMarkTodayAttendance(
  userId: string,
  userEmail: string
): Promise<Attendance | null> {
  // Use UTC methods for consistent date handling
  const { year, month, day, dayOfWeek } = getTodayUTC();

  // Skip weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return null;
  }

  // Check if already marked using date range (consistent with other functions)
  const collection = await getAttendanceCollection();
  const { start: dayStart, end: dayEnd } = getUTCDayRange(year, month, day);

  const existing = await collection.findOne({
    userId,
    date: { $gte: dayStart, $lte: dayEnd },
  });

  if (existing) {
    return existing as Attendance;
  }

  // Get user settings
  const userSettings = await getUserSettings(userId);
  const defaultWfhDays = userSettings?.defaultWorkFromHomeDays || [];

  // Determine status based on default WFH days
  const todayName = getDayName(dayOfWeek);
  const isWfhDay = defaultWfhDays.includes(todayName);

  const status = isWfhDay ? "wfh" : "present";

  // Create UTC noon date for consistent storage
  const dateForDb = createUTCNoonDate(year, month, day);
  const timestamp = new Date();

  // Insert new record directly (avoiding potential race conditions with markAttendance)
  const newRecord: Attendance = {
    userId,
    userEmail,
    date: dateForDb,
    status,
    notes: "Auto-marked",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const result = await collection.insertOne(newRecord as any);
  return {
    ...newRecord,
    _id: result.insertedId,
  };
}
