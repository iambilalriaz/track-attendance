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

interface DailyRecord {
  date: string;
  dayOfWeek: string;
  status: string;
  notes: string | null;
}

interface WorkReportData {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    isAdmin: boolean;
  };
  month: {
    year: number;
    month: number;
    name: string;
    daysInMonth: number;
  };
  summary: {
    present: number;
    wfh: number;
    leave: number;
    total: number;
  };
  records: DailyRecord[];
}

export default function AdminWorkReportPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [data, setData] = useState<WorkReportData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);

  const [statusFilter, setStatusFilter] = useState<string>("all");

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
      const res = await fetch(`/api/admin/work-report?userId=${selectedUserId}&year=${year}&month=${month}`);
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
  }, [selectedUserId, year, month]);

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

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    present: { label: "Office", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    wfh: { label: "WFH", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30" },
    leave: { label: "Leave", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
    absent: { label: "Leave", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
    "planned-leave": { label: "Planned Leave", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
    "unplanned-leave": { label: "Unplanned Leave", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/30" },
    "parental-leave": { label: "Parental Leave", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/30" },
  };

  const filteredRecords = data?.records.filter((r) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "leave") {
      return r.status === "leave" || r.status === "absent" ||
             r.status === "planned-leave" || r.status === "unplanned-leave" ||
             r.status === "parental-leave";
    }
    return r.status === statusFilter;
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
              Work Report
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              View detailed work mode records by user and month
            </p>
          </div>

          {/* Filters */}
          <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg mb-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Select User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
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
                <div className="flex items-center gap-4">
                  {data.user.image ? (
                    <Image
                      src={data.user.image}
                      alt={data.user.name || data.user.email}
                      width={56}
                      height={56}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center">
                      <span className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
                        {(data.user.name || data.user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                      {data.user.name || data.user.email}
                      {data.user.isAdmin && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          Admin
                        </span>
                      )}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400">{data.user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {data.month.name} {data.month.year}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {data.summary.total} working days recorded
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setStatusFilter(statusFilter === "present" ? "all" : "present")}
                  className={`p-4 rounded-xl text-center transition-all ${
                    statusFilter === "present" ? "ring-2 ring-emerald-600" : ""
                  } bg-emerald-100 dark:bg-emerald-900/30`}
                >
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {data.summary.present}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Office Days</p>
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === "wfh" ? "all" : "wfh")}
                  className={`p-4 rounded-xl text-center transition-all ${
                    statusFilter === "wfh" ? "ring-2 ring-blue-600" : ""
                  } bg-blue-100 dark:bg-blue-900/30`}
                >
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {data.summary.wfh}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">WFH Days</p>
                </button>
                <button
                  onClick={() => setStatusFilter(statusFilter === "leave" ? "all" : "leave")}
                  className={`p-4 rounded-xl text-center transition-all ${
                    statusFilter === "leave" ? "ring-2 ring-amber-600" : ""
                  } bg-amber-100 dark:bg-amber-900/30`}
                >
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {data.summary.leave}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Leave Days</p>
                </button>
              </div>

              {/* Daily Records Table */}
              <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Daily Records
                  </h3>
                  {statusFilter !== "all" && (
                    <button
                      onClick={() => setStatusFilter("all")}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                        <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Date
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Day
                        </th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record, index) => {
                        const config = statusConfig[record.status] || { label: record.status, color: "text-zinc-700", bg: "bg-zinc-100" };
                        return (
                          <tr
                            key={record.date}
                            className={`border-b border-zinc-100 dark:border-zinc-700/50 ${
                              index % 2 === 0 ? "bg-white/50 dark:bg-zinc-800/20" : ""
                            }`}
                          >
                            <td className="px-6 py-3 text-sm font-medium text-zinc-900 dark:text-white">
                              {record.date}
                            </td>
                            <td className="px-6 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                              {record.dayOfWeek}
                            </td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                {config.label}
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
                    No records found {statusFilter !== "all" && "for this filter"}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50 p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Select a User
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400">
                Choose a user from the dropdown above to view their work report.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
