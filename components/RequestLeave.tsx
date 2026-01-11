'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type LeaveType = 'planned-leave' | 'unplanned-leave' | 'parental-leave';

interface RequestLeaveProps {
  onLeaveRequested: () => void;
}

export default function RequestLeave({ onLeaveRequested }: RequestLeaveProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('planned-leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    // Auto-set end date to same as start date if not set or before start date
    if (!endDate || new Date(endDate) < new Date(date)) {
      setEndDate(date);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/attendance/leave-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Leave added successfully! ${data.daysCount} day(s) marked.`
        );
        setIsOpen(false);
        setStartDate('');
        setEndDate('');
        setNotes('');
        onLeaveRequested();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      toast.error('Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className='flex items-center gap-3 rounded-xl bg-linear-to-r from-amber-600 to-amber-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-amber-700 hover:to-amber-800 hover:shadow-xl'
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
    );
  }

  return (
    <div className='rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-xl'>
      <div className='mb-6 flex items-center justify-between'>
        <h3 className='text-xl font-bold text-zinc-900 dark:text-white'>
          Add Leave
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className='text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
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

      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Leave Type */}
        <div>
          <label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
            Leave Type
          </label>
          <div className='grid grid-cols-3 gap-2'>
            <button
              type='button'
              onClick={() => setLeaveType('planned-leave')}
              className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                leaveType === 'planned-leave'
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:border-blue-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
              }`}
            >
              📅 Planned
            </button>
            <button
              type='button'
              onClick={() => setLeaveType('unplanned-leave')}
              className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                leaveType === 'unplanned-leave'
                  ? 'border-amber-600 bg-amber-600 text-white'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:border-amber-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
              }`}
            >
              ⚡ Unplanned
            </button>
            <button
              type='button'
              onClick={() => setLeaveType('parental-leave')}
              className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                leaveType === 'parental-leave'
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:border-emerald-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
              }`}
            >
              👶 Parental
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='startDate'
              className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'
            >
              Start Date
            </label>
            <input
              id='startDate'
              type='date'
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className='w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white'
              required
            />
          </div>
          <div>
            <label
              htmlFor='endDate'
              className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'
            >
              End Date
            </label>
            <input
              id='endDate'
              type='date'
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className='w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white'
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor='notes'
            className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'
          >
            Notes (Optional)
          </label>
          <textarea
            id='notes'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className='w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white'
            placeholder='Add any additional details...'
          />
        </div>

        {/* Submit Button */}
        <div className='flex gap-3'>
          <button
            type='submit'
            disabled={submitting}
            className='flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white transition-all hover:from-blue-700 hover:to-blue-800 disabled:opacity-50'
          >
            {submitting ? 'Adding...' : 'Add Leave'}
          </button>
          <button
            type='button'
            onClick={() => setIsOpen(false)}
            className='rounded-lg border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800'
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
