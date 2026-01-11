'use client';

import { useState } from 'react';
import { AttendanceStatus } from '@/models/Attendance';

interface MarkAttendanceProps {
  currentStatus?: AttendanceStatus;
  onAttendanceMarked: () => void;
}

const statusOptions = [
  {
    value: 'present',
    label: 'Work From Office',
    icon: '🏢',
    gradient: 'from-emerald-600 to-emerald-700',
    hoverGradient: 'hover:from-emerald-700 hover:to-emerald-800',
    ring: 'ring-emerald-500',
  },
  {
    value: 'wfh',
    label: 'Work From Home',
    icon: '🏠',
    gradient: 'from-blue-600 to-blue-700',
    hoverGradient: 'hover:from-blue-700 hover:to-blue-800',
    ring: 'ring-blue-500',
  },
  {
    value: 'absent',
    label: 'On Leave',
    icon: '📴',
    gradient: 'from-rose-600 to-rose-700',
    hoverGradient: 'hover:from-rose-700 hover:to-rose-800',
    ring: 'ring-rose-500',
  },
];

export default function MarkAttendance({
  currentStatus,
  onAttendanceMarked,
}: MarkAttendanceProps) {
  const [marking, setMarking] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const handleMarkAttendance = async (status: string) => {
    try {
      setMarking(true);
      setSelectedStatus(status);

      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          status,
        }),
      });

      if (response.ok) {
        onAttendanceMarked();
      } else {
        alert('Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    } finally {
      setMarking(false);
      setSelectedStatus(null);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className='rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg'>
      <div className='mb-4'>
        <h2 className='text-2xl font-bold text-zinc-900 dark:text-white'>
          Mark Today's Attendance
        </h2>
        <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>{today}</p>
      </div>

      {currentStatus && (
        <div
          className={`mb-4 rounded-lg backdrop-blur-sm border p-4 ${
            currentStatus === 'present'
              ? 'bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/20'
              : currentStatus === 'wfh'
              ? 'bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/20'
              : 'bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/20'
          }`}
        >
          <p
            className={`text-sm ${
              currentStatus === 'present'
                ? 'text-emerald-800 dark:text-emerald-200'
                : currentStatus === 'wfh'
                ? 'text-blue-800 dark:text-blue-200'
                : 'text-amber-800 dark:text-amber-200'
            }`}
          >
            Today's Status:
            <span className='font-semibold capitalize ml-1'>
              {currentStatus === 'wfh'
                ? 'Working from home'
                : currentStatus.replace('-', ' ')}
            </span>
          </p>
          <p
            className={`mt-1 text-xs ${
              currentStatus === 'present'
                ? 'text-emerald-600 dark:text-emerald-300'
                : currentStatus === 'wfh'
                ? 'text-blue-600 dark:text-blue-300'
                : 'text-amber-600 dark:text-amber-300'
            }`}
          >
            You can update it by selecting a different status below
          </p>
        </div>
      )}

      <div className='grid gap-4 sm:grid-cols-3'>
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleMarkAttendance(option.value)}
            disabled={marking}
            className={`group relative overflow-hidden rounded-xl p-6 text-center transition-all ${
              currentStatus === option.value
                ? `ring-2 ring-offset-2 ${option.ring}`
                : ''
            } ${
              marking && selectedStatus === option.value
                ? 'opacity-50'
                : 'hover:scale-105'
            } bg-gradient-to-br ${option.gradient} ${
              option.hoverGradient
            } shadow-lg hover:shadow-xl`}
          >
            <div className='text-4xl'>{option.icon}</div>
            <p className='mt-3 font-semibold text-white'>{option.label}</p>
            {marking && selectedStatus === option.value && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent' />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
