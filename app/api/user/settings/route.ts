import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  updateUserSettings,
  getUserSettings,
} from "@/lib/db/user-settings";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getUserSettings(session.user.id);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leaveQuota, defaultWorkFromHomeDays } = body;

    // Validation
    if (!leaveQuota || typeof leaveQuota !== "object") {
      return NextResponse.json(
        { error: "Leave quota is required" },
        { status: 400 }
      );
    }

    if (
      typeof leaveQuota.planned !== "number" ||
      typeof leaveQuota.unplanned !== "number" ||
      typeof leaveQuota.parentalLeave !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid leave quota format" },
        { status: 400 }
      );
    }

    // Validate defaultWorkFromHomeDays is an array
    if (!Array.isArray(defaultWorkFromHomeDays)) {
      return NextResponse.json(
        { error: "Invalid work from home days (must be an array)" },
        { status: 400 }
      );
    }

    // Validate each day is a valid weekday
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    for (const day of defaultWorkFromHomeDays) {
      if (!validDays.includes(day)) {
        return NextResponse.json(
          { error: `Invalid day: ${day}. Must be one of: ${validDays.join(", ")}` },
          { status: 400 }
        );
      }
    }

    const result = await updateUserSettings(session.user.id, {
      leaveQuota,
      defaultWorkFromHomeDays,
    });

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully"
    });
  } catch (error) {
    console.error("Error saving user settings:", error);
    return NextResponse.json(
      { error: "Failed to save user settings" },
      { status: 500 }
    );
  }
}
