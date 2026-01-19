import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-api";
import { getLeaveStats } from "@/lib/db/attendance";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );

    const stats = await getLeaveStats(user.id, year);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching leave stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave stats" },
      { status: 500 }
    );
  }
}
