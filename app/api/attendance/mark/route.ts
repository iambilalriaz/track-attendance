import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-api";
import { markAttendance } from "@/lib/db/attendance";
import { AttendanceStatus } from "@/models/Attendance";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, status, notes } = body;

    if (!date || !status) {
      return NextResponse.json(
        { error: "Date and status are required" },
        { status: 400 }
      );
    }

    const validStatuses: AttendanceStatus[] = [
      "present",
      "wfh",
      "absent",
      "leave",
      "planned-leave",
      "unplanned-leave",
      "parental-leave",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid attendance status" },
        { status: 400 }
      );
    }

    const attendance = await markAttendance(
      user.id,
      user.email,
      new Date(date),
      status,
      notes
    );

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}
