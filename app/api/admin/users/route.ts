import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-api";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user?.id || !user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("track-attendance");

    // Check if current user is admin - try ObjectId first, then email
    let currentUser = null;
    if (ObjectId.isValid(user.id)) {
      currentUser = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
    }
    if (!currentUser) {
      currentUser = await db.collection("users").findOne({ email: user.email });
    }

    if (!currentUser?.isAdminUser) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get all users - include _id as id for frontend
    const users = await db
      .collection("users")
      .find({})
      .project({ _id: 1, email: 1, name: 1, image: 1, isAdminUser: 1 })
      .toArray();

    // Map _id to id for frontend compatibility
    const mappedUsers = users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      image: u.image,
      isAdminUser: u.isAdminUser,
    }));

    return NextResponse.json({ users: mappedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
