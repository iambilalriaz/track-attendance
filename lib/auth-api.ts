import { auth } from "./auth";
import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

// Helper to get authenticated user and verify they exist in DB
export async function getAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    return null;
  }

  // Verify user exists in database
  try {
    const client = await clientPromise;
    const db = client.db("track-attendance");

    let user = null;

    // Try to find by ObjectId first
    if (ObjectId.isValid(session.user.id)) {
      user = await db.collection("users").findOne({
        _id: new ObjectId(session.user.id)
      });
    }

    // If not found, try by email as fallback
    if (!user) {
      user = await db.collection("users").findOne({
        email: session.user.email
      });
    }

    if (!user) {
      console.log("User not found in DB:", session.user.id, session.user.email);
      return null;
    }

    return session.user;
  } catch (error) {
    console.error("Error verifying user in DB:", error);
    return null;
  }
}
