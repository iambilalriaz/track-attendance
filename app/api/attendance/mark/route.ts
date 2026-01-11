import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAttendance } from "@/lib/db/attendance";
import { AttendanceStatus } from "@/models/Attendance";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
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
      session.user.id,
      session.user.email,
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
