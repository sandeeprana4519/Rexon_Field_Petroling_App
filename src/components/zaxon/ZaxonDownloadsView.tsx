import React, { useState, useMemo } from 'react';
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileCheck2,
  Compass,
  Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PatrolReport, Site, CompanyClientAccount } from '../../types';
import { downloadPatrolReportsCSV } from '../../utils/csvExport';
import { getTodayDateString, getOffsetDateString } from '../../utils/dateUtils';

interface ZaxonDownloadsViewProps {
  account: CompanyClientAccount;
  reports: PatrolReport[];
  sites: Site[];
}

export const ZaxonDownloadsView: React.FC<ZaxonDownloadsViewProps> = ({
  account,
  reports,
  sites
}) => {
  const [selectedRange, setSelectedRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  // Accurate Date Boundaries using date utilities
  const todayStr = getTodayDateString();
  const weekAgoStr = getOffsetDateString(-7);
  const monthAgoStr = getOffsetDateString(-30);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedRange === 'today' && r.scheduledDate !== todayStr) return false;
      if (selectedRange === 'week' && r.scheduledDate < weekAgoStr) return false;
      if (selectedRange === 'month' && r.scheduledDate < monthAgoStr) return false;
      if (selectedSiteId !== 'all' && r.siteId !== selectedSiteId) return false;
      return true;
    });
  }, [reports, selectedRange, selectedSiteId, todayStr, weekAgoStr, monthAgoStr]);

  const completedCount = filteredReports.filter((r) => r.status === 'completed').length;
  let totalPoints = 0;
  let verifiedPoints = 0;
  filteredReports.forEach((r) => {
    (r.checklist || []).forEach((c) => {
      totalPoints++;
      if (c.checked) verifiedPoints++;
    });
  });
  const compliancePct = totalPoints > 0 ? Math.round((verifiedPoints / totalPoints) * 100) : 100;

  // 1. High-Fidelity Client-Side PDF Generation via jsPDF & autoTable
  const handleDownloadPDF = () => {
    if (filteredReports.length === 0) {
      setDownloadFeedback('No patrol records found for the selected date range. Please select "All Time" or another range to export.');
      setTimeout(() => setDownloadFeedback(null), 4500);
      return;
    }
    setIsExporting(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const primaryColor = [111, 78, 55]; // #6F4E37 Coffee Brown
      const darkColor = [75, 54, 33];    // #4B3621
      const grayColor = [139, 115, 91];  // #8B735B

      // Header Banner
      doc.setFillColor(248, 245, 239);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('REXON FIELD PATROLLING APP', 14, 14);

      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('EXECUTIVE SECURITY PATROL AUDIT REPORT', 14, 21);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Official Verified Guard Presence & Incident Audit Sheet`, 14, 27);

      // Top Right Stamp
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`DATE GENERATED: ${todayStr}`, 196, 14, { align: 'right' });
      doc.text(`STATUS: VERIFIED RECORD`, 196, 19, { align: 'right' });
      doc.text(`AUDIT PERIOD: ${selectedRange.toUpperCase()}`, 196, 24, { align: 'right' });

      // Client & Facility Meta Block
      doc.setDrawColor(231, 222, 210);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, 42, 182, 28, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`Client Enterprise: ${account.companyName}`, 18, 49);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      const siteNameDisplay = selectedSiteId === 'all'
        ? (sites.length > 0 ? `${sites.map(s => s.name).join(', ')}` : 'All Authorized Facilities')
        : (sites.find(s => s.id === selectedSiteId)?.name || 'Facility');
      doc.text(`Facility / Site: ${siteNameDisplay}`, 18, 55);
      doc.text(`Primary Contact: ${account.name || account.fullName || 'Facility Manager'} | Phone: ${account.phone || 'N/A'}`, 18, 61);
      doc.text(`Address: ${account.address || sites[0]?.address || 'Registered Premises'}`, 18, 66);

      // Audit Summary Metrics Box
      doc.setFillColor(250, 247, 242);
      doc.roundedRect(14, 75, 182, 20, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('TOTAL AUDITED PATROLS', 22, 82);
      doc.text('COMPLETED AUDITS', 72, 82);
      doc.text('CHECKPOINTS COMPLIANCE', 120, 82);
      doc.text('AUDIT RESOLUTION', 165, 82);

      doc.setFontSize(11);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`${filteredReports.length}`, 22, 90);
      doc.text(`${completedCount}`, 72, 90);

      doc.setTextColor(27, 94, 32);
      doc.text(`${compliancePct}% (${verifiedPoints}/${totalPoints})`, 120, 90);

      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('100% Verified', 165, 90);

      // AutoTable with 100% of rows (Full complete ledger, no slicing)
      const tableRows = filteredReports.map((r) => {
        const verified = (r.checklist || []).filter((c) => c.checked).length;
        const total = (r.checklist || []).length;
        const devM = r.gpsStatus?.distanceDeviationMeters || 0;
        return [
          r.reportCode || 'REP-LOG',
          r.siteName || 'Facility',
          `${r.scheduledDate}\n${r.actualCheckInTime || r.scheduledTime || ''}`,
          `${r.officerName}\n(${r.officerBadge || 'RF'})`,
          `${verified}/${total} Checkpoints`,
          `${devM}m GPS deviation`,
          (r.incidents && r.incidents.length > 0) ? `Incident (${r.incidents.length})` : 'All Clear'
        ];
      });

      autoTable(doc, {
        head: [['Report Code', 'Facility', 'Date & Time', 'Officer', 'Checkpoints', 'GPS Dev', 'Status']],
        body: tableRows,
        startY: 102,
        theme: 'grid',
        headStyles: {
          fillColor: [111, 78, 55],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [75, 54, 33],
          lineColor: [231, 222, 210]
        },
        alternateRowStyles: {
          fillColor: [250, 247, 242]
        },
        margin: { left: 14, right: 14 },
        styles: {
          overflow: 'linebreak',
          cellPadding: 2.5
        },
        didDrawPage: (data) => {
          // Footer on each page
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
          doc.text(
            `REXON Verified Security Engine · Official Client Audit · Page ${data.pageNumber} of ${pageCount}`,
            14,
            288
          );
          doc.text(`CONFIDENTIAL - ISSUED TO ${account.companyName.toUpperCase()}`, 196, 288, { align: 'right' });
        }
      });

      // Save PDF file
      const cleanCompName = account.companyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `REXON_Security_Audit_${cleanCompName}_${selectedRange}_${todayStr}.pdf`;
      doc.save(filename);

      setDownloadFeedback(`PDF Audit Report "${filename}" successfully generated and downloaded (${filteredReports.length} full patrol records)!`);
      setTimeout(() => setDownloadFeedback(null), 5000);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setDownloadFeedback(`PDF export error: ${err?.message || 'Could not build PDF'}. Please use Print option.`);
      setTimeout(() => setDownloadFeedback(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. CSV Download Handler
  const handleDownloadCSV = () => {
    setIsExporting(true);
    try {
      const filename = `rexon_${account.companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_patrols_${selectedRange}.csv`;
      downloadPatrolReportsCSV(filteredReports, filename);
      setDownloadFeedback(`CSV export successful! (${filteredReports.length} patrol audit records downloaded)`);
      setTimeout(() => setDownloadFeedback(null), 4500);
    } catch (err: any) {
      console.error('CSV export failed:', err);
      setDownloadFeedback('Error exporting CSV. Please try again.');
      setTimeout(() => setDownloadFeedback(null), 4500);
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Print / Save Document
  const handlePrintAuditSheet = () => {
    if (filteredReports.length === 0) {
      setDownloadFeedback('No patrol records found to print. Please choose another date range.');
      setTimeout(() => setDownloadFeedback(null), 4000);
      return;
    }
    try {
      window.print();
    } catch (e) {
      console.warn('window.print error, triggering direct PDF download:', e);
      handleDownloadPDF();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E7DED2] rounded-2xl p-5 shadow-2xs">
        <h2 className="text-base font-bold text-[#4B3621]">
          Executive Audit Reports & Downloads
        </h2>
        <p className="text-xs text-[#8B735B] mt-0.5">
          Generate board-ready full PDF security audit sheets and CSV spreadsheets filtered strictly for <strong>{account.companyName}</strong>.
        </p>
      </div>

      {downloadFeedback && (
        <div className="p-3.5 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-xs font-bold text-[#1B5E20] flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
          <span>{downloadFeedback}</span>
        </div>
      )}

      {/* Filter Selection Card */}
      <div className="bg-white border border-[#E7DED2] rounded-2xl p-5 space-y-4 shadow-2xs">
        <h3 className="text-xs font-bold text-[#4B3621] uppercase tracking-wider">
          Export Scope Configuration
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[#4B3621] font-semibold mb-1.5">Date Period</label>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-medium focus:bg-white focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="today">Today (24 Hours)</option>
              <option value="week">Past 7 Days (Weekly Audit)</option>
              <option value="month">Past 30 Days (Monthly Audit)</option>
              <option value="all">All-Time Complete Patrol History</option>
            </select>
          </div>

          <div>
            <label className="block text-[#4B3621] font-semibold mb-1.5">Facility Selection</label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#4B3621] font-medium focus:bg-white focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Authorized Facilities ({sites.length})</option>
              {sites.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Data Summary & Actions */}
        <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E7DED2] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[#8B735B] block text-[10px] uppercase font-bold">Records Matched</span>
              <strong className="text-sm font-mono text-[#4B3621]">{filteredReports.length} patrols</strong>
            </div>
            <div>
              <span className="text-[#8B735B] block text-[10px] uppercase font-bold">Compliance Rate</span>
              <strong className="text-sm font-mono text-[#1B5E20]">{compliancePct}% compliance</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct High-Fidelity PDF Download Button */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-60"
              title="Download full formal PDF security audit file (.pdf)"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : 'Download Full PDF Report'}</span>
            </button>

            {/* Print / Save Document */}
            <button
              type="button"
              onClick={handlePrintAuditSheet}
              className="px-3.5 py-2 bg-white hover:bg-[#FAF7F2] text-[#4B3621] border border-[#E7DED2] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Print or save via browser print preview"
            >
              <Printer className="w-4 h-4 text-[#6F4E37]" />
              <span>Print Preview</span>
            </button>

            {/* CSV Download Button */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadCSV}
              className="px-3.5 py-2 bg-white hover:bg-[#FAF7F2] text-[#6F4E37] border border-[#E7DED2] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
              title="Download CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Sheet Preview (Styled for both Screen & Print) */}
      <div className="bg-white border border-[#E7DED2] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs print:border-none print:shadow-none print:p-0">
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b-2 border-[#4B3621] pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#8B735B]">
              OFFICIAL VERIFIED SECURITY PATROL AUDIT
            </span>
            <h1 className="text-2xl font-black text-[#4B3621] mt-0.5">
              {account.companyName}
            </h1>
            <p className="text-xs text-[#8B735B] mt-0.5">
              Automated Guard Presence Verification & Incident Summary Sheet
            </p>
          </div>

          <div className="text-right text-xs font-mono space-y-0.5">
            <div className="font-bold text-[#6F4E37]">REXON SECURITY OPERATIONS</div>
            <div className="text-[#8B735B]">Audit Date: {todayStr}</div>
            <div className="text-[#1B5E20] font-bold">STATUS: OFFICIAL RECORD</div>
          </div>
        </div>

        {/* Audit Metadata Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#FAF7F2] p-4 rounded-xl border border-[#E7DED2]">
          <div>
            <span className="text-[#8B735B] text-[10px] uppercase font-bold block">Audit Period</span>
            <strong className="text-[#4B3621] uppercase">{selectedRange}</strong>
          </div>
          <div>
            <span className="text-[#8B735B] text-[10px] uppercase font-bold block">Audited Patrols</span>
            <strong className="text-[#4B3621] font-mono">{filteredReports.length}</strong>
          </div>
          <div>
            <span className="text-[#8B735B] text-[10px] uppercase font-bold block">Checkpoints Verified</span>
            <strong className="text-[#1B5E20] font-mono">{verifiedPoints} / {totalPoints} ({compliancePct}%)</strong>
          </div>
          <div>
            <span className="text-[#8B735B] text-[10px] uppercase font-bold block">Recipient / Role</span>
            <strong className="text-[#4B3621] truncate block">{account.name || account.fullName || 'Facility Executive'} ({account.role.replace('company_', '')})</strong>
          </div>
        </div>

        {/* Patrol Log Ledger - FULL RECORDS (NO CUTOFF) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#4B3621] uppercase tracking-wide">
              Patrol Log Schedule & Check-in Verification ({filteredReports.length} Complete Records)
            </h4>
            <span className="text-[11px] text-[#8B735B] font-mono">
              Showing 100% of matched logs
            </span>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8B735B] border border-dashed border-[#E7DED2] rounded-xl">
              No patrol logs recorded for the selected filter period.
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#E7DED2] rounded-xl max-h-[500px] overflow-y-auto print:max-h-none print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#FAF7F2] z-10 print:static">
                  <tr className="border-b border-[#E7DED2] text-[#8B735B] uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-3">Report ID</th>
                    <th className="py-2.5 px-3">Facility</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Officer</th>
                    <th className="py-2.5 px-3">Checkpoints</th>
                    <th className="py-2.5 px-3">GPS Dev</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DED2]">
                  {filteredReports.map((r) => {
                    const verified = (r.checklist || []).filter((c) => c.checked).length;
                    const total = (r.checklist || []).length;
                    return (
                      <tr key={r.id} className="hover:bg-[#FAF7F2]">
                        <td className="py-2 px-3 font-mono font-bold text-[#4B3621]">{r.reportCode}</td>
                        <td className="py-2 px-3 font-medium text-[#4B3621]">{r.siteName}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-[#8B735B]">
                          {r.scheduledDate} {r.actualCheckInTime || r.scheduledTime}
                        </td>
                        <td className="py-2 px-3 text-[#4B3621]">{r.officerName} ({r.officerBadge})</td>
                        <td className="py-2 px-3 font-mono text-[#1B5E20]">{verified}/{total}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-[#8B735B]">{r.gpsStatus?.distanceDeviationMeters || 0}m</td>
                        <td className="py-2 px-3 uppercase font-bold text-[10px] text-[#1B5E20]">{r.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Signatures & Certification */}
        <div className="pt-8 border-t border-[#E7DED2] grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-4">
            <div className="h-10 border-b border-[#8B735B]/40" />
            <div className="text-[11px] text-[#8B735B]">
              REXON Operations Desk Officer
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-10 border-b border-[#8B735B]/40" />
            <div className="text-[11px] text-[#8B735B]">
              Authorized Company Representative ({account.companyName})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
