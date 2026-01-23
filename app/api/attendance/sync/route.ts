import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-api";
import { getAttendanceCollection, formatDateUTC, createUTCNoonDate, getUTCDayRange, getTodayUTC } from "@/lib/db/attendance";
import { getUserSettings } from "@/lib/db/user-settings";
import { DayOfWeek } from "@/models/User";

// Map day index to day name
const dayIndexToName: Record<number, DayOfWeek> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { year, month } = body;

    if (!year || !month) {
      return NextResponse.json(
        { error: "Year and month are required" },
        { status: 400 }
      );
    }

    // Get user settings for default WFH days
    const userSettings = await getUserSettings(user.id);
    const defaultWfhDays: DayOfWeek[] = userSettings?.defaultWorkFromHomeDays || [];

    const collection = await getAttendanceCollection();

    // Get first and last day of the month (using UTC)
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const firstDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const lastDay = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));

    // Get existing attendance records for the month
    const existingRecords = await collection
      .find({
        userId: user.id,
        date: { $gte: firstDay, $lte: lastDay },
      })
      .toArray();

    // Create a map of existing records by date string using UTC formatting
    const existingByDate = new Map(
      existingRecords.map((r) => [formatDateUTC(new Date(r.date)), r])
    );

    // Track synced dates
    const syncedDates: string[] = [];
    const skippedDates: string[] = [];

    // Get today's date for comparison using UTC
    const todayUTC = getTodayUTC();
    const todayYear = todayUTC.year;
    const todayMonth = todayUTC.month + 1; // Convert to 1-indexed month
    const todayDay = todayUTC.day;

    // Iterate through each day of the month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      // Use UTC date for day of week calculation
      const currentDate = new Date(Date.UTC(year, month - 1, dayNum, 12, 0, 0, 0));
      const dayOfWeek = currentDate.getUTCDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      // Skip today and future dates - only sync past dates
      // Compare using year, month, day directly to avoid timezone issues
      const isCurrentOrFuture =
        year > todayYear ||
        (year === todayYear && month > todayMonth) ||
        (year === todayYear && month === todayMonth && dayNum >= todayDay);

      if (isCurrentOrFuture) {
        continue;
      }

      const dateStr = formatDateUTC(currentDate);
      const existingRecord = existingByDate.get(dateStr);

      // Skip if already marked (present, wfh, or absent/leave)
      if (existingRecord && existingRecord.status) {
        skippedDates.push(dateStr);
        continue;
      }

      // Determine status based on default WFH days
      const dayName = dayIndexToName[dayOfWeek];
      const isWfhDay = defaultWfhDays.includes(dayName);
      const status = isWfhDay ? "wfh" : "present";

      // Create date range for this calendar day to avoid duplicates (using UTC)
      const { start: dayStart, end: dayEnd } = getUTCDayRange(year, month - 1, dayNum);

      // Double-check no record exists for this date using date range query
      const existsInDb = await collection.findOne({
        userId: user.id,
        date: { $gte: dayStart, $lte: dayEnd },
      });

      if (existsInDb) {
        skippedDates.push(dateStr);
        continue;
      }

      // Insert new attendance record (not upsert to avoid duplicates)
      // Use UTC noon to ensure consistent timezone handling
      const dateForDb = createUTCNoonDate(year, month - 1, dayNum);
      const now = new Date();

      await collection.insertOne({
        userId: user.id,
        userEmail: user.email,
        date: dateForDb,
        status,
        notes: "Synced",
        createdAt: now,
        updatedAt: now,
      });

      syncedDates.push(dateStr);
    }

    return NextResponse.json({
      success: true,
      synced: syncedDates.length,
      skipped: skippedDates.length,
      syncedDates,
      message: `Synced ${syncedDates.length} dates, skipped ${skippedDates.length} already marked dates`,
    });
  } catch (error) {
    console.error("Error syncing attendance:", error);
    return NextResponse.json(
      { error: "Failed to sync attendance" },
      { status: 500 }
    );
  }
}
