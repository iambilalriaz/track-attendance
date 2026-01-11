import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLeaveStats } from "@/lib/db/attendance";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(
      searchParams.get("year") || new Date().getFullYear().toString()
    );

    const stats = await getLeaveStats(session.user.id, year);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching leave stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave stats" },
      { status: 500 }
    );
  }
}
