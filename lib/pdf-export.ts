// PDF Export utilities using browser's print functionality
// This creates a clean printable version that can be saved as PDF

export interface MonthlyReportData {
  year: number;
  month: number;
  monthName: string;
  records: {
    date: string;
    dayName: string;
    status: string;
    notes?: string;
  }[];
  summary: {
    totalWorkDays: number;
    workFromOffice: number;
    workFromHome: number;
    leaves: number;
    unmarked: number;
  };
}

export interface YearlyLeavesReportData {
  year: number;
  records: {
    date: string;
    dayName: string;
    leaveType: string;
    notes?: string;
  }[];
  summary: {
    totalLeaves: number;
    plannedLeaves: number;
    unplannedLeaves: number;
    parentalLeaves: number;
    unpaidLeaves: number;
    otherLeaves: number;
    quota: {
      planned: number;
      unplanned: number;
      parental: number;
      total: number;
    };
  };
}

export function generateMonthlyReportHTML(
  data: MonthlyReportData,
  userName: string,
  userEmail: string
): string {
  const statusColors: Record<string, string> = {
    present: "#10b981",
    wfh: "#3b82f6",
    absent: "#f59e0b",
    unmarked: "#9ca3af",
  };

  const statusLabels: Record<string, string> = {
    present: "Office",
    wfh: "Work From Home",
    absent: "Leave",
    unmarked: "Not Marked",
  };

  const rows = data.records
    .map(
      (record) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${formatDate(record.date)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${record.dayName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; background-color: ${statusColors[record.status]}20; color: ${statusColors[record.status]};">
          ${statusLabels[record.status] || record.status}
        </span>
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Monthly Work Mode Report - ${data.monthName} ${data.year}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.5; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          @page { margin: 20mm; }
        }
      </style>
    </head>
    <body style="padding: 40px;">
      <div style="max-width: 800px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px;">Monthly Work Mode Report</h1>
          <p style="font-size: 18px; color: #4b5563;">${data.monthName} ${data.year}</p>
        </div>

        <!-- Employee Info -->
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="font-weight: 600; color: #111827;">${userName}</p>
          <p style="color: #6b7280; font-size: 14px;">${userEmail}</p>
        </div>

        <!-- Summary -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px;">
          <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #10b981;">${data.summary.workFromOffice}</p>
            <p style="font-size: 12px; color: #6b7280;">Office Days</p>
          </div>
          <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #3b82f6;">${data.summary.workFromHome}</p>
            <p style="font-size: 12px; color: #6b7280;">WFH Days</p>
          </div>
          <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #f59e0b;">${data.summary.leaves}</p>
            <p style="font-size: 12px; color: #6b7280;">Leave Days</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #6b7280;">${data.summary.totalWorkDays}</p>
            <p style="font-size: 12px; color: #6b7280;">Total Work Days</p>
          </div>
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Date</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Day</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af;">Track Attendance - Work Mode Report</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateYearlyLeavesReportHTML(
  data: YearlyLeavesReportData,
  userName: string,
  userEmail: string
): string {
  const leaveTypeColors: Record<string, string> = {
    "Planned Leave": "#3b82f6",
    "Unplanned Leave": "#f59e0b",
    "Parental Leave": "#10b981",
    "Unpaid Leave": "#ef4444",
    Leave: "#6b7280",
  };

  const rows = data.records
    .map(
      (record) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${formatDate(record.date)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${record.dayName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; background-color: ${leaveTypeColors[record.leaveType] || "#6b7280"}20; color: ${leaveTypeColors[record.leaveType] || "#6b7280"};">
          ${record.leaveType}
        </span>
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Yearly Leaves Report - ${data.year}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; line-height: 1.5; }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          @page { margin: 20mm; }
        }
      </style>
    </head>
    <body style="padding: 40px;">
      <div style="max-width: 800px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 8px;">Yearly Leaves Report</h1>
          <p style="font-size: 18px; color: #4b5563;">Year ${data.year}</p>
        </div>

        <!-- Employee Info -->
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="font-weight: 600; color: #111827;">${userName}</p>
          <p style="color: #6b7280; font-size: 14px;">${userEmail}</p>
        </div>

        <!-- Summary -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px;">
          <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #3b82f6;">${data.summary.plannedLeaves}/${data.summary.quota.planned}</p>
            <p style="font-size: 12px; color: #6b7280;">Planned Leaves</p>
          </div>
          <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #f59e0b;">${data.summary.unplannedLeaves}/${data.summary.quota.unplanned}</p>
            <p style="font-size: 12px; color: #6b7280;">Unplanned Leaves</p>
          </div>
          <div style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #10b981;">${data.summary.parentalLeaves}/${data.summary.quota.parental}</p>
            <p style="font-size: 12px; color: #6b7280;">Parental Leaves</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="font-size: 24px; font-weight: 700; color: #6b7280;">${data.summary.totalLeaves}/${data.summary.quota.total}</p>
            <p style="font-size: 12px; color: #6b7280;">Total Used</p>
          </div>
        </div>

        <!-- Remaining Leaves -->
        <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
          <p style="font-size: 14px; color: #92400e;">Remaining Leaves: <strong>${data.summary.quota.total - data.summary.totalLeaves}</strong> out of ${data.summary.quota.total}</p>
        </div>

        ${
          data.summary.unpaidLeaves > 0
            ? `
        <!-- Unpaid Leaves -->
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center; border: 1px solid #fecaca;">
          <p style="font-size: 14px; color: #dc2626;">Unpaid Leaves: <strong>${data.summary.unpaidLeaves}</strong> day(s)</p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 4px;">Leaves beyond quota (not paid)</p>
        </div>
        `
            : ""
        }

        <!-- Table -->
        ${
          data.records.length > 0
            ? `
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Date</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Day</th>
              <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Leave Type</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        `
            : `
        <div style="text-align: center; padding: 40px; color: #6b7280;">
          <p>No leaves taken in ${data.year}</p>
        </div>
        `
        }

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af;">Track Attendance - Yearly Leaves Report</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function exportToPDF(html: string, filename: string): void {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
