"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import toast from "react-hot-toast";

interface LeaveQuota {
  planned: number;
  unplanned: number;
  parentalLeave: number;
}

type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

const WEEKDAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [leaveQuota, setLeaveQuota] = useState<LeaveQuota>({
    planned: 15,
    unplanned: 10,
    parentalLeave: 0,
  });
  const [defaultWorkFromHomeDays, setDefaultWorkFromHomeDays] = useState<DayOfWeek[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/settings");
      if (response.ok) {
        const data = await response.json();

        // Check if user has completed onboarding
        setIsNewUser(!data.onboardingCompleted);

        if (data.leaveQuota) {
          setLeaveQuota(data.leaveQuota);
        }
        if (data.defaultWorkFromHomeDays && Array.isArray(data.defaultWorkFromHomeDays) && data.defaultWorkFromHomeDays.length > 0) {
          setDefaultWorkFromHomeDays(data.defaultWorkFromHomeDays);
        } else {
          // Preselect Thursday & Friday as default WFH days
          setDefaultWorkFromHomeDays(["Thursday", "Friday"]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWeekday = (day: DayOfWeek) => {
    setDefaultWorkFromHomeDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await fetch("/api/user/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveQuota,
          defaultWorkFromHomeDays,
        }),
      });

      if (response.ok) {
        toast.success("Settings saved successfully!");
        router.push("/dashboard");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 dark:from-zinc-900 dark:to-black">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            {isNewUser ? (
              <>
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
                  Welcome! Let's Set Up Your Account
                </h1>
                <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                  Please configure your leave quota and work preferences to get started
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
                  Settings
                </h1>
                <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
                  Update your leave quota and work preferences
                </p>
              </>
            )}
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Quota Card */}
            <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-800">
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">
                Annual Leave Quota
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="plannedLeaves"
                    className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Planned Leave Days
                  </label>
                  <input
                    id="plannedLeaves"
                    type="number"
                    min="0"
                    max="365"
                    value={leaveQuota.planned}
                    onChange={(e) =>
                      setLeaveQuota({
                        ...leaveQuota,
                        planned: e.target.value === '' ? 0 : parseInt(e.target.value),
                      })
                    }
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                    required
                  />
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Pre-approved leaves requested in advance
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="unplannedLeaves"
                    className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Unplanned Leave Days
                  </label>
                  <input
                    id="unplannedLeaves"
                    type="number"
                    min="0"
                    max="365"
                    value={leaveQuota.unplanned}
                    onChange={(e) =>
                      setLeaveQuota({
                        ...leaveQuota,
                        unplanned: e.target.value === '' ? 0 : parseInt(e.target.value),
                      })
                    }
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                    required
                  />
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Emergency or sick leaves
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="parentalLeave"
                    className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Parental Leave Days
                  </label>
                  <input
                    id="parentalLeave"
                    type="number"
                    min="0"
                    max="365"
                    value={leaveQuota.parentalLeave}
                    onChange={(e) =>
                      setLeaveQuota({
                        ...leaveQuota,
                        parentalLeave: e.target.value === '' ? 0 : parseInt(e.target.value),
                      })
                    }
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  />
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Paternity/Maternity leave - separate from annual quota
                  </p>
                </div>
              </div>
            </div>

            {/* Work Preferences Card */}
            <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-800">
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">
                Work Preferences
              </h2>

              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Default Work From Home Days
                </label>
                <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Select the days of the week you typically work from home
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekday(day)}
                      className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                        defaultWorkFromHomeDays.includes(day)
                          ? "border-indigo-500 bg-indigo-500 text-white shadow-lg"
                          : "border-zinc-300 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-500 dark:hover:bg-zinc-600"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {defaultWorkFromHomeDays.length > 0 && (
                  <p className="mt-3 text-sm text-indigo-600 dark:text-indigo-400">
                    Selected: {defaultWorkFromHomeDays.join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-lg border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Info Section */}
          <div className="mt-8 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
              ℹ️ Important Information
            </h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>• You can update these settings at any time</li>
              <li>• Leave quotas are annual and reset each year</li>
              <li>• Paternity and maternity leaves are separate from your annual quota</li>
              <li>• Default WFH days is just for reference and doesn't enforce any limits</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
