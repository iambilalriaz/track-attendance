import { ObjectId } from "mongodb";

export interface LeaveQuota {
  planned: number;
  unplanned: number;
  parentalLeave: number; // Combined paternity/maternity
}

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface User {
  _id?: ObjectId;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  onboardingCompleted?: boolean;
  leaveQuota?: LeaveQuota;
  defaultWorkFromHomeDays?: DayOfWeek[]; // Array of weekdays
}

export interface Account {
  _id?: ObjectId;
  userId: ObjectId;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

export interface Session {
  _id?: ObjectId;
  sessionToken: string;
  userId: ObjectId;
  expires: Date;
}

export interface VerificationToken {
  _id?: ObjectId;
  identifier: string;
  token: string;
  expires: Date;
}
