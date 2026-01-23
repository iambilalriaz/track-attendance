import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-api";
import { getMonthlyStats, autoMarkTodayAttendance } from "@/lib/db/attendance";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    // Auto-mark today's attendance based on user settings (if not already marked)
    await autoMarkTodayAttendance(user.id, user.email);

    const stats = await getMonthlyStats(user.id, year, month);

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance stats" },
      { status: 500 }
    );
  }
}
