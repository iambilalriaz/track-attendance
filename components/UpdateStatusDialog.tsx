'use client';

import { useEffect, useRef, useState } from 'react';

interface UpdateStatusDialogProps {
  isOpen: boolean;
  currentStatus: string;
  date: string;
  dayName: string;
  isLoading?: boolean;
  onUpdate: (status: 'present' | 'wfh') => void;
  onCancel: () => void;
}

export default function UpdateStatusDialog({
  isOpen,
  currentStatus,
  date,
  dayName,
  isLoading = false,
  onUpdate,
  onCancel,
}: UpdateStatusDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<'present' | 'wfh'>(
    currentStatus === 'wfh' ? 'wfh' : 'present'
  );

  // Reset selected status when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus === 'wfh' ? 'wfh' : 'present');
    }
  }, [isOpen, currentStatus]);

  // Handle escape key and disable background scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isLoading, onCancel]);

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button:not([disabled])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='update-status-dialog-title'
        className='relative w-full max-w-md animate-scale-in rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800'
      >
        {/* Icon */}
        <div className='mb-4 flex justify-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
            <svg
              className='h-6 w-6 text-blue-600 dark:text-blue-400'
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
          </div>
        </div>

        {/* Title */}
        <h3
          id='update-status-dialog-title'
          className='mb-2 text-center text-lg font-semibold text-zinc-900 dark:text-white'
        >
          Update Work Status
        </h3>

        {/* Date Info */}
        <p className='mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400'>
          {formattedDate} ({dayName})
        </p>

        {/* Status Options */}
        <div className='mb-6 grid grid-cols-2 gap-3'>
          {/* Work From Office Button */}
          <button
            type='button'
            onClick={() => setSelectedStatus('present')}
            disabled={isLoading}
            className={`relative rounded-lg border p-4 transition-all ${
              selectedStatus === 'present'
                ? 'bg-emerald-500/20 border-emerald-500/40 dark:bg-emerald-500/30'
                : 'bg-zinc-100/50 border-zinc-200/50 dark:bg-zinc-700/30 dark:border-zinc-600/50 hover:bg-emerald-500/10 hover:border-emerald-500/30'
            } ${isLoading ? 'opacity-50' : ''}`}
          >
            <div className='flex flex-col items-center gap-2'>
              <span className='text-2xl'>🏢</span>
              <p
                className={`font-semibold text-sm ${
                  selectedStatus === 'present'
                    ? 'text-emerald-800 dark:text-emerald-200'
                    : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                Office
              </p>
            </div>
            {selectedStatus === 'present' && (
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
            type='button'
            onClick={() => setSelectedStatus('wfh')}
            disabled={isLoading}
            className={`relative rounded-lg border p-4 transition-all ${
              selectedStatus === 'wfh'
                ? 'bg-blue-500/20 border-blue-500/40 dark:bg-blue-500/30'
                : 'bg-zinc-100/50 border-zinc-200/50 dark:bg-zinc-700/30 dark:border-zinc-600/50 hover:bg-blue-500/10 hover:border-blue-500/30'
            } ${isLoading ? 'opacity-50' : ''}`}
          >
            <div className='flex flex-col items-center gap-2'>
              <span className='text-2xl'>🏠</span>
              <p
                className={`font-semibold text-sm ${
                  selectedStatus === 'wfh'
                    ? 'text-blue-800 dark:text-blue-200'
                    : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                Home
              </p>
            </div>
            {selectedStatus === 'wfh' && (
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

        {/* Actions */}
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isLoading}
            className='flex-1 rounded-lg border-2 border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={() => onUpdate(selectedStatus)}
            disabled={isLoading}
            className='flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50'
          >
            {isLoading ? (
              <span className='flex items-center justify-center gap-2'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                Updating...
              </span>
            ) : (
              'Update Status'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
