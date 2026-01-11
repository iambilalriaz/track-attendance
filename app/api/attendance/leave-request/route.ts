import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAttendance } from "@/lib/db/attendance";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leaveType, startDate, endDate, notes } = body;

    if (!leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Leave type, start date, and end date are required" },
        { status: 400 }
      );
    }

    const validLeaveTypes = ["planned-leave", "unplanned-leave", "parental-leave"];
    if (!validLeaveTypes.includes(leaveType)) {
      return NextResponse.json(
        { error: "Invalid leave type" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Calculate days and mark attendance for each day as absent
    const markedDates = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      // Mark as absent with leave type in notes
      const leaveTypeLabel = leaveType === "planned-leave" ? "Planned Leave"
        : leaveType === "unplanned-leave" ? "Unplanned Leave"
        : "Parental Leave";

      const noteText = notes
        ? `${leaveTypeLabel} - ${notes}`
        : leaveTypeLabel;

      await markAttendance(
        session.user.id,
        session.user.email,
        new Date(currentDate),
        "absent",
        noteText
      );

      markedDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      daysCount: markedDates.length,
      message: `Leave marked for ${markedDates.length} day(s)`
    });
  } catch (error) {
    console.error("Error processing leave request:", error);
    return NextResponse.json(
      { error: "Failed to process leave request" },
      { status: 500 }
    );
  }
}
