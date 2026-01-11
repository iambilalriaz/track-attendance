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

  // Count leaves by checking notes for leave type labels
  const plannedLeaves = records.filter(
    (r) => r.notes?.includes("Planned Leave")
  ).length;
  const unplannedLeaves = records.filter(
    (r) => r.notes?.includes("Unplanned Leave")
  ).length;
  const parentalLeaves = records.filter(
    (r) => r.notes?.includes("Parental Leave")
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
