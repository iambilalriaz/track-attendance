'use client';

import { useEffect, useState } from 'react';
import { AttendanceStats } from '@/models/Attendance';
import StatsCard from '@/components/StatsCard';
import MarkAttendance from '@/components/MarkAttendance';
import Navigation from '@/components/Navigation';
import RequestLeave from '@/components/RequestLeave';

export default function DashboardPage() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchStats = async () => {
    try {
      setLoading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const response = await fetch(
        `/api/attendance/stats?year=${year}&month=${month}`
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentMonth]);

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });
  const year = currentMonth.getFullYear();

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
          <div className='mb-8'>
            <h1 className='text-4xl font-bold text-zinc-900 dark:text-white'>
              Attendance Dashboard
            </h1>
            <p className='mt-2 text-lg text-zinc-600 dark:text-zinc-400'>
              {monthName} {year}
            </p>
          </div>

          {/* Mark Today's Attendance */}
          <MarkAttendance
            currentStatus={stats?.todayStatus}
            onAttendanceMarked={fetchStats}
          />

          {/* Stats Grid */}
          <div className='mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            <StatsCard
              title='Total Working Days'
              value={stats?.totalWorkingDays.toFixed(1) || '0'}
              subtitle='This month'
              icon='📊'
              color='blue'
            />
            <StatsCard
              title='Work From Office'
              value={stats?.workFromOffice || 0}
              subtitle='Office days'
              icon='🏢'
              color='green'
            />
            <StatsCard
              title='Work From Home'
              value={stats?.workFromHome || 0}
              subtitle='Remote days'
              icon='🏠'
              color='purple'
            />
            <StatsCard
              title='Attendance Rate'
              value={`${stats?.attendanceRate || 0}%`}
              subtitle='Excluding weekends'
              icon='📈'
              color='indigo'
            />
          </div>

          <div className='mt-6 grid gap-6 sm:grid-cols-2'>
            <StatsCard
              title='Absent Days'
              value={stats?.absentDays || 0}
              subtitle='This month'
              icon='📉'
              color='red'
            />
            <StatsCard
              title='Month Progress'
              value={`${Math.round(
                (new Date().getDate() /
                  new Date(year, currentMonth.getMonth() + 1, 0).getDate()) *
                  100
              )}%`}
              subtitle={`Day ${new Date().getDate()} of ${new Date(
                year,
                currentMonth.getMonth() + 1,
                0
              ).getDate()}`}
              icon='📅'
              color='teal'
            />
          </div>
        </div>

        {/* Floating Add Leave Widget */}
        <div className='fixed bottom-6 right-6 z-50'>
          <RequestLeave onLeaveRequested={fetchStats} />
        </div>
      </div>
    </>
  );
}
