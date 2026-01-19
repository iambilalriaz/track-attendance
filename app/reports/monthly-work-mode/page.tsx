'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/Navigation';
import {
  MonthlyReportData,
  generateMonthlyReportHTML,
  exportToPDF,
} from '@/lib/pdf-export';

export default function MonthlyWorkModeReportPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MonthlyReportData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const currentYear = new Date().getFullYear();
  // Include years from 4 years ago up to next year (dynamic range)
  const years = Array.from({ length: 6 }, (_, i) => currentYear + 1 - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/attendance/monthly-report?year=${selectedYear}&month=${selectedMonth}`
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

  const handleExportPDF = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      // Always fetch fresh data with current filter selections
      const response = await fetch(
        `/api/attendance/monthly-report?year=${selectedYear}&month=${selectedMonth}`
      );
      if (response.ok) {
        const data: MonthlyReportData = await response.json();
        const html = generateMonthlyReportHTML(
          data,
          session.user.name || 'User',
          session.user.email || ''
        );
        exportToPDF(html, `work-mode-report-${data.monthName}-${data.year}.pdf`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'wfh':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'absent':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Office';
      case 'wfh':
        return 'WFH';
      case 'absent':
        return 'Leave';
      default:
        return 'Not Marked';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return '🏢';
      case 'wfh':
        return '🏠';
      case 'absent':
        return '🏖️';
      default:
        return '⏳';
    }
  };

  return (
    <>
      <Navigation />
      <div className='min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950'>
        <div className='mx-auto max-w-5xl px-4 py-8 sm:px-6'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-3xl font-bold text-zinc-900 dark:text-white'>
              Monthly Work Mode Report
            </h1>
            <p className='mt-2 text-zinc-600 dark:text-zinc-400'>
              View your work mode history for any month
            </p>
          </div>

          {/* Filters */}
          <div className='mb-8 rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
                <div>
                  <label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className='w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white sm:w-44'
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
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
              <div className='mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4'>
                <div className='rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center'>
                  <p className='text-3xl font-bold text-emerald-600 dark:text-emerald-400'>
                    {report.summary.workFromOffice}
                  </p>
                  <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
                    Office Days
                  </p>
                </div>
                <div className='rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center'>
                  <p className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
                    {report.summary.workFromHome}
                  </p>
                  <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
                    WFH Days
                  </p>
                </div>
                <div className='rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center'>
                  <p className='text-3xl font-bold text-amber-600 dark:text-amber-400'>
                    {report.summary.leaves}
                  </p>
                  <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
                    Leave Days
                  </p>
                </div>
                <div className='rounded-xl bg-zinc-500/10 border border-zinc-500/20 p-4 text-center'>
                  <p className='text-3xl font-bold text-zinc-600 dark:text-zinc-400'>
                    {report.summary.totalWorkDays}
                  </p>
                  <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
                    Total Days
                  </p>
                </div>
              </div>

              {/* Records Table - Desktop */}
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
                        Status
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
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(record.status)}`}
                          >
                            <span>{getStatusIcon(record.status)}</span>
                            {getStatusLabel(record.status)}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400'>
                          {record.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Records List - Mobile */}
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
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusStyle(record.status)}`}
                      >
                        <span>{getStatusIcon(record.status)}</span>
                        {getStatusLabel(record.status)}
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

              {report.records.length === 0 && (
                <div className='rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-12 text-center shadow-lg'>
                  <p className='text-zinc-500 dark:text-zinc-400'>
                    No records found for {report.monthName} {report.year}
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
