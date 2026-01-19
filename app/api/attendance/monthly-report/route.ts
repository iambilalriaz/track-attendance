import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-api";
import { getAttendanceCollection } from "@/lib/db/attendance";

export interface MonthlyReportRecord {
  date: string;
  dayName: string;
  status: string;
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
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    const collection = await getAttendanceCollection();

    // Get first and last day of the month
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // Get all attendance records for the month
    const records = await collection
      .find({
        userId: user.id,
        date: { $gte: firstDay, $lte: lastDay },
      })
      .sort({ date: 1 })
      .toArray();

    // Build report data for each weekday in the month
    const reportData: MonthlyReportRecord[] = [];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      const dateStr = d.toISOString().split("T")[0];
      const record = records.find(
        (r) => new Date(r.date).toISOString().split("T")[0] === dateStr
      );

      reportData.push({
        date: dateStr,
        dayName: dayNames[dayOfWeek],
        status: record?.status || "unmarked",
        notes: record?.notes,
      });
    }

    // Calculate summary
    const summary = {
      totalWorkDays: reportData.length,
      workFromOffice: reportData.filter((r) => r.status === "present").length,
      workFromHome: reportData.filter((r) => r.status === "wfh").length,
      leaves: reportData.filter((r) => r.status === "absent").length,
      unmarked: reportData.filter((r) => r.status === "unmarked").length,
    };

    return NextResponse.json({
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleString("en-US", { month: "long" }),
      records: reportData,
      summary,
    });
  } catch (error) {
    console.error("Error fetching monthly report:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly report" },
      { status: 500 }
    );
  }
}
