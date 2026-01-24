"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navigation from "@/components/Navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isAdminUser?: boolean;
}

interface SyncResult {
  userId: string;
  userEmail: string | null;
  synced: number;
  skipped: number;
  syncedDates: string[];
  error?: string;
}

interface SyncResponse {
  success: boolean;
  summary: {
    totalUsers: number;
    totalSynced: number;
    totalSkipped: number;
  };
  results: SyncResult[];
}

export default function AdminSyncPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResponse | null>(null);

  // Get current year and month
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);

  // Check admin status and fetch users
  useEffect(() => {
    async function init() {
      try {
        // Check admin status
        const adminRes = await fetch("/api/admin/check");
        const adminData = await adminRes.json();

        if (!adminData.isAdmin) {
          setIsAdmin(false);
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
        console.error("Error initializing admin page:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedUsers(new Set(users.map((u) => u.id)));
  };

  const deselectAll = () => {
    setSelectedUsers(new Set());
  };

  const handleSync = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setSyncing(true);
    setSyncResults(null);

    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          year,
          month,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync");
      }

      const data: SyncResponse = await response.json();
      setSyncResults(data);

      if (data.summary.totalSynced > 0) {
        toast.success(
          `Synced ${data.summary.totalSynced} records for ${data.summary.totalUsers} user(s)`
        );
      } else {
        toast.success("No new records to sync");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync");
    } finally {
      setSyncing(false);
    }
  };

  // Loading state
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

  // Not admin
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

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {/* Header with back link */}
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
              Sync Work Mode Data
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Sync attendance records for users based on their default settings
            </p>
          </div>

          {/* Sync Controls */}
          <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg mb-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
              Sync Settings
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              This will sync work mode data for the selected month. Only past
              weekdays without existing records will be synced.
            </p>
          </div>

          {/* User Selection */}
          <div className="rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Select Users ({selectedUsers.size} selected)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1 text-sm rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <label
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.has(user.id)
                      ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700"
                      : "bg-zinc-50 dark:bg-zinc-700/50 border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-white truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  {user.isAdminUser && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                      Admin
                    </span>
                  )}
                </label>
              ))}

              {users.length === 0 && (
                <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                  No users found
                </p>
              )}
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing || selectedUsers.size === 0}
            className={`w-full py-4 rounded-xl text-white font-semibold transition-all ${
              syncing || selectedUsers.size === 0
                ? "bg-zinc-400 dark:bg-zinc-600 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            }`}
          >
            {syncing ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Syncing...
              </span>
            ) : (
              `Sync ${selectedUsers.size} User${selectedUsers.size !== 1 ? "s" : ""}`
            )}
          </button>

          {/* Results */}
          {syncResults && (
            <div className="mt-6 rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                Sync Results
              </h2>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 rounded-lg bg-zinc-100 dark:bg-zinc-700">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {syncResults.summary.totalUsers}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Users</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {syncResults.summary.totalSynced}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Synced
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {syncResults.summary.totalSkipped}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Skipped
                  </p>
                </div>
              </div>

              {/* Individual Results */}
              <div className="space-y-3">
                {syncResults.results.map((result) => (
                  <div
                    key={result.userId}
                    className={`p-3 rounded-lg ${
                      result.error
                        ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                        : "bg-zinc-50 dark:bg-zinc-700/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {result.userEmail || result.userId}
                      </p>
                      {result.error ? (
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {result.error}
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {result.synced} synced, {result.skipped} skipped
                        </span>
                      )}
                    </div>
                    {result.syncedDates.length > 0 && (
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Dates: {result.syncedDates.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
