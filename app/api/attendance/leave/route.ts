import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-api";
import { getAttendanceCollection } from "@/lib/db/attendance";

// DELETE - Delete a leave by date
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const collection = await getAttendanceCollection();

    // Parse the date and create start/end of day for comparison
    const [year, month, day] = dateParam.split("-").map(Number);
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    // Find the record
    const existingRecord = await collection.findOne({
      userId: user.id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: "absent",
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Leave record not found" },
        { status: 404 }
      );
    }

    // Delete the record
    await collection.deleteOne({ _id: existingRecord._id });

    return NextResponse.json({
      success: true,
      message: "Leave deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting leave:", error);
    return NextResponse.json(
      { error: "Failed to delete leave" },
      { status: 500 }
    );
  }
}

// PUT - Update a leave
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { originalDate, newDate, leaveType, notes } = body;

    if (!originalDate || !leaveType) {
      return NextResponse.json(
        { error: "Original date and leave type are required" },
        { status: 400 }
      );
    }

    const collection = await getAttendanceCollection();

    // Parse the original date
    const [origYear, origMonth, origDay] = originalDate.split("-").map(Number);
    const origStartOfDay = new Date(Date.UTC(origYear, origMonth - 1, origDay, 0, 0, 0, 0));
    const origEndOfDay = new Date(Date.UTC(origYear, origMonth - 1, origDay, 23, 59, 59, 999));

    // Find the original record
    const existingRecord = await collection.findOne({
      userId: user.id,
      date: {
        $gte: origStartOfDay,
        $lte: origEndOfDay,
      },
      status: "absent",
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Leave record not found" },
        { status: 404 }
      );
    }

    // Map leave type to label
    const leaveTypeLabels: Record<string, string> = {
      "planned-leave": "Planned Leave",
      "unplanned-leave": "Unplanned Leave",
      "parental-leave": "Parental Leave",
      "unpaid-leave": "Unpaid Leave",
    };

    const leaveTypeLabel = leaveTypeLabels[leaveType] || "Leave";
    const noteText = notes ? `${leaveTypeLabel} - ${notes}` : leaveTypeLabel;

    // Parse the new date if provided
    let updateDate = origStartOfDay;
    if (newDate && newDate !== originalDate) {
      const [newYear, newMonth, newDay] = newDate.split("-").map(Number);
      const newStartOfDay = new Date(Date.UTC(newYear, newMonth - 1, newDay, 0, 0, 0, 0));
      const newEndOfDay = new Date(Date.UTC(newYear, newMonth - 1, newDay, 23, 59, 59, 999));

      // Check for conflicts on the new date
      const conflictRecord = await collection.findOne({
        userId: user.id,
        date: {
          $gte: newStartOfDay,
          $lte: newEndOfDay,
        },
      });

      if (conflictRecord) {
        return NextResponse.json(
          { error: "A record already exists for the new date" },
          { status: 409 }
        );
      }

      updateDate = newStartOfDay;
    }

    // Update the record
    await collection.updateOne(
      { _id: existingRecord._id },
      {
        $set: {
          date: updateDate,
          notes: noteText,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Leave updated successfully",
    });
  } catch (error) {
    console.error("Error updating leave:", error);
    return NextResponse.json(
      { error: "Failed to update leave" },
      { status: 500 }
    );
  }
}
