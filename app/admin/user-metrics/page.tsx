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

interface UserMetricsData {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    isAdmin: boolean;
  };
  year: number;
  yearlyStats: {
    present: number;
    wfh: number;
    leave: number;
    halfDay: number;
  };
  monthlyBreakdown: Array<{
    month: number;
    name: string;
    present: number;
    wfh: number;
    leave: number;
    halfDay: number;
  }>;
  leaveBreakdown: {
    planned: number;
    unplanned: number;
    parental: number;
    unpaid: number;
  };
  leaveQuotas: {
    planned: { quota: number; used: number };
    unplanned: { quota: number; used: number };
    parental: { quota: number; used: number };
  };
  dayPattern: Record<string, { total: number; wfh: number; present: number }>;
  recentActivity: Array<{
    date: string;
    status: string;
    notes: string | null;
  }>;
  settings: {
    defaultWorkFromHomeDays: string[];
  };
}

export default function AdminUserMetricsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [metrics, setMetrics] = useState<UserMetricsData | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

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

  const fetchUserMetrics = async (userId: string) => {
    setMetricsLoading(true);
    try {
      const res = await fetch(`/api/admin/user-metrics?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      fetchUserMetrics(selectedUserId);
    } else {
      setMetrics(null);
    }
  }, [selectedUserId]);

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

  const statusConfig: Record<string, { label: string; color: string }> = {
    present: { label: "Office", color: "text-emerald-700 dark:text-emerald-300" },
    wfh: { label: "WFH", color: "text-blue-700 dark:text-blue-300" },
    leave: { label: "Leave", color: "text-amber-700 dark:text-amber-300" },
    absent: { label: "Leave", color: "text-amber-700 dark:text-amber-300" },
    "half-day": { label: "Half Day", color: "text-purple-700 dark:text-purple-300" },
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-8">
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
              User Metrics
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Detailed attendance metrics for individual users
            </p>
          </div>

          {/* User Selector */}
          <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full max-w-md rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {metricsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-900 dark:border-white"></div>
            </div>
          ) : metrics ? (
            <>
              {/* User Info */}
              <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg mb-6">
                <div className="flex items-center gap-4">
                  {metrics.user.image ? (
                    <Image
                      src={metrics.user.image}
                      alt={metrics.user.name || metrics.user.email}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center">
                      <span className="text-xl font-medium text-zinc-600 dark:text-zinc-300">
                        {(metrics.user.name || metrics.user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                      {metrics.user.name || metrics.user.email}
                      {metrics.user.isAdmin && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          Admin
                        </span>
                      )}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400">{metrics.user.email}</p>
                    {metrics.settings.defaultWorkFromHomeDays.length > 0 && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Default WFH: {metrics.settings.defaultWorkFromHomeDays.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Yearly Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-center">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {metrics.yearlyStats.present}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Office Days</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-center">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {metrics.yearlyStats.wfh}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">WFH Days</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-center">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {metrics.yearlyStats.leave}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Leave Days</p>
                </div>
                <div className="p-4 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-center">
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {metrics.yearlyStats.halfDay}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Half Days</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Leave Quotas */}
                <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                    Leave Quotas ({metrics.year})
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(metrics.leaveQuotas).map(([type, data]) => {
                      const percentage = data.quota > 0 ? (data.used / data.quota) * 100 : 0;
                      const colors: Record<string, string> = {
                        planned: "bg-blue-500",
                        unplanned: "bg-amber-500",
                        parental: "bg-purple-500",
                      };
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize text-zinc-700 dark:text-zinc-300">{type}</span>
                            <span className="text-zinc-500 dark:text-zinc-400">
                              {data.used} / {data.quota}
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors[type]} transition-all`}
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Unpaid leaves: {metrics.leaveBreakdown.unpaid}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Day Pattern */}
                <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                    Work Pattern by Day
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(metrics.dayPattern).map(([day, data]) => {
                      const wfhPercent = data.total > 0 ? (data.wfh / data.total) * 100 : 0;
                      const officePercent = data.total > 0 ? (data.present / data.total) * 100 : 0;
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-zinc-700 dark:text-zinc-300">{day}</span>
                          <div className="flex-1 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${officePercent}%` }}
                              title={`Office: ${data.present}`}
                            />
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${wfhPercent}%` }}
                              title={`WFH: ${data.wfh}`}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 w-16 text-right">
                            {data.present}O / {data.wfh}W
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-emerald-500"></span>
                      Office
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-blue-500"></span>
                      WFH
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="mt-6 rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                  Monthly Breakdown ({metrics.year})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Month</th>
                        <th className="text-center px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">Office</th>
                        <th className="text-center px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300">WFH</th>
                        <th className="text-center px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300">Leave</th>
                        <th className="text-center px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-300">Half Day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.monthlyBreakdown.map((month) => (
                        <tr key={month.month} className="border-b border-zinc-100 dark:border-zinc-700/50">
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-white">{month.name}</td>
                          <td className="text-center px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{month.present}</td>
                          <td className="text-center px-3 py-2 text-sm text-blue-700 dark:text-blue-300">{month.wfh}</td>
                          <td className="text-center px-3 py-2 text-sm text-amber-700 dark:text-amber-300">{month.leave}</td>
                          <td className="text-center px-3 py-2 text-sm text-purple-700 dark:text-purple-300">{month.halfDay}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-6 rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-2">
                  {metrics.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-700/50"
                    >
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {activity.date}
                      </span>
                      <span className={`text-sm ${statusConfig[activity.status]?.color || "text-zinc-500"}`}>
                        {statusConfig[activity.status]?.label || activity.status}
                      </span>
                    </div>
                  ))}
                  {metrics.recentActivity.length === 0 && (
                    <p className="text-center text-zinc-500 dark:text-zinc-400 py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50 p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Select a User
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400">
                Choose a user from the dropdown above to view their detailed metrics.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
