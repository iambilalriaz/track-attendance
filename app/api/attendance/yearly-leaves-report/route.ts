import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-api";
import { getAttendanceCollection } from "@/lib/db/attendance";
import { getUserSettings } from "@/lib/db/user-settings";

export interface YearlyLeaveRecord {
  date: string;
  dayName: string;
  leaveType: string;
  notes?: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const collection = await getAttendanceCollection();

    // Get first and last day of the year
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);

    // Get all leave records for the year (status = absent)
    const records = await collection
      .find({
        userId: user.id,
        date: { $gte: firstDay, $lte: lastDay },
        status: "absent",
      })
      .sort({ date: 1 })
      .toArray();

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Build leave records
    const leaveRecords: YearlyLeaveRecord[] = records.map((record) => {
      const date = new Date(record.date);
      const notes = record.notes || "";

      // Determine leave type from notes (check Unpaid first as it contains other type names)
      let leaveType = "Leave";
      if (notes.includes("Unpaid Leave")) {
        leaveType = "Unpaid Leave";
      } else if (notes.includes("Planned Leave")) {
        leaveType = "Planned Leave";
      } else if (notes.includes("Unplanned Leave")) {
        leaveType = "Unplanned Leave";
      } else if (notes.includes("Parental Leave")) {
        leaveType = "Parental Leave";
      }

      // Extract additional notes (after the leave type label)
      let additionalNotes = notes;
      if (notes.includes(" - ")) {
        additionalNotes = notes.split(" - ").slice(1).join(" - ");
      } else if (["Planned Leave", "Unplanned Leave", "Parental Leave"].includes(notes)) {
        additionalNotes = "";
      }

      return {
        date: date.toISOString().split("T")[0],
        dayName: dayNames[date.getDay()],
        leaveType,
        notes: additionalNotes || undefined,
      };
    });

    // Get user's leave quota
    const userSettings = await getUserSettings(user.id);
    const plannedLeaveQuota = userSettings?.leaveQuota?.planned || 15;
    const unplannedLeaveQuota = userSettings?.leaveQuota?.unplanned || 10;
    const parentalLeaveQuota = userSettings?.leaveQuota?.parentalLeave || 0;

    // Calculate summary by leave type
    const unpaidLeaves = leaveRecords.filter((r) => r.leaveType === "Unpaid Leave").length;
    const paidLeaves = leaveRecords.length - unpaidLeaves;

    const summary = {
      totalLeaves: paidLeaves,
      plannedLeaves: leaveRecords.filter((r) => r.leaveType === "Planned Leave").length,
      unplannedLeaves: leaveRecords.filter((r) => r.leaveType === "Unplanned Leave").length,
      parentalLeaves: leaveRecords.filter((r) => r.leaveType === "Parental Leave").length,
      unpaidLeaves,
      otherLeaves: leaveRecords.filter((r) => r.leaveType === "Leave").length,
      quota: {
        planned: plannedLeaveQuota,
        unplanned: unplannedLeaveQuota,
        parental: parentalLeaveQuota,
        total: plannedLeaveQuota + unplannedLeaveQuota + parentalLeaveQuota,
      },
    };

    // Group leaves by month for better visualization
    const leavesByMonth: Record<string, YearlyLeaveRecord[]> = {};
    leaveRecords.forEach((record) => {
      const monthKey = new Date(record.date).toLocaleString("en-US", { month: "long" });
      if (!leavesByMonth[monthKey]) {
        leavesByMonth[monthKey] = [];
      }
      leavesByMonth[monthKey].push(record);
    });

    return NextResponse.json({
      year,
      records: leaveRecords,
      leavesByMonth,
      summary,
    });
  } catch (error) {
    console.error("Error fetching yearly leaves report:", error);
    return NextResponse.json(
      { error: "Failed to fetch yearly leaves report" },
      { status: 500 }
    );
  }
}
