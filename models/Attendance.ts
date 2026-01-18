import { ObjectId } from "mongodb";

export type AttendanceStatus =
  | "present"
  | "wfh"
  | "absent"
  | "leave"
  | "planned-leave"
  | "unplanned-leave"
  | "parental-leave";

export interface Attendance {
  _id?: ObjectId;
  userId: string;
  userEmail: string;
  date: Date;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceStats {
  totalWorkingDays: number;
  workFromOffice: number;
  workFromHome: number;
  absentDays: number;
  attendanceRate: number;
  todayStatus?: AttendanceStatus;
}

export interface LeaveStats {
  totalLeaves: number;
  remainingLeaves: number;
  usedLeaves: number;
  plannedLeaves: number;
  unplannedLeaves: number;
  parentalLeaves: number;
  unpaidLeaves: number;
  plannedLeaveQuota: number;
  unplannedLeaveQuota: number;
  parentalLeaveQuota: number;
}
