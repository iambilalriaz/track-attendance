import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-api";
import { markAttendance, getExistingAttendanceInRange, getLeaveStats } from "@/lib/db/attendance";
import { getUserSettings } from "@/lib/db/user-settings";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.id || !user?.email) {
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

    // Check for existing attendance records in the date range
    const existingRecords = await getExistingAttendanceInRange(
      user.id,
      start,
      end
    );

    // Filter to only weekday records that are already leaves (absent status)
    const existingLeaves = existingRecords.filter((r) => {
      const dayOfWeek = new Date(r.date).getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6 && r.status === "absent";
    });

    if (existingLeaves.length > 0) {
      const conflictDates = existingLeaves.map((r) =>
        new Date(r.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      );

      return NextResponse.json(
        {
          error: "Leave already exists for some dates",
          conflictDates,
          message: `You already have leave marked for: ${conflictDates.join(", ")}`,
        },
        { status: 409 }
      );
    }

    // Count requested weekdays
    let requestedDays = 0;
    const tempDate = new Date(start);
    while (tempDate <= end) {
      const dayOfWeek = tempDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        requestedDays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Get current leave stats to check quota
    const year = start.getFullYear();
    const leaveStats = await getLeaveStats(user.id, year);
    const userSettings = await getUserSettings(user.id);

    // Calculate available quota for the selected leave type
    let usedOfType = 0;
    let quotaOfType = 0;
    let leaveTypeLabel = "";

    if (leaveType === "planned-leave") {
      usedOfType = leaveStats.plannedLeaves;
      quotaOfType = userSettings?.leaveQuota?.planned || 15;
      leaveTypeLabel = "Planned Leave";
    } else if (leaveType === "unplanned-leave") {
      usedOfType = leaveStats.unplannedLeaves;
      quotaOfType = userSettings?.leaveQuota?.unplanned || 10;
      leaveTypeLabel = "Unplanned Leave";
    } else {
      usedOfType = leaveStats.parentalLeaves;
      quotaOfType = userSettings?.leaveQuota?.parentalLeave || 0;
      leaveTypeLabel = "Parental Leave";
    }

    const availableQuota = Math.max(0, quotaOfType - usedOfType);
    const paidDays = Math.min(requestedDays, availableQuota);
    const unpaidDays = requestedDays - paidDays;

    // Calculate days and mark attendance for each day as absent (excluding weekends)
    const markedDates = [];
    const unpaidDates = [];
    const currentDate = new Date(start);
    let paidCount = 0;

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();

      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const isUnpaid = paidCount >= paidDays;
        const actualLeaveType = isUnpaid ? "Unpaid Leave" : leaveTypeLabel;

        const noteText = notes
          ? `${actualLeaveType} - ${notes}`
          : actualLeaveType;

        await markAttendance(
          user.id,
          user.email,
          new Date(currentDate),
          "absent",
          noteText
        );

        if (isUnpaid) {
          unpaidDates.push(new Date(currentDate));
        } else {
          markedDates.push(new Date(currentDate));
          paidCount++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Build response message
    let message = `Leave marked for ${markedDates.length + unpaidDates.length} day(s)`;
    if (unpaidDates.length > 0) {
      message += ` (${unpaidDates.length} unpaid)`;
    }

    return NextResponse.json({
      success: true,
      daysCount: markedDates.length + unpaidDates.length,
      paidDays: markedDates.length,
      unpaidDays: unpaidDates.length,
      message
    });
  } catch (error) {
    console.error("Error processing leave request:", error);
    return NextResponse.json(
      { error: "Failed to process leave request" },
      { status: 500 }
    );
  }
}
