'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/Navigation';
import {
  YearlyLeavesReportData,
  generateYearlyLeavesReportHTML,
  exportToPDF,
} from '@/lib/pdf-export';

export default function YearlyLeavesReportPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<YearlyLeavesReportData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  // Include years from 4 years ago up to next year (dynamic range)
  const years = Array.from({ length: 6 }, (_, i) => currentYear + 1 - i);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/attendance/yearly-leaves-report?year=${selectedYear}`
      );
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch report on initial load only
  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportPDF = () => {
    if (!report || !session?.user) return;

    const html = generateYearlyLeavesReportHTML(
      report,
      session.user.name || 'User',
      session.user.email || ''
    );
    exportToPDF(html, `yearly-leaves-report-${report.year}.pdf`);
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
        return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
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
        return '🏖️';
    }
  };

  const remainingLeaves = report
    ? report.summary.quota.total - report.summary.totalLeaves
    : 0;

  return (
    <>
      <Navigation />
      <div className='min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950'>
        <div className='mx-auto max-w-5xl px-4 py-8 sm:px-6'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-zinc-900 dark:text-white'>
              Yearly Leaves Report
            </h1>
            <p className='mt-2 text-zinc-600 dark:text-zinc-400'>
              View your leave history and quota usage for any year
            </p>
          </div>

          {/* Filters */}
          <div className='mb-8 rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
                <div>
                  <label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className='w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white sm:w-32'
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={fetchReport}
                  disabled={loading}
                  className='flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600'
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
                      d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
                    />
                  </svg>
                  Filter
                </button>
              </div>

              <button
                onClick={handleExportPDF}
                disabled={!report || loading}
                className='flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 disabled:opacity-50'
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
                    d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                Export PDF
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className='flex items-center justify-center py-12'>
              <div className='h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent'></div>
            </div>
          )}

          {/* Report Content */}
          {!loading && report && (
            <>
              {/* Summary Cards */}
              <div className='mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4'>
                <div className='rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center'>
                  <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    {report.summary.plannedLeaves}
                    <span className='text-sm font-normal text-blue-500/70'>
                      /{report.summary.quota.planned}
                    </span>
                  </p>
                  <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
                    Planned
                  </p>
                </div>
                <div className='rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center'>
                  <p className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
                    {report.summary.unplannedLeaves}
                    <span className='text-sm font-normal text-amber-500/70'>
                      /{report.summary.quota.unplanned}
                    </span>
                  </p>
                  <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
                    Unplanned
                  </p>
                </div>
                <div className='rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center'>
                  <p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
                    {report.summary.parentalLeaves}
                    <span className='text-sm font-normal text-emerald-500/70'>
                      /{report.summary.quota.parental}
                    </span>
                  </p>
                  <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
                    Parental
                  </p>
                </div>
                <div className='rounded-xl bg-zinc-500/10 border border-zinc-500/20 p-4 text-center'>
                  <p className='text-2xl font-bold text-zinc-600 dark:text-zinc-400'>
                    {report.summary.totalLeaves}
                    <span className='text-sm font-normal text-zinc-500/70'>
                      /{report.summary.quota.total}
                    </span>
                  </p>
                  <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
                    Total Used
                  </p>
                </div>
              </div>

              {/* Remaining Leaves Banner */}
              <div
                className={`mb-4 rounded-xl p-4 text-center ${
                  remainingLeaves > 5
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : remainingLeaves > 0
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                }`}
              >
                <p
                  className={`text-lg font-semibold ${
                    remainingLeaves > 5
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : remainingLeaves > 0
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {remainingLeaves > 0
                    ? `${remainingLeaves} leaves remaining`
                    : 'No leaves remaining'}
                </p>
                <p className='text-sm text-zinc-600 dark:text-zinc-400'>
                  out of {report.summary.quota.total} total quota for{' '}
                  {selectedYear}
                </p>
              </div>

              {/* Unpaid Leaves Banner */}
              {(report.summary.unpaidLeaves || 0) > 0 && (
                <div className='mb-8 rounded-xl p-4 text-center bg-red-500/10 border border-red-500/20'>
                  <p className='text-lg font-semibold text-red-700 dark:text-red-400'>
                    {report.summary.unpaidLeaves} unpaid leave(s)
                  </p>
                  <p className='text-sm text-zinc-600 dark:text-zinc-400'>
                    Leaves beyond your quota (not paid)
                  </p>
                </div>
              )}

              {/* Records Table - Desktop */}
              {report.records.length > 0 && (
                <div className='hidden rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg overflow-hidden md:block'>
                  <table className='w-full'>
                    <thead>
                      <tr className='bg-zinc-100/80 dark:bg-zinc-700/50'>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-white'>
                          Date
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-white'>
                          Day
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-white'>
                          Leave Type
                        </th>
                        <th className='px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-white'>
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-zinc-200/50 dark:divide-zinc-700/50'>
                      {report.records.map((record, index) => (
                        <tr
                          key={index}
                          className='hover:bg-zinc-50/50 dark:hover:bg-zinc-700/30 transition-colors'
                        >
                          <td className='px-6 py-4 text-sm text-zinc-900 dark:text-white'>
                            {new Date(record.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className='px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400'>
                            {record.dayName}
                          </td>
                          <td className='px-6 py-4'>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getLeaveTypeStyle(record.leaveType)}`}
                            >
                              <span>{getLeaveTypeIcon(record.leaveType)}</span>
                              {record.leaveType}
                            </span>
                          </td>
                          <td className='px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate'>
                            {record.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Records List - Mobile */}
              {report.records.length > 0 && (
                <div className='space-y-3 md:hidden'>
                  {report.records.map((record, index) => (
                    <div
                      key={index}
                      className='rounded-xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-4 shadow-sm'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-medium text-zinc-900 dark:text-white'>
                            {new Date(record.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                            {record.dayName}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getLeaveTypeStyle(record.leaveType)}`}
                        >
                          <span>{getLeaveTypeIcon(record.leaveType)}</span>
                          {record.leaveType}
                        </span>
                      </div>
                      {record.notes && (
                        <p className='mt-2 text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-200/50 dark:border-zinc-700/50 pt-2'>
                          {record.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {report.records.length === 0 && (
                <div className='rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-12 text-center shadow-lg'>
                  <div className='text-4xl mb-4'>🎉</div>
                  <p className='text-zinc-900 dark:text-white font-medium'>
                    No leaves taken
                  </p>
                  <p className='text-zinc-500 dark:text-zinc-400 text-sm mt-1'>
                    You haven't used any leaves in {selectedYear}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
