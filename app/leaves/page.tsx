'use client';

import { useEffect, useState } from 'react';
import { LeaveStats } from '@/models/Attendance';
import LeaveCard from '@/components/LeaveCard';
import Navigation from '@/components/Navigation';
import LeaveBottomSheet from '@/components/LeaveBottomSheet';

export default function LeavesPage() {
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLeaveSheetOpen, setIsLeaveSheetOpen] = useState(false);

  const fetchLeaveStats = async () => {
    try {
      setLoading(true);
      const year = new Date().getFullYear();
      const response = await fetch(`/api/attendance/leaves?year=${year}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch leave stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveStats();
  }, []);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className='flex min-h-screen items-center justify-center'>
          <div className='h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100'></div>
        </div>
      </>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <>
      <Navigation />
      <div className='min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 dark:from-zinc-900 dark:to-black'>
        <div className='mx-auto max-w-7xl'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-4xl font-bold text-zinc-900 dark:text-white'>
              Leave Management
            </h1>
            <p className='mt-2 text-lg text-zinc-600 dark:text-zinc-400'>
              Year {currentYear}
            </p>
          </div>

          {/* Request Leave Button */}
          <div className='mb-8'>
            <button
              onClick={() => setIsLeaveSheetOpen(true)}
              className='flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-amber-700 hover:to-amber-800 hover:shadow-xl'
            >
              <div className='rounded-full bg-white/20 p-2 backdrop-blur-sm'>
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
                    d='M12 4v16m8-8H4'
                  />
                </svg>
              </div>
              Add Leave
            </button>
          </div>

          {/* Total Leaves Overview */}
          <div className='mb-8 rounded-2xl bg-gradient-to-br from-blue-500/90 to-indigo-600/90 backdrop-blur-xl border border-white/20 p-8 text-white shadow-xl'>
            <div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
              <div>
                <h2 className='text-3xl font-bold'>Total Annual Leaves</h2>
                <p className='mt-2 text-blue-100'>
                  Track your leave balance for the year
                </p>
              </div>
              <div className='text-center'>
                <div className='text-6xl font-bold'>
                  {stats?.usedLeaves}/
                  {(stats?.plannedLeaveQuota || 0) +
                    (stats?.unplannedLeaveQuota || 0) +
                    (stats?.parentalLeaveQuota || 0)}
                </div>
                <p className='mt-2 text-sm text-blue-100'>Used / Total</p>
              </div>
              <div className='rounded-xl bg-white/20 px-6 py-4 backdrop-blur-sm border border-white/30'>
                <div className='text-center'>
                  <div className='text-4xl font-bold'>
                    {stats?.remainingLeaves}
                  </div>
                  <p className='mt-1 text-sm text-blue-100'>Remaining</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Type Breakdown */}
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            <LeaveCard
              title='Planned Leaves'
              used={stats?.plannedLeaves || 0}
              total={stats?.plannedLeaveQuota || 0}
              icon='📅'
              color='blue'
              description='Pre-approved leaves'
            />
            <LeaveCard
              title='Unplanned Leaves'
              used={stats?.unplannedLeaves || 0}
              total={stats?.unplannedLeaveQuota || 0}
              icon='⚡'
              color='orange'
              description='Emergency or sick leaves'
            />
            <LeaveCard
              title='Parental Leave'
              used={stats?.parentalLeaves || 0}
              total={stats?.parentalLeaveQuota || 0}
              icon='👶'
              color='green'
              description='Paternity/Maternity leave'
            />
          </div>

          {/* Unpaid Leaves Section */}
          {(stats?.unpaidLeaves || 0) > 0 && (
            <div className='mt-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-xl border border-red-500/20 p-6'>
              <div className='flex items-center gap-4'>
                <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/20 text-2xl'>
                  💸
                </div>
                <div className='flex-1'>
                  <h3 className='text-lg font-semibold text-zinc-900 dark:text-white'>
                    Unpaid Leaves
                  </h3>
                  <p className='text-sm text-zinc-600 dark:text-zinc-400'>
                    Leaves beyond your quota (not paid)
                  </p>
                </div>
                <div className='text-right'>
                  <div className='text-3xl font-bold text-red-600 dark:text-red-400'>
                    {stats?.unpaidLeaves || 0}
                  </div>
                  <p className='text-xs text-zinc-500 dark:text-zinc-500'>
                    days
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className='mt-8 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900'>
            <h3 className='mb-4 text-lg font-semibold text-zinc-900 dark:text-white'>
              ℹ️ Leave Policy Information
            </h3>
            <ul className='space-y-2 text-sm text-zinc-600 dark:text-zinc-400'>
              <li>
                • Planned Leaves: {stats?.plannedLeaveQuota || 0} per year
              </li>
              <li>
                • Unplanned Leaves: {stats?.unplannedLeaveQuota || 0} per year
              </li>
              <li>
                • Parental Leave: {stats?.parentalLeaveQuota || 0} (separate
                quota)
              </li>
              <li>
                • Planned leaves should be requested at least 48 hours in
                advance
              </li>
              <li>• Unused leaves do not carry forward to the next year</li>
            </ul>
          </div>
        </div>
      </div>

      <LeaveBottomSheet
        isOpen={isLeaveSheetOpen}
        onClose={() => setIsLeaveSheetOpen(false)}
        onLeaveRequested={fetchLeaveStats}
      />
    </>
  );
}
