import { NextRequest, NextResponse } from "next/server";
import { getAttendanceCollection, formatDateUTC } from "@/lib/db/attendance";
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
    const year = parseInt(searchParams.get("year") || new Date().getUTCFullYear().toString());

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

    // Get user settings for quota
    const userSettings = await getUserSettings(userId);
    const plannedLeaveQuota = userSettings?.leaveQuota?.planned || 15;
    const unplannedLeaveQuota = userSettings?.leaveQuota?.unplanned || 10;
    const parentalLeaveQuota = userSettings?.leaveQuota?.parentalLeave || 0;

    // Get date range for the year
    const firstDay = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const lastDay = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    // Get all leave records for the user this year (status = "absent" or "leave")
    const records = await attendanceCollection
      .find({
        userId,
        date: { $gte: firstDay, $lte: lastDay },
        $or: [{ status: "absent" }, { status: "leave" }],
      })
      .sort({ date: 1 })
      .toArray();

    // Build daily records with leave type info
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const leaveRecords = records.map((r) => {
      const date = new Date(r.date);
      const notes = r.notes || "";

      // Determine leave type from notes
      let leaveType = "Other";
      let isPaid = true;

      if (notes.includes("Unpaid Leave")) {
        isPaid = false;
        if (notes.includes("Planned")) leaveType = "Planned (Unpaid)";
        else if (notes.includes("Unplanned")) leaveType = "Unplanned (Unpaid)";
        else if (notes.includes("Parental")) leaveType = "Parental (Unpaid)";
        else leaveType = "Unpaid";
      } else if (notes.includes("Planned Leave")) {
        leaveType = "Planned";
      } else if (notes.includes("Unplanned Leave")) {
        leaveType = "Unplanned";
      } else if (notes.includes("Parental Leave")) {
        leaveType = "Parental";
      }

      return {
        date: formatDateUTC(date),
        dayOfWeek: dayNames[date.getUTCDay()],
        month: monthNames[date.getUTCMonth()],
        leaveType,
        isPaid,
        notes: notes || null,
      };
    });

    // Calculate summary by type
    const summary = {
      planned: {
        used: leaveRecords.filter((r) => r.leaveType === "Planned").length,
        quota: plannedLeaveQuota,
        remaining: Math.max(0, plannedLeaveQuota - leaveRecords.filter((r) => r.leaveType === "Planned").length),
      },
      unplanned: {
        used: leaveRecords.filter((r) => r.leaveType === "Unplanned").length,
        quota: unplannedLeaveQuota,
        remaining: Math.max(0, unplannedLeaveQuota - leaveRecords.filter((r) => r.leaveType === "Unplanned").length),
      },
      parental: {
        used: leaveRecords.filter((r) => r.leaveType === "Parental").length,
        quota: parentalLeaveQuota,
        remaining: Math.max(0, parentalLeaveQuota - leaveRecords.filter((r) => r.leaveType === "Parental").length),
      },
      unpaid: leaveRecords.filter((r) => !r.isPaid).length,
      totalUsed: leaveRecords.filter((r) => r.isPaid).length,
      totalQuota: plannedLeaveQuota + unplannedLeaveQuota + parentalLeaveQuota,
      totalRemaining: Math.max(0,
        (plannedLeaveQuota + unplannedLeaveQuota + parentalLeaveQuota) -
        leaveRecords.filter((r) => r.isPaid && !r.leaveType.includes("Unpaid")).length
      ),
    };

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name || null,
        email: user.email,
        image: user.image || null,
        isAdmin: user.isAdminUser === true,
      },
      year,
      summary,
      records: leaveRecords,
    });
  } catch (error) {
    console.error("Error fetching leave report:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave report" },
      { status: 500 }
    );
  }
}
