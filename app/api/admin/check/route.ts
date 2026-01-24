import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-api";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json(
        { isAdmin: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if user has isAdminUser flag in database
    const client = await clientPromise;
    const db = client.db("track-attendance");

    // Try to find by ObjectId first, then by email
    let dbUser = null;
    if (ObjectId.isValid(user.id)) {
      dbUser = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
    }
    if (!dbUser) {
      dbUser = await db.collection("users").findOne({ email: user.email });
    }

    const isAdmin = dbUser?.isAdminUser === true;

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { isAdmin: false, error: "Failed to check admin status" },
      { status: 500 }
    );
  }
}
