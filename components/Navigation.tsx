'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const response = await fetch('/api/admin/check');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    }

    if (session?.user) {
      checkAdmin();
    }
  }, [session?.user]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/leaves', label: 'Leaves', icon: '🏖️' },
    { href: '/reports/monthly-work-mode', label: 'Work Report', icon: '📋' },
    { href: '/reports/yearly-leaves', label: 'Leave Report', icon: '📄' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <>
      <nav className='sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/80'>
        <div className=' px-6 py-4'>
          <div className='flex items-center justify-between'>
            {/* Logo and Nav Items - Left Group */}
            <div className='flex items-center gap-6'>
              <Link href='/dashboard' className='flex items-center gap-2'>
                <Image
                  src='/track-attendance-logo.png'
                  alt='Track Attendance'
                  width={36}
                  height={36}
                  className='rounded-lg'
                />
                <span className='sm:text-xl font-bold text-zinc-900 dark:text-white'>
                  Track Attendance
                </span>
              </Link>

              <div className='hidden items-center gap-1 xl:flex'>
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User Menu & Hamburger - Right Group */}
            <div className='flex items-center gap-3'>
              {session?.user && (
                <>
                  {/* Desktop User Info - Clickable */}
                  <button
                    onClick={() => setProfilePopupOpen(true)}
                    className='hidden items-center gap-3 xl:flex rounded-lg px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer'
                  >
                    {session.user.image && (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={36}
                        height={36}
                        className='rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700'
                      />
                    )}
                    <p className='text-sm font-medium text-zinc-900 dark:text-white'>
                      {session.user.name}
                    </p>
                  </button>

                  {/* Desktop Sign Out */}
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className='hidden xl:block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600'
                  >
                    Sign Out
                  </button>

                  {/* Mobile Hamburger */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className='xl:hidden rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    aria-label='Toggle menu'
                  >
                    <svg
                      className='h-6 w-6'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      {mobileMenuOpen ? (
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M6 18L18 6M6 6l12 12'
                        />
                      ) : (
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 6h16M4 12h16M4 18h16'
                        />
                      )}
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay - Outside nav for proper stacking */}
      <div
        className={`fixed inset-0 z-100 bg-black/50 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar - Outside nav for proper positioning */}
      <div
        className={`fixed inset-y-0 right-0 z-101 w-80 max-w-[85vw] bg-white dark:bg-zinc-900 shadow-2xl transition-transform duration-300 ease-in-out xl:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className='flex h-full flex-col'>
          {/* Sidebar Header */}
          <div className='flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-4'>
            <div className='flex items-center gap-2'>
              <Image
                src='/track-attendance-logo.png'
                alt='Track Attendance'
                width={32}
                height={32}
                className='rounded-lg'
              />
              <span className='text-lg font-bold text-zinc-900 dark:text-white'>
                Track Attendance
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className='rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              aria-label='Close menu'
            >
              <svg
                className='h-6 w-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* User Info - Clickable */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setProfilePopupOpen(true);
            }}
            className='w-full border-b border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left'
          >
            <div className='flex items-center gap-3'>
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={48}
                  height={48}
                  className='rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700'
                />
              )}
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-semibold text-zinc-900 dark:text-white'>
                  {session?.user?.name}
                </p>
                <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                  Tap to view profile
                </p>
              </div>
            </div>
          </button>

          {/* Navigation Links */}
          <div className='flex-1 overflow-y-auto p-4'>
            <div className='space-y-2'>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-700 dark:text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className='text-xl'>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sign Out Button */}
          <div className='border-t border-zinc-200 dark:border-zinc-800 p-4'>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className='w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600'
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Profile Popup */}
      {profilePopupOpen && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm'
            onClick={() => setProfilePopupOpen(false)}
          />
          {/* Popup */}
          <div className='fixed inset-0 z-[201] flex items-center justify-center p-4'>
            <div className='relative w-full max-w-sm rounded-2xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-2xl'>
              {/* Close Button */}
              <button
                onClick={() => setProfilePopupOpen(false)}
                className='absolute top-3 right-3 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700 transition-colors'
              >
                <svg
                  className='h-5 w-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>

              {/* Profile Content */}
              <div className='flex flex-col items-center text-center'>
                {session?.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={80}
                    height={80}
                    className='rounded-full ring-4 ring-indigo-500/20 mb-4'
                  />
                )}
                <h3 className='text-xl font-bold text-zinc-900 dark:text-white'>
                  {session?.user?.name}
                </h3>
                <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
                  {session?.user?.email}
                </p>

                {/* Actions */}
                <div className='mt-6 w-full space-y-3'>
                  {isAdmin && (
                    <Link
                      href='/admin'
                      onClick={() => setProfilePopupOpen(false)}
                      className='flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-100 dark:bg-indigo-900/30 px-4 py-3 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors'
                    >
                      <svg
                        className='h-5 w-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                        />
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className='flex items-center justify-center gap-2 w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-medium text-white hover:bg-red-600 transition-colors'
                  >
                    <svg
                      className='h-5 w-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                      />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
