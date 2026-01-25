"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import Image from "next/image";

interface UserStatus {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isAdmin: boolean;
  status: string | null;
  notes: string | null;
}

interface TodayData {
  date: {
    formatted: string;
    iso: string;
    isWeekend: boolean;
  };
  summary: {
    total: number;
    present: number;
    wfh: number;
    leave: number;
    notMarked: number;
  };
  users: UserStatus[];
}

export default function AdminTodayPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TodayData | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const adminRes = await fetch("/api/admin/check");
        const adminData = await adminRes.json();

        if (!adminData.isAdmin) {
          setIsAdmin(false);
          return;
        }

        setIsAdmin(true);

        const todayRes = await fetch("/api/admin/today");
        if (todayRes.ok) {
          const todayData = await todayRes.json();
          setData(todayData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    present: { label: "Office", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    wfh: { label: "WFH", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30" },
    leave: { label: "Leave", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
    absent: { label: "Leave", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
    "planned-leave": { label: "Planned Leave", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
    "unplanned-leave": { label: "Unplanned Leave", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
    "parental-leave": { label: "Parental Leave", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/30" },
  };

  const filteredUsers = data?.users.filter((user) => {
    if (filter === "all") return true;
    if (filter === "not-marked") return !user.status;
    if (filter === "leave") {
      return user.status === "leave" || user.status === "absent" ||
             user.status === "planned-leave" || user.status === "unplanned-leave" ||
             user.status === "parental-leave";
    }
    return user.status === filter;
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
              Today&apos;s Overview
            </h1>
            {data && (
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {data.date.formatted}
                {data.date.isWeekend && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    Weekend
                  </span>
                )}
              </p>
            )}
          </div>

          {data?.date.isWeekend ? (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2">
                It&apos;s the Weekend!
              </h2>
              <p className="text-amber-600 dark:text-amber-400">
                Attendance tracking is not applicable on weekends.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {data && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                  <button
                    onClick={() => setFilter("all")}
                    className={`p-4 rounded-xl text-center transition-all ${
                      filter === "all"
                        ? "ring-2 ring-zinc-900 dark:ring-white"
                        : ""
                    } bg-zinc-100 dark:bg-zinc-800`}
                  >
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {data.summary.total}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Total</p>
                  </button>
                  <button
                    onClick={() => setFilter("present")}
                    className={`p-4 rounded-xl text-center transition-all ${
                      filter === "present"
                        ? "ring-2 ring-emerald-600 dark:ring-emerald-400"
                        : ""
                    } bg-emerald-100 dark:bg-emerald-900/30`}
                  >
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {data.summary.present}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Office</p>
                  </button>
                  <button
                    onClick={() => setFilter("wfh")}
                    className={`p-4 rounded-xl text-center transition-all ${
                      filter === "wfh"
                        ? "ring-2 ring-blue-600 dark:ring-blue-400"
                        : ""
                    } bg-blue-100 dark:bg-blue-900/30`}
                  >
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {data.summary.wfh}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">WFH</p>
                  </button>
                  <button
                    onClick={() => setFilter("leave")}
                    className={`p-4 rounded-xl text-center transition-all ${
                      filter === "leave"
                        ? "ring-2 ring-amber-600 dark:ring-amber-400"
                        : ""
                    } bg-amber-100 dark:bg-amber-900/30`}
                  >
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {data.summary.leave}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Leave</p>
                  </button>
                  <button
                    onClick={() => setFilter("not-marked")}
                    className={`p-4 rounded-xl text-center transition-all ${
                      filter === "not-marked"
                        ? "ring-2 ring-red-600 dark:ring-red-400"
                        : ""
                    } bg-red-100 dark:bg-red-900/30`}
                  >
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                      {data.summary.notMarked}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">Not Marked</p>
                  </button>
                </div>
              )}

              {/* User List */}
              <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                  Users ({filteredUsers.length})
                </h2>

                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-700/50"
                    >
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || user.email}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                            {(user.name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-white truncate">
                          {user.name || user.email}
                          {user.isAdmin && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.status ? (
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig[user.status]?.bg} ${statusConfig[user.status]?.color}`}
                          >
                            {statusConfig[user.status]?.label || user.status}
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            Not Marked
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredUsers.length === 0 && (
                    <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                      No users found
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
