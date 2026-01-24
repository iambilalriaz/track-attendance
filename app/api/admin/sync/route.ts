import { NextRequest, NextResponse } from "next/server";
import { getAttendanceCollection, formatDateUTC, createUTCNoonDate, getUTCDayRange, getTodayUTC } from "@/lib/db/attendance";
import { getUserSettings } from "@/lib/db/user-settings";
import { getAuthenticatedUser } from "@/lib/auth-api";
import { DayOfWeek } from "@/models/User";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

// Validate API key
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const validApiKey = process.env.ADMIN_API_KEY;

  if (!validApiKey) {
    return false;
  }

  return apiKey === validApiKey;
}

// Check if user is admin via session
async function isSessionAdmin(): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.id || !user?.email) return false;

    const client = await clientPromise;
    const db = client.db("track-attendance");

    // Try ObjectId first, then email
    let dbUser = null;
    if (ObjectId.isValid(user.id)) {
      dbUser = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
    }
    if (!dbUser) {
      dbUser = await db.collection("users").findOne({ email: user.email });
    }

    return dbUser?.isAdminUser === true;
  } catch {
    return false;
  }
}

// Get user email from users collection (userId is the _id as string)
async function getUserEmail(userId: string): Promise<string | null> {
  const client = await clientPromise;
  const db = client.db("track-attendance");

  // Try ObjectId first
  let user = null;
  if (ObjectId.isValid(userId)) {
    user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  }

  return user?.email || null;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - either API key OR session admin
    const hasApiKey = validateApiKey(request);
    const hasSessionAdmin = await isSessionAdmin();

    if (!hasApiKey && !hasSessionAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userIds, year, month } = body;

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "userIds array is required" },
        { status: 400 }
      );
    }

    if (!year || !month) {
      return NextResponse.json(
        { error: "year and month are required" },
        { status: 400 }
      );
    }

    const collection = await getAttendanceCollection();
    const results: Array<{
      userId: string;
      userEmail: string | null;
      synced: number;
      skipped: number;
      syncedDates: string[];
      error?: string;
    }> = [];

    // Process each user
    for (const userId of userIds) {
      try {
        // Get user email from database
        const userEmail = await getUserEmail(userId);

        if (!userEmail) {
          results.push({
            userId,
            userEmail: null,
            synced: 0,
            skipped: 0,
            syncedDates: [],
            error: "User not found",
          });
          continue;
        }

        // Get user settings for default WFH days
        const userSettings = await getUserSettings(userId);
        const defaultWfhDays: DayOfWeek[] = userSettings?.defaultWorkFromHomeDays || [];

        // Get first and last day of the month (using UTC)
        const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
        const firstDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const lastDay = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));

        // Get existing attendance records for the month
        const existingRecords = await collection
          .find({
            userId,
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
        const todayMonth = todayUTC.month + 1;
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
          const isCurrentOrFuture =
            year > todayYear ||
            (year === todayYear && month > todayMonth) ||
            (year === todayYear && month === todayMonth && dayNum >= todayDay);

          if (isCurrentOrFuture) {
            continue;
          }

          const dateStr = formatDateUTC(currentDate);
          const existingRecord = existingByDate.get(dateStr);

          // Skip if already marked
          if (existingRecord && existingRecord.status) {
            skippedDates.push(dateStr);
            continue;
          }

          // Determine status based on default WFH days
          const dayName = dayIndexToName[dayOfWeek];
          const isWfhDay = defaultWfhDays.includes(dayName);
          const status = isWfhDay ? "wfh" : "present";

          // Create date range for this calendar day to avoid duplicates
          const { start: dayStart, end: dayEnd } = getUTCDayRange(year, month - 1, dayNum);

          // Double-check no record exists
          const existsInDb = await collection.findOne({
            userId,
            date: { $gte: dayStart, $lte: dayEnd },
          });

          if (existsInDb) {
            skippedDates.push(dateStr);
            continue;
          }

          // Insert new attendance record
          const dateForDb = createUTCNoonDate(year, month - 1, dayNum);
          const now = new Date();

          await collection.insertOne({
            userId,
            userEmail,
            date: dateForDb,
            status,
            notes: "Synced",
            createdAt: now,
            updatedAt: now,
          });

          syncedDates.push(dateStr);
        }

        results.push({
          userId,
          userEmail,
          synced: syncedDates.length,
          skipped: skippedDates.length,
          syncedDates,
        });
      } catch (userError) {
        results.push({
          userId,
          userEmail: null,
          synced: 0,
          skipped: 0,
          syncedDates: [],
          error: userError instanceof Error ? userError.message : "Unknown error",
        });
      }
    }

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: userIds.length,
        totalSynced,
        totalSkipped,
      },
      results,
    });
  } catch (error) {
    console.error("Error in admin sync:", error);
    return NextResponse.json(
      { error: "Failed to sync attendance" },
      { status: 500 }
    );
  }
}
