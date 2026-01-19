'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

type LeaveType = 'planned-leave' | 'unplanned-leave' | 'parental-leave' | 'unpaid-leave';

export interface LeaveToEdit {
  date: string;
  leaveType: string;
  notes?: string;
}

interface LeaveBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLeaveRequested: () => void;
  editData?: LeaveToEdit | null;
}

function mapLeaveTypeToValue(leaveType: string): LeaveType {
  if (leaveType.includes('Planned')) return 'planned-leave';
  if (leaveType.includes('Unplanned')) return 'unplanned-leave';
  if (leaveType.includes('Parental')) return 'parental-leave';
  if (leaveType.includes('Unpaid')) return 'unpaid-leave';
  return 'planned-leave';
}

export default function LeaveBottomSheet({
  isOpen,
  onClose,
  onLeaveRequested,
  editData,
}: LeaveBottomSheetProps) {
  const [leaveType, setLeaveType] = useState<LeaveType>('planned-leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = !!editData;

  // Lock body scroll when bottom sheet is open and handle form state
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      // If editing, prefill the form
      if (editData) {
        setLeaveType(mapLeaveTypeToValue(editData.leaveType));
        setStartDate(editData.date);
        setEndDate(editData.date);
        setNotes(editData.notes || '');
      }
    } else {
      document.body.style.overflow = '';
      // Reset form when bottom sheet closes
      setStartDate('');
      setEndDate('');
      setNotes('');
      setLeaveType('planned-leave');
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, editData]);

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
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

      if (isEditMode) {
        // Update existing leave
        const response = await fetch('/api/attendance/leave', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originalDate: editData.date,
            newDate: startDate,
            leaveType,
            notes,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Leave updated successfully!');
          onClose();
          onLeaveRequested();
        } else {
          toast.error(data.error || 'Failed to update leave');
        }
      } else {
        // Create new leave
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

        const data = await response.json();

        if (response.ok) {
          toast.success(
            `Leave added successfully! ${data.daysCount} day(s) marked.`
          );
          onClose();
          onLeaveRequested();
        } else if (response.status === 409) {
          toast.error(data.message || 'Leave already exists for selected dates', {
            duration: 5000,
          });
        } else {
          toast.error(data.error || 'Failed to submit leave request');
        }
      }
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      toast.error('Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center sm:items-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className='relative w-full max-w-lg animate-slide-up sm:animate-none'>
        <div className='max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-xl'>
          <div className='mb-6 flex items-center justify-between'>
            <h3 className='text-xl font-bold text-zinc-900 dark:text-white'>
              {isEditMode ? 'Edit Leave' : 'Add Leave'}
            </h3>
            <button
              onClick={onClose}
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
              <div className='grid grid-cols-2 gap-2'>
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
                <button
                  type='button'
                  onClick={() => setLeaveType('unpaid-leave')}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                    leaveType === 'unpaid-leave'
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:border-red-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  💸 Unpaid
                </button>
              </div>
            </div>

            {/* Date Range - Show single date picker in edit mode */}
            {isEditMode ? (
              <div>
                <label
                  htmlFor='startDate'
                  className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'
                >
                  Date
                </label>
                <input
                  id='startDate'
                  type='date'
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setEndDate(e.target.value);
                  }}
                  className='w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white'
                  required
                />
              </div>
            ) : (
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
            )}

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
                {submitting
                  ? isEditMode
                    ? 'Updating...'
                    : 'Adding...'
                  : isEditMode
                    ? 'Update Leave'
                    : 'Add Leave'}
              </button>
              <button
                type='button'
                onClick={onClose}
                className='rounded-lg border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800'
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
