'use client';

import { useEffect, useState, useCallback } from 'react';
import { LeaveStats } from '@/models/Attendance';
import LeaveCard from '@/components/LeaveCard';
import Navigation from '@/components/Navigation';
import LeaveBottomSheet, { LeaveToEdit } from '@/components/LeaveBottomSheet';
import ConfirmDialog from '@/components/ConfirmDialog';
import toast from 'react-hot-toast';

interface LeaveRecord {
  date: string;
  dayName: string;
  leaveType: string;
  notes?: string;
}

interface YearlyLeavesData {
  year: number;
  records: LeaveRecord[];
  leavesByMonth: Record<string, LeaveRecord[]>;
  summary: {
    totalLeaves: number;
    plannedLeaves: number;
    unplannedLeaves: number;
    parentalLeaves: number;
    unpaidLeaves: number;
    otherLeaves: number;
  };
}

type TabType = 'overview' | 'management';

export default function LeavesPage() {
  const [stats, setStats] = useState<LeaveStats | null>(null);
  const [leavesData, setLeavesData] = useState<YearlyLeavesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [isLeaveSheetOpen, setIsLeaveSheetOpen] = useState(false);
  const [editData, setEditData] = useState<LeaveToEdit | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; date: string | null }>({
    isOpen: false,
    date: null,
  });

  const currentYear = new Date().getFullYear();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const statsRes = await fetch(`/api/attendance/leaves?year=${currentYear}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  const fetchLeavesData = useCallback(async () => {
    try {
      setLeavesLoading(true);
      const leavesRes = await fetch(`/api/attendance/yearly-leaves-report?year=${currentYear}`);
      if (leavesRes.ok) {
        const data = await leavesRes.json();
        setLeavesData(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaves data:', error);
    } finally {
      setLeavesLoading(false);
    }
  }, [currentYear]);

  const fetchAllData = useCallback(async () => {
    await fetchStats();
    if (activeTab === 'management') {
      await fetchLeavesData();
    }
  }, [fetchStats, fetchLeavesData, activeTab]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Lazy load leaves data when switching to management tab
  useEffect(() => {
    if (activeTab === 'management' && !leavesData) {
      fetchLeavesData();
    }
  }, [activeTab, leavesData, fetchLeavesData]);

  const handleEdit = (leave: LeaveRecord) => {
    setEditData({
      date: leave.date,
      leaveType: leave.leaveType,
      notes: leave.notes,
    });
    setIsLeaveSheetOpen(true);
  };

  const handleDeleteClick = (date: string) => {
    setDeleteConfirm({ isOpen: true, date });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.date) return;

    const date = deleteConfirm.date;
    try {
      setDeletingDate(date);
      const response = await fetch(`/api/attendance/leave?date=${date}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Leave deleted successfully');
        setDeleteConfirm({ isOpen: false, date: null });
        fetchLeavesData();
        fetchStats();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete leave');
      }
    } catch (error) {
      console.error('Failed to delete leave:', error);
      toast.error('Failed to delete leave');
    } finally {
      setDeletingDate(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, date: null });
  };

  const handleCloseSheet = () => {
    setIsLeaveSheetOpen(false);
    setEditData(null);
  };

  const handleLeaveRequested = () => {
    fetchStats();
    fetchLeavesData();
  };

  const getLeaveTypeStyle = (leaveType: string) => {
    switch (leaveType) {
      case 'Planned Leave':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Unplanned Leave':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Parental Leave':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Unpaid Leave':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const getLeaveTypeIcon = (leaveType: string) => {
    switch (leaveType) {
      case 'Planned Leave':
        return '📅';
      case 'Unplanned Leave':
        return '⚡';
      case 'Parental Leave':
        return '👶';
      case 'Unpaid Leave':
        return '💸';
      default:
        return '📋';
    }
  };

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

  return (
    <>
      <Navigation />
      <div className='min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 dark:from-zinc-900 dark:to-black'>
        <div className='mx-auto max-w-7xl'>
          {/* Header */}
          <div className='mb-6'>
            <h1 className='text-4xl font-bold text-zinc-900 dark:text-white'>
              Leave Management
            </h1>
            <p className='mt-2 text-lg text-zinc-600 dark:text-zinc-400'>
              Year {currentYear}
            </p>
          </div>

          {/* Tabs */}
          <div className='mb-6 flex gap-2 rounded-xl bg-zinc-200/50 p-1 dark:bg-zinc-800/50'>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('management')}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === 'management'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              Manage Leaves
              {leavesData && leavesData.records.length > 0 && (
                <span className='ml-2 rounded-full bg-zinc-300 px-2 py-0.5 text-xs dark:bg-zinc-600'>
                  {leavesData.records.length}
                </span>
              )}
            </button>
          </div>

          {/* Request Leave Button */}
          <div className='mb-8'>
            <button
              onClick={() => {
                setEditData(null);
                setIsLeaveSheetOpen(true);
              }}
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

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
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
                  Leave Policy Information
                </h3>
                <ul className='space-y-2 text-sm text-zinc-600 dark:text-zinc-400'>
                  <li>
                    Planned Leaves: {stats?.plannedLeaveQuota || 0} per year
                  </li>
                  <li>
                    Unplanned Leaves: {stats?.unplannedLeaveQuota || 0} per year
                  </li>
                  <li>
                    Parental Leave: {stats?.parentalLeaveQuota || 0} (separate
                    quota)
                  </li>
                  <li>
                    Planned leaves should be requested at least 48 hours in
                    advance
                  </li>
                  <li>Unused leaves do not carry forward to the next year</li>
                </ul>
              </div>
            </>
          )}

          {/* Management Tab */}
          {activeTab === 'management' && (
            <div className='space-y-4'>
              {leavesLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <div className='h-10 w-10 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100'></div>
                </div>
              ) : !leavesData || leavesData.records.length === 0 ? (
                <div className='rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900'>
                  <div className='text-5xl mb-4'>📋</div>
                  <h3 className='text-lg font-semibold text-zinc-900 dark:text-white'>
                    No leaves recorded
                  </h3>
                  <p className='mt-2 text-zinc-600 dark:text-zinc-400'>
                    You haven&apos;t taken any leaves this year yet.
                  </p>
                </div>
              ) : (
                <div className='rounded-2xl bg-white/80 backdrop-blur-xl border border-zinc-200/50 dark:bg-zinc-800/80 dark:border-zinc-700/50 overflow-hidden'>
                  <div className='p-4 border-b border-zinc-200 dark:border-zinc-700'>
                    <h3 className='font-semibold text-zinc-900 dark:text-white'>
                      All Leaves ({leavesData.records.length})
                    </h3>
                  </div>
                  <div className='divide-y divide-zinc-200 dark:divide-zinc-700'>
                    {leavesData.records.map((leave) => (
                      <div
                        key={leave.date}
                        className='flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors'
                      >
                        <div className='flex items-center gap-4'>
                          <div className='text-2xl'>
                            {getLeaveTypeIcon(leave.leaveType)}
                          </div>
                          <div>
                            <div className='font-medium text-zinc-900 dark:text-white'>
                              {new Date(leave.date).toLocaleDateString(
                                'en-US',
                                {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                }
                              )}
                            </div>
                            <div className='flex items-center gap-2 mt-1'>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getLeaveTypeStyle(leave.leaveType)}`}
                              >
                                {leave.leaveType}
                              </span>
                              {leave.notes && (
                                <span className='text-sm text-zinc-500 dark:text-zinc-400'>
                                  {leave.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => handleEdit(leave)}
                            className='rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors'
                            title='Edit'
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
                                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(leave.date)}
                            disabled={deletingDate === leave.date}
                            className='rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-colors disabled:opacity-50'
                            title='Delete'
                          >
                            {deletingDate === leave.date ? (
                              <div className='h-5 w-5 animate-spin rounded-full border-2 border-red-500 border-t-transparent'></div>
                            ) : (
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
                                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <LeaveBottomSheet
        isOpen={isLeaveSheetOpen}
        onClose={handleCloseSheet}
        onLeaveRequested={handleLeaveRequested}
        editData={editData}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title='Delete Leave'
        message='Are you sure you want to delete this leave? This action cannot be undone.'
        confirmLabel='Delete'
        cancelLabel='Cancel'
        confirmVariant='danger'
        isLoading={deletingDate === deleteConfirm.date}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
