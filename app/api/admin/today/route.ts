import { NextResponse } from "next/server";
import { getAttendanceCollection, getTodayUTC, getUTCDayRange } from "@/lib/db/attendance";
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

export async function GET() {
  try {
    const isAdmin = await isSessionAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("track-attendance");
    const attendanceCollection = await getAttendanceCollection();

    // Get all users
    const users = await db.collection("users").find({}).toArray();

    // Get today's date range in UTC
    const today = getTodayUTC();
    const { start, end } = getUTCDayRange(today.year, today.month, today.day);

    // Get today's attendance records for all users
    const todayRecords = await attendanceCollection
      .find({
        date: { $gte: start, $lte: end },
      })
      .toArray();

    // Create a map of userId to their attendance record
    const attendanceByUser = new Map(
      todayRecords.map((record) => [record.userId, record])
    );

    // Build the response with user info and their status
    const userStatuses = users.map((user) => {
      const attendance = attendanceByUser.get(user._id.toString());
      return {
        id: user._id.toString(),
        name: user.name || null,
        email: user.email,
        image: user.image || null,
        isAdmin: user.isAdminUser === true,
        status: attendance?.status || null,
        notes: attendance?.notes || null,
      };
    });

    // Calculate summary
    const summary = {
      total: users.length,
      present: userStatuses.filter((u) => u.status === "present").length,
      wfh: userStatuses.filter((u) => u.status === "wfh").length,
      leave: userStatuses.filter((u) => u.status === "leave").length,
      halfDay: userStatuses.filter((u) => u.status === "half-day").length,
      notMarked: userStatuses.filter((u) => !u.status).length,
    };

    // Format today's date for display
    const todayDate = new Date(Date.UTC(today.year, today.month, today.day));
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return NextResponse.json({
      date: {
        formatted: `${dayNames[today.dayOfWeek]}, ${monthNames[today.month]} ${today.day}, ${today.year}`,
        iso: todayDate.toISOString().split("T")[0],
        isWeekend: today.dayOfWeek === 0 || today.dayOfWeek === 6,
      },
      summary,
      users: userStatuses,
    });
  } catch (error) {
    console.error("Error fetching today's overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch today's overview" },
      { status: 500 }
    );
  }
}
