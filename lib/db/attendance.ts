import clientPromise from "../mongodb";
import { Attendance, AttendanceStats, LeaveStats } from "@/models/Attendance";
import { getUserSettings } from "./user-settings";

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

  // Get first and last day of the month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // Get all attendance records for the month
  const records = await collection
    .find({
      userId,
      date: { $gte: firstDay, $lte: lastDay },
    })
    .toArray();

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

  // Check today's status
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRecord = records.find(
    (r) => new Date(r.date).toDateString() === today.toDateString()
  );

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

  // Get all leave records for the year
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);

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

  // Normalize date to start of day
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  // Check if attendance already exists for this date
  const existing = await collection.findOne({
    userId,
    date: normalizedDate,
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await collection.findOne({
    userId,
    date: today,
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

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();

  // Skip weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return null;
  }

  // Check if already marked
  const existing = await getTodayAttendance(userId);
  if (existing) {
    return existing;
  }

  // Get user settings
  const userSettings = await getUserSettings(userId);
  const defaultWfhDays = userSettings?.defaultWorkFromHomeDays || [];

  // Determine status based on default WFH days
  const todayName = getDayName(dayOfWeek);
  const isWfhDay = defaultWfhDays.includes(todayName);

  const status = isWfhDay ? "wfh" : "present";

  // Auto-mark attendance
  return await markAttendance(userId, userEmail, today, status, "Auto-marked");
}
