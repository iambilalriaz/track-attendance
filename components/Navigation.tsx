"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/leaves", label: "Leaves", icon: "🏖️" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Nav Items */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">
                Track Attendance
              </span>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* User Menu & Hamburger */}
          <div className="flex items-center gap-4">
            {session?.user && (
              <>
                {/* Desktop User Info */}
                <div className="hidden items-center gap-3 md:flex">
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700"
                    />
                  )}
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                {/* Desktop Sign Out */}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="hidden md:block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                >
                  Sign Out
                </button>

                {/* Mobile Hamburger */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  aria-label="Toggle menu"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {mobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="mt-4 md:hidden border-t border-zinc-200 dark:border-zinc-800 pt-4">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-4 px-2">
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700"
                />
              )}
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {session?.user?.email}
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Sign Out Button */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-4 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
