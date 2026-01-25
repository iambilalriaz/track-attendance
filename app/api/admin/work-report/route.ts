import { NextRequest, NextResponse } from "next/server";
import { getAttendanceCollection, formatDateUTC } from "@/lib/db/attendance";
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
    const month = parseInt(searchParams.get("month") || (new Date().getUTCMonth() + 1).toString());

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

    // Get date range for the month
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const firstDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const lastDay = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59, 999));

    // Get all attendance records for the user in this month
    const records = await attendanceCollection
      .find({
        userId,
        date: { $gte: firstDay, $lte: lastDay },
      })
      .sort({ date: 1 })
      .toArray();

    // Build daily records with day info
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const dailyRecords = records
      .filter((r) => {
        // Exclude weekends
        const dayOfWeek = new Date(r.date).getUTCDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6;
      })
      .map((r) => {
        const date = new Date(r.date);
        return {
          date: formatDateUTC(date),
          dayOfWeek: dayNames[date.getUTCDay()],
          status: r.status,
          notes: r.notes || null,
        };
      });

    // Calculate summary
    const summary = {
      present: dailyRecords.filter((r) => r.status === "present").length,
      wfh: dailyRecords.filter((r) => r.status === "wfh").length,
      leave: dailyRecords.filter((r) => r.status === "leave" || r.status === "absent" || r.status === "planned-leave" || r.status === "unplanned-leave" || r.status === "parental-leave").length,
      total: dailyRecords.length,
    };

    // Get month name
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name || null,
        email: user.email,
        image: user.image || null,
        isAdmin: user.isAdminUser === true,
      },
      month: {
        year,
        month,
        name: monthNames[month - 1],
        daysInMonth,
      },
      summary,
      records: dailyRecords,
    });
  } catch (error) {
    console.error("Error fetching work report:", error);
    return NextResponse.json(
      { error: "Failed to fetch work report" },
      { status: 500 }
    );
  }
}
