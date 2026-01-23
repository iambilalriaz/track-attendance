'use client';

import { useState } from 'react';
import { AttendanceStatus } from '@/models/Attendance';
import LeaveBottomSheet from './LeaveBottomSheet';
import toast from 'react-hot-toast';

interface MarkAttendanceProps {
  currentStatus?: AttendanceStatus;
  onAttendanceMarked: () => void;
}

export default function MarkAttendance({
  currentStatus,
  onAttendanceMarked,
}: MarkAttendanceProps) {
  const [isLeaveSheetOpen, setIsLeaveSheetOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Check if user has marked work mode (present or wfh)
  const hasMarkedWorkMode =
    currentStatus === 'present' || currentStatus === 'wfh';

  // Check if on leave
  const isOnLeave = currentStatus === 'absent';

  const handleUpdateWorkMode = async (newStatus: 'present' | 'wfh') => {
    if (newStatus === currentStatus) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString(),
          status: newStatus,
        }),
      });

      if (response.ok) {
        onAttendanceMarked();
      } else {
        toast.error('Failed to update work mode');
      }
    } catch (error) {
      console.error('Error updating work mode:', error);
      toast.error('Failed to update work mode');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Today's Attendance Status */}
      <div className='rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg'>
        <div className='mb-4'>
          <h2 className='text-2xl font-bold text-zinc-900 dark:text-white'>
            Today's Attendance
          </h2>
          <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
            {formattedDate}
          </p>
        </div>

        {/* Weekend Display */}
        {isWeekend && (
          <div className='rounded-lg backdrop-blur-sm border p-4 bg-zinc-500/10 border-zinc-500/20 dark:bg-zinc-500/20'>
            <div className='flex items-center gap-3'>
              <span className='text-3xl'>🎉</span>
              <div>
                <p className='text-lg font-semibold text-zinc-700 dark:text-zinc-200'>
                  Weekend
                </p>
                <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                  Enjoy your day off!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Work Mode Toggle - shown when not weekend and not on leave */}
        {!isWeekend && !isOnLeave && (
          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              {/* Work From Office Button */}
              <button
                onClick={() => handleUpdateWorkMode('present')}
                disabled={updating}
                className={`relative rounded-lg border p-4 transition-all ${
                  currentStatus === 'present'
                    ? 'bg-emerald-500/20 border-emerald-500/40 dark:bg-emerald-500/30'
                    : 'bg-zinc-100/50 border-zinc-200/50 dark:bg-zinc-700/30 dark:border-zinc-600/50 hover:bg-emerald-500/10 hover:border-emerald-500/30'
                } ${updating ? 'opacity-50' : ''}`}
              >
                <div className='flex items-center gap-3'>
                  <span className='text-2xl'>🏢</span>
                  <div className='text-left'>
                    <p
                      className={`font-semibold ${
                        currentStatus === 'present'
                          ? 'text-emerald-800 dark:text-emerald-200'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      Office
                    </p>
                    {currentStatus === 'present' && (
                      <p className='text-xs text-emerald-600 dark:text-emerald-400'>
                        Current
                      </p>
                    )}
                  </div>
                </div>
                {currentStatus === 'present' && (
                  <div className='absolute top-2 right-2'>
                    <svg
                      className='w-5 h-5 text-emerald-600 dark:text-emerald-400'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                )}
              </button>

              {/* Work From Home Button */}
              <button
                onClick={() => handleUpdateWorkMode('wfh')}
                disabled={updating}
                className={`relative rounded-lg border p-4 transition-all ${
                  currentStatus === 'wfh'
                    ? 'bg-blue-500/20 border-blue-500/40 dark:bg-blue-500/30'
                    : 'bg-zinc-100/50 border-zinc-200/50 dark:bg-zinc-700/30 dark:border-zinc-600/50 hover:bg-blue-500/10 hover:border-blue-500/30'
                } ${updating ? 'opacity-50' : ''}`}
              >
                <div className='flex items-center gap-3'>
                  <span className='text-2xl'>🏠</span>
                  <div className='text-left'>
                    <p
                      className={`font-semibold ${
                        currentStatus === 'wfh'
                          ? 'text-blue-800 dark:text-blue-200'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      Home
                    </p>
                    {currentStatus === 'wfh' && (
                      <p className='text-xs text-blue-600 dark:text-blue-400'>
                        Current
                      </p>
                    )}
                  </div>
                </div>
                {currentStatus === 'wfh' && (
                  <div className='absolute top-2 right-2'>
                    <svg
                      className='w-5 h-5 text-blue-600 dark:text-blue-400'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                )}
              </button>
            </div>
            <p className='text-xs text-zinc-500 dark:text-zinc-400 text-center'>
              Tap to change work mode
            </p>
          </div>
        )}

        {/* On Leave Display */}
        {!isWeekend && isOnLeave && (
          <div className='rounded-lg backdrop-blur-sm border p-4 bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/20'>
            <div className='flex items-center gap-3'>
              <span className='text-3xl'>🏖️</span>
              <div>
                <p className='text-lg font-semibold text-amber-800 dark:text-amber-200'>
                  On Leave
                </p>
                <p className='text-xs text-amber-600 dark:text-amber-300'>
                  You're on leave today
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No status yet (shouldn't happen with auto-mark, but fallback) */}
        {!isWeekend && !currentStatus && (
          <div className='rounded-lg backdrop-blur-sm border p-4 bg-zinc-500/10 border-zinc-500/20 dark:bg-zinc-500/20'>
            <div className='flex items-center gap-3'>
              <span className='text-3xl'>⏳</span>
              <div>
                <p className='text-lg font-semibold text-zinc-700 dark:text-zinc-200'>
                  Loading...
                </p>
                <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                  Fetching your attendance status
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Request Leave Section - Always visible */}
      <div className='rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg'>
        <div className='mb-4'>
          <h2 className='text-2xl font-bold text-zinc-900 dark:text-white'>
            Request Leave
          </h2>
          <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
            Plan your time off
          </p>
        </div>

        <button
          onClick={() => setIsLeaveSheetOpen(true)}
          className='group relative w-full overflow-hidden rounded-xl p-6 text-center transition-all hover:scale-[1.02] bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
        >
          <div className='text-4xl'>🏖️</div>
          <p className='mt-3 text-lg font-bold text-white drop-shadow-sm'>
            Add Leave
          </p>
          <p className='mt-1 text-sm text-amber-100'>Tap to add time off</p>
        </button>
      </div>

      <LeaveBottomSheet
        isOpen={isLeaveSheetOpen}
        onClose={() => setIsLeaveSheetOpen(false)}
        onLeaveRequested={onAttendanceMarked}
      />
    </div>
  );
}
