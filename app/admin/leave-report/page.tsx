"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isAdmin?: boolean;
}

interface LeaveRecord {
  date: string;
  dayOfWeek: string;
  month: string;
  leaveType: string;
  isPaid: boolean;
  notes: string | null;
}

interface LeaveCategory {
  used: number;
  quota: number;
  remaining: number;
}

interface LeaveReportData {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    isAdmin: boolean;
  };
  year: number;
  summary: {
    planned: LeaveCategory;
    unplanned: LeaveCategory;
    parental: LeaveCategory;
    unpaid: number;
    totalUsed: number;
    totalQuota: number;
    totalRemaining: number;
  };
  records: LeaveRecord[];
}

export default function AdminLeaveReportPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [data, setData] = useState<LeaveReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());

  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    async function init() {
      try {
        const adminRes = await fetch("/api/admin/check");
        const adminData = await adminRes.json();

        if (!adminData.isAdmin) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        // Fetch users
        const usersRes = await fetch("/api/admin/users");
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } catch (error) {
        console.error("Error initializing:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const fetchReport = async () => {
    if (!selectedUserId) {
      setData(null);
      return;
    }

    setReportLoading(true);
    try {
      const res = await fetch(`/api/admin/leave-report?userId=${selectedUserId}&year=${year}`);
      if (res.ok) {
        const reportData = await res.json();
        setData(reportData);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId && isAdmin) {
      fetchReport();
    }
  }, [selectedUserId, year]);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900 dark:border-white"></div>
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
              Access Denied
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              You don&apos;t have permission to access this page.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  const leaveTypeConfig: Record<string, { color: string; bg: string }> = {
    Planned: { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30" },
    Unplanned: { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
    Parental: { color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/30" },
    "Planned (Unpaid)": { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100/50 dark:bg-blue-900/20" },
    "Unplanned (Unpaid)": { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100/50 dark:bg-amber-900/20" },
    "Parental (Unpaid)": { color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100/50 dark:bg-purple-900/20" },
    Unpaid: { color: "text-zinc-700 dark:text-zinc-300", bg: "bg-zinc-100 dark:bg-zinc-700" },
    Other: { color: "text-zinc-700 dark:text-zinc-300", bg: "bg-zinc-100 dark:bg-zinc-700" },
  };

  const filteredRecords = data?.records.filter((r) => {
    if (typeFilter === "all") return true;
    if (typeFilter === "planned") return r.leaveType.includes("Planned");
    if (typeFilter === "unplanned") return r.leaveType.includes("Unplanned");
    if (typeFilter === "parental") return r.leaveType.includes("Parental");
    if (typeFilter === "unpaid") return !r.isPaid;
    return true;
  }) || [];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Admin
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Leave Report
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              View detailed leave records by user and year
            </p>
          </div>

          {/* Filters */}
          <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg mb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Select User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {reportLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900 dark:border-white"></div>
            </div>
          ) : data ? (
            <>
              {/* User Info Card */}
              <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {data.user.image ? (
                      <Image
                        src={data.user.image}
                        alt={data.user.name || data.user.email}
                        width={56}
                        height={56}
                        className="rounded-full shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center shrink-0">
                        <span className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
                          {(data.user.name || data.user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex flex-wrap items-center gap-2">
                        <span className="truncate">{data.user.name || data.user.email}</span>
                        {data.user.isAdmin && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shrink-0">
                            Admin
                          </span>
                        )}
                      </h2>
                      <p className="text-zinc-500 dark:text-zinc-400 truncate">{data.user.email}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {data.year}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {data.records.length} leave days taken
                    </p>
                  </div>
                </div>
              </div>

              {/* Leave Quota Summary */}
              <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg mb-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                  Leave Balance
                </h3>
                <div className="grid gap-4 sm:grid-cols-3 mb-4">
                  {/* Planned */}
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Planned</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {data.summary.planned.used}/{data.summary.planned.quota}
                      </span>
                    </div>
                    <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${Math.min(100, (data.summary.planned.used / data.summary.planned.quota) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {data.summary.planned.remaining} remaining
                    </p>
                  </div>

                  {/* Unplanned */}
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Unplanned</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        {data.summary.unplanned.used}/{data.summary.unplanned.quota}
                      </span>
                    </div>
                    <div className="h-2 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${Math.min(100, (data.summary.unplanned.used / data.summary.unplanned.quota) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {data.summary.unplanned.remaining} remaining
                    </p>
                  </div>

                  {/* Parental */}
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Parental</span>
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        {data.summary.parental.used}/{data.summary.parental.quota}
                      </span>
                    </div>
                    <div className="h-2 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${data.summary.parental.quota > 0 ? Math.min(100, (data.summary.parental.used / data.summary.parental.quota) * 100) : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      {data.summary.parental.remaining} remaining
                    </p>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-100 dark:bg-zinc-700/50">
                  <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total Paid Leaves</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {data.summary.totalUsed} used of {data.summary.totalQuota} quota
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      data.summary.totalRemaining > 10
                        ? "text-emerald-600 dark:text-emerald-400"
                        : data.summary.totalRemaining > 5
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {data.summary.totalRemaining}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">remaining</p>
                  </div>
                </div>

                {data.summary.unpaid > 0 && (
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    + {data.summary.unpaid} unpaid leave(s) taken
                  </p>
                )}
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { key: "all", label: "All", count: data.records.length },
                  { key: "planned", label: "Planned", count: data.summary.planned.used },
                  { key: "unplanned", label: "Unplanned", count: data.summary.unplanned.used },
                  { key: "parental", label: "Parental", count: data.summary.parental.used },
                  { key: "unpaid", label: "Unpaid", count: data.summary.unpaid },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setTypeFilter(filter.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      typeFilter === filter.key
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                        : "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>

              {/* Leave Records Table */}
              <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Leave History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                        <th className="text-left px-3 sm:px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Date
                        </th>
                        <th className="text-left px-3 sm:px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Day
                        </th>
                        <th className="text-left px-3 sm:px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record, index) => {
                        const config = leaveTypeConfig[record.leaveType] || leaveTypeConfig.Other;
                        return (
                          <tr
                            key={record.date}
                            className={`border-b border-zinc-100 dark:border-zinc-700/50 ${
                              index % 2 === 0 ? "bg-white/50 dark:bg-zinc-800/20" : ""
                            }`}
                          >
                            <td className="px-3 sm:px-6 py-3 text-sm font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                              {record.date}
                            </td>
                            <td className="px-3 sm:px-6 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                              {record.dayOfWeek}
                            </td>
                            <td className="px-3 sm:px-6 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                {record.leaveType}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredRecords.length === 0 && (
                  <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                    {data.records.length === 0
                      ? "No leaves taken this year"
                      : "No records found for this filter"
                    }
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50 p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Select a User
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400">
                Choose a user from the dropdown above to view their leave report.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
