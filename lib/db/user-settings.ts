import clientPromise from "@/lib/mongodb";
import { LeaveQuota, DayOfWeek } from "@/models/User";
import { ObjectId } from "mongodb";

export async function updateUserSettings(
  userId: string,
  settings: {
    leaveQuota: LeaveQuota;
    defaultWorkFromHomeDays: DayOfWeek[];
  }
) {
  const client = await clientPromise;
  const db = client.db("track-attendance");
  const users = db.collection("users");

  const result = await users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        leaveQuota: settings.leaveQuota,
        defaultWorkFromHomeDays: settings.defaultWorkFromHomeDays,
        onboardingCompleted: true,
        updatedAt: new Date(),
      },
    }
  );

  return result;
}

export async function getUserSettings(userId: string) {
  const client = await clientPromise;
  const db = client.db("track-attendance");
  const users = db.collection("users");

  const user = await users.findOne(
    { _id: new ObjectId(userId) },
    {
      projection: {
        onboardingCompleted: 1,
        leaveQuota: 1,
        defaultWorkFromHomeDays: 1,
      },
    }
  );

  return user;
}

export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db("track-attendance");
  const users = db.collection("users");

  const user = await users.findOne(
    { _id: new ObjectId(userId) },
    { projection: { onboardingCompleted: 1 } }
  );

  return user?.onboardingCompleted || false;
}
