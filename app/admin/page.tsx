"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Link from "next/link";

interface AdminCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch("/api/admin/check");
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
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

  const adminCards: AdminCard[] = [
    {
      title: "Sync Data",
      description: "Sync work mode data for users based on their default settings",
      href: "/admin/sync",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      color: "indigo",
    },
    {
      title: "Today's Overview",
      description: "View today's attendance status for all users at a glance",
      href: "/admin/today",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "emerald",
    },
    {
      title: "Work Report",
      description: "Monthly work mode breakdown for all users (WFO/WFH/Leaves)",
      href: "/admin/work-report",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "blue",
    },
    {
      title: "Leave Report",
      description: "Yearly leave statistics and remaining balance for all users",
      href: "/admin/leave-report",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
      color: "amber",
    },
    {
      title: "User Metrics",
      description: "Detailed attendance metrics and patterns for individual users",
      href: "/admin/user-metrics",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: "purple",
    },
  ];

  const colorClasses: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      border: "border-indigo-200 dark:border-indigo-800",
      icon: "text-indigo-600 dark:text-indigo-400",
      hover: "hover:bg-indigo-100 dark:hover:bg-indigo-900/30",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      icon: "text-emerald-600 dark:text-emerald-400",
      hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      icon: "text-blue-600 dark:text-blue-400",
      hover: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
      icon: "text-amber-600 dark:text-amber-400",
      hover: "hover:bg-amber-100 dark:hover:bg-amber-900/30",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-200 dark:border-purple-800",
      icon: "text-purple-600 dark:text-purple-400",
      hover: "hover:bg-purple-100 dark:hover:bg-purple-900/30",
    },
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage attendance data and view reports for all users
            </p>
          </div>

          {/* Action Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {adminCards.map((card) => {
              const colors = colorClasses[card.color];
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`group relative rounded-2xl border ${colors.border} ${colors.bg} ${colors.hover} p-6 shadow-sm transition-all duration-200 hover:shadow-md`}
                >
                  <div className={`mb-4 ${colors.icon}`}>
                    {card.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                    {card.title}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {card.description}
                  </p>
                  <div className="absolute top-6 right-6 text-zinc-400 dark:text-zinc-500 group-hover:translate-x-1 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
