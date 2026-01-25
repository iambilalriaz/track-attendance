import { NextRequest, NextResponse } from "next/server";
import { getAttendanceCollection, getTodayUTC } from "@/lib/db/attendance";
import { getUserSettings } from "@/lib/db/user-settings";
import { getAuthenticatedUser } from "@/lib/auth-api";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Check if user is admin via session
async function isSessionAdmin(): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.id || !user?.email) return false;

    const client = await clientPromise;
    const db = client.db("track-attendance");

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

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isSessionAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("track-attendance");
    const attendanceCollection = await getAttendanceCollection();

    // Get user info
    let user = null;
    if (ObjectId.isValid(userId)) {
      user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    }
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user settings
    const userSettings = await getUserSettings(userId);

    // Get current year
    const today = getTodayUTC();
    const currentYear = today.year;

    // Get all attendance records for the year
    const firstDay = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
    const lastDay = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));

    const records = await attendanceCollection
      .find({
        userId,
        date: { $gte: firstDay, $lte: lastDay },
      })
      .sort({ date: -1 })
      .toArray();

    // Calculate yearly stats
    const yearlyStats = {
      present: 0,
      wfh: 0,
      leave: 0,
    };

    // Monthly breakdown
    const monthlyBreakdown: Array<{
      month: number;
      name: string;
      present: number;
      wfh: number;
      leave: number;
    }> = [];

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    for (let m = 0; m < 12; m++) {
      const monthRecords = records.filter((r) => {
        const date = new Date(r.date);
        return date.getUTCMonth() === m;
      });

      const monthStats = {
        month: m + 1,
        name: monthNames[m],
        present: monthRecords.filter((r) => r.status === "present").length,
        wfh: monthRecords.filter((r) => r.status === "wfh").length,
        leave: monthRecords.filter((r) => r.status === "leave" || r.status === "absent" || r.status === "planned-leave" || r.status === "unplanned-leave" || r.status === "parental-leave").length,
      };

      monthlyBreakdown.push(monthStats);

      yearlyStats.present += monthStats.present;
      yearlyStats.wfh += monthStats.wfh;
      yearlyStats.leave += monthStats.leave;
    }

    // Calculate leave breakdown by type
    const leaveRecords = records.filter((r) =>
      r.status === "absent" || r.status === "leave" ||
      r.status === "planned-leave" || r.status === "unplanned-leave" || r.status === "parental-leave"
    );
    const leaveBreakdown = {
      planned: leaveRecords.filter((r) => r.notes?.includes("Planned Leave") && !r.notes?.includes("Unpaid Leave")).length,
      unplanned: leaveRecords.filter((r) => r.notes?.includes("Unplanned Leave") && !r.notes?.includes("Unpaid Leave")).length,
      parental: leaveRecords.filter((r) => r.notes?.includes("Parental Leave") && !r.notes?.includes("Unpaid Leave")).length,
      unpaid: leaveRecords.filter((r) => r.notes?.includes("Unpaid Leave")).length,
    };

    // Get recent activity (last 10 records)
    const recentActivity = records.slice(0, 10).map((r) => {
      const date = new Date(r.date);
      return {
        date: date.toISOString().split("T")[0],
        status: r.status,
        notes: r.notes || null,
      };
    });

    // Calculate work pattern (which days they typically WFH)
    const dayPattern: Record<string, { total: number; wfh: number; present: number }> = {
      Monday: { total: 0, wfh: 0, present: 0 },
      Tuesday: { total: 0, wfh: 0, present: 0 },
      Wednesday: { total: 0, wfh: 0, present: 0 },
      Thursday: { total: 0, wfh: 0, present: 0 },
      Friday: { total: 0, wfh: 0, present: 0 },
    };

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (const record of records) {
      const date = new Date(record.date);
      const dayOfWeek = date.getUTCDay();
      const dayName = dayNames[dayOfWeek];

      if (dayName !== "Sunday" && dayName !== "Saturday") {
        dayPattern[dayName].total++;
        if (record.status === "wfh") dayPattern[dayName].wfh++;
        if (record.status === "present") dayPattern[dayName].present++;
      }
    }

    // Leave quotas
    const leaveQuotas = {
      planned: { quota: userSettings?.leaveQuota?.planned || 15, used: leaveBreakdown.planned },
      unplanned: { quota: userSettings?.leaveQuota?.unplanned || 10, used: leaveBreakdown.unplanned },
      parental: { quota: userSettings?.leaveQuota?.parentalLeave || 0, used: leaveBreakdown.parental },
    };

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name || null,
        email: user.email,
        image: user.image || null,
        isAdmin: user.isAdminUser === true,
      },
      year: currentYear,
      yearlyStats,
      monthlyBreakdown,
      leaveBreakdown,
      leaveQuotas,
      dayPattern,
      recentActivity,
      settings: {
        defaultWorkFromHomeDays: userSettings?.defaultWorkFromHomeDays || [],
      },
    });
  } catch (error) {
    console.error("Error fetching user metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch user metrics" },
      { status: 500 }
    );
  }
}
