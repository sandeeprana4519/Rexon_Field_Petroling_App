import React, { useState } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  MessageSquare,
  History,
  FileCheck,
  Compass,
  Phone,
  Printer,
  Calendar,
  Video,
  Play,
  Download,
  Navigation
} from 'lucide-react';
import { PatrolReport, Site, IncidentRecord } from '../types';
import { SiteReportsDownloadModal } from './SiteReportsDownloadModal';
import { SiteInteractiveMap } from './SiteInteractiveMap';
import { getCallUrl, getWhatsAppUrl, WhatsAppIcon } from '../utils/contactUtils';
import { downloadSinglePatrolReportPDF } from '../utils/pdfExport';

interface SiteDetailModalProps {
  report: PatrolReport;
  site?: Site;
  allSiteIncidents: IncidentRecord[];
  isOfficerMode?: boolean;
  onClose: () => void;
  onUpdateReport?: (updated: PatrolReport) => void;
}

export const SiteDetailModal: React.FC<SiteDetailModalProps> = ({
  report,
  site,
  allSiteIncidents,
  isOfficerMode = false,
  onClose,
  onUpdateReport
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'gps_photos' | 'remarks' | 'incidents'>('checklist');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isSiteDownloadModalOpen, setIsSiteDownloadModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<PatrolReport>(report);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  React.useEffect(() => {
    setCurrentReport(report);
  }, [report]);

  const handleDownloadSinglePDF = async () => {
    setIsGeneratingPdf(true);
    setFeedback('Generating official PDF verification certificate for this patrol inspection...');
    try {
      const ok = await downloadSinglePatrolReportPDF(report, site);
      if (ok) {
        setFeedback(`PDF report for "${report.reportCode}" downloaded successfully!`);
      } else {
        setFeedback('PDF generation error. Please try Print Sheet option.');
      }
    } catch (err: any) {
      console.error('PDF error:', err);
      setFeedback('Could not generate PDF. Please try Print Sheet.');
    } finally {
      setIsGeneratingPdf(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handlePrintSheet = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('window.print blocked or failed:', err);
      handleDownloadSinglePDF();
    }
  };

  const completedChecklistCount = report.checklist.filter((i) => i.checked).length;
  const totalChecklistCount = report.checklist.length;
  const checklistCompletionPct = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;
  const displayIncidents = (report.incidents && report.incidents.length > 0) ? report.incidents : allSiteIncidents;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl w-full max-w-4xl h-[95vh] sm:h-[90vh] max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-[#4B3621]">
        {/* Compact Modal Header - Saves vertical space for the content */}
        <div className="p-3 sm:p-4 border-b border-[#E7DED2] bg-[#FAF7F2] shrink-0 space-y-2">
          {/* Top Row: Badges, Title & Close Button */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded font-mono text-[10px] sm:text-[11px] uppercase font-bold tracking-wider bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] whitespace-nowrap">
                  {report.reportCode}
                </span>
                <span className="text-xs text-[#8B735B]">·</span>
                <span className="text-[11px] sm:text-xs text-[#4B3621] font-semibold whitespace-nowrap">{report.area}</span>
                <span className="text-xs text-[#8B735B]">·</span>
                <span className="text-[10px] sm:text-[11px] font-mono text-[#1B5E20] bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#C8E6C9] font-bold uppercase whitespace-nowrap">
                  {report.status}
                </span>
                {report.finalVerdict && (
                  <span className={`text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded font-bold uppercase border whitespace-nowrap ${
                    report.finalVerdict === 'issue_found'
                      ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                      : 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                  }`}>
                    {report.finalVerdict === 'issue_found' ? 'Issues Logged' : 'All Clear'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h3 className="text-base sm:text-lg font-black text-[#4B3621] tracking-tight flex items-center gap-1.5">
                  {isOfficerMode ? (
                    <FileCheck className="w-4 h-4 text-[#6F4E37] shrink-0" />
                  ) : (
                    <Building2 className="w-4 h-4 text-[#6F4E37] shrink-0" />
                  )}
                  <span className="leading-snug">
                    {isOfficerMode ? `Patrol Report: ${report.siteName}` : report.siteName}
                  </span>
                </h3>

                <span className="text-xs text-[#8B735B] hidden sm:inline">|</span>

                <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#8B735B]">
                  {!isOfficerMode && <span>Client: <strong className="text-[#4B3621]">{site?.clientName || 'Client'}</strong> ·</span>}
                  <span>Officer: <strong className="text-[#4B3621]">{report.officerName} ({report.officerBadge})</strong></span>
                  <span>·</span>
                  <span className="font-mono">Time: <strong className="text-[#4B3621]">{report.completedAt || report.actualCheckInTime || report.scheduledTime}</strong></span>
                </div>
              </div>
            </div>

            {/* Direct Close Button in Top Right */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons Toolbar Row - Compact & Pure English */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#E7DED2]/70 text-[11px]">
            <div className="flex items-center gap-1.5">
              {/* Direct Single Patrol PDF Download */}
              <button
                type="button"
                onClick={handleDownloadSinglePDF}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold transition-colors cursor-pointer shadow-2xs text-[11px] disabled:opacity-60"
                title="Download this patrol report as official PDF certificate"
              >
                <Download className="w-3 h-3 shrink-0" />
                <span>{isGeneratingPdf ? 'Building PDF...' : 'Download PDF'}</span>
              </button>

              {site && (
                <button
                  type="button"
                  onClick={() => setIsSiteDownloadModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#4B3621] font-semibold border border-[#E7DED2] transition-colors cursor-pointer shadow-2xs text-[11px]"
                  title="Download Site Patrol Reports History (Daily / Weekly / Monthly)"
                >
                  <Calendar className="w-3 h-3 shrink-0 text-[#6F4E37]" />
                  <span>Site History</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrintSheet}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#4B3621] font-semibold border border-[#E7DED2] transition-colors cursor-pointer shadow-2xs text-[11px]"
                title="Print Patrol Audit Sheet"
              >
                <Printer className="w-3 h-3 text-[#6F4E37] shrink-0" />
                <span>Print</span>
              </button>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] text-[#8B735B]">
              <span className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E7DED2]">
                Geofence: <strong className="text-[#4B3621]">{site?.geofenceRadiusMeters || 50}m</strong>
              </span>
              <span className="bg-[#E8F5E9] text-[#1B5E20] px-1.5 py-0.5 rounded border border-[#C8E6C9] font-bold">
                GPS: {report.gpsStatus.distanceDeviationMeters}m deviation
              </span>
            </div>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className="bg-[#E8F5E9] border-b border-[#C8E6C9] px-3 py-1 text-xs text-[#1B5E20] flex items-center justify-between shrink-0 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>{feedback}</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs - Sleek, compact height leaving maximum room for content */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5 p-1.5 sm:px-3 bg-[#FAF7F2] border-b border-[#E7DED2] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`py-1.5 px-2 text-[11px] rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === 'checklist'
                ? 'bg-[#6F4E37] text-white border-[#6F4E37] font-bold shadow-2xs'
                : 'bg-white text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD] font-semibold shadow-2xs'
            }`}
          >
            <FileCheck className={`w-3 h-3 shrink-0 ${activeTab === 'checklist' ? 'text-white' : 'text-[#6F4E37]'}`} />
            <span className="truncate">Checklist ({completedChecklistCount}/{totalChecklistCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gps_photos')}
            className={`py-1.5 px-2 text-[11px] rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === 'gps_photos'
                ? 'bg-[#6F4E37] text-white border-[#6F4E37] font-bold shadow-2xs'
                : 'bg-white text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD] font-semibold shadow-2xs'
            }`}
          >
            <Camera className={`w-3 h-3 shrink-0 ${activeTab === 'gps_photos' ? 'text-white' : 'text-[#6F4E37]'}`} />
            <span className="truncate">GPS & Photos ({report.photos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('remarks')}
            className={`py-1.5 px-2 text-[11px] rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === 'remarks'
                ? 'bg-[#6F4E37] text-white border-[#6F4E37] font-bold shadow-2xs'
                : 'bg-white text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD] font-semibold shadow-2xs'
            }`}
          >
            <MessageSquare className={`w-3 h-3 shrink-0 ${activeTab === 'remarks' ? 'text-white' : 'text-[#6F4E37]'}`} />
            <span className="truncate">Remarks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('incidents')}
            className={`py-1.5 px-2 text-[11px] rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeTab === 'incidents'
                ? 'bg-[#6F4E37] text-white border-[#6F4E37] font-bold shadow-2xs'
                : 'bg-white text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD] font-semibold shadow-2xs'
            }`}
          >
            <History className={`w-3 h-3 shrink-0 ${activeTab === 'incidents' ? 'text-white' : 'text-[#6F4E37]'}`} />
            <span className="truncate">Incidents ({displayIncidents.length})</span>
          </button>
        </div>

        {/* Tab Content Body - Given maximum vertical space with generous scrolling room */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6 space-y-4 bg-[#FFFFFF]">
          {/* TAB 1: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              {/* Officer Mode Quick Report Summary */}
              {isOfficerMode && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                    <div className="text-[10px] font-mono text-[#8B735B] uppercase font-bold">Checkpoints</div>
                    <div className="text-base font-bold text-[#4B3621] mt-0.5">{completedChecklistCount}/{totalChecklistCount}</div>
                    <div className="text-[10px] text-[#1B5E20] font-semibold">{checklistCompletionPct}% Verified</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                    <div className="text-[10px] font-mono text-[#8B735B] uppercase font-bold">GPS Accuracy</div>
                    <div className="text-base font-bold text-[#1B5E20] mt-0.5">{report.gpsStatus.distanceDeviationMeters}m</div>
                    <div className="text-[10px] text-[#8B735B]">Within Site Radius</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                    <div className="text-[10px] font-mono text-[#8B735B] uppercase font-bold">Photos Captured</div>
                    <div className="text-base font-bold text-[#4B3621] mt-0.5">{report.photos.length}</div>
                    <div className="text-[10px] text-[#8B735B]">Proof Uploaded</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                    <div className="text-[10px] font-mono text-[#8B735B] uppercase font-bold">Security Status</div>
                    <div className={`text-base font-bold mt-0.5 ${report.finalVerdict === 'issue_found' ? 'text-[#C62828]' : 'text-[#1B5E20]'}`}>
                      {report.finalVerdict === 'issue_found' ? 'Issues' : 'Nominal'}
                    </div>
                    <div className="text-[10px] text-[#8B735B]">
                      {report.finalVerdict === 'issue_found' ? 'Action Required' : 'All Clear'}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#4B3621] break-words">
                    Checklist Execution Progress
                  </div>
                  <div className="text-[11px] text-[#8B735B] break-words mt-0.5 leading-snug">
                    {completedChecklistCount} of {totalChecklistCount} checkpoints inspected and verified
                  </div>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
                  <div className="text-sm font-bold font-mono text-[#6F4E37]">
                    {checklistCompletionPct}%
                  </div>
                  <div className="w-24 h-2 bg-[#E7DED2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6F4E37] transition-all duration-300"
                      style={{ width: `${checklistCompletionPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#E7DED2] border border-[#E7DED2] rounded-xl overflow-hidden bg-[#FFFFFF]">
                {report.checklist.map((item, index) => {
                  const isSafe = item.status === 'safe' || (item.checked && item.status !== 'issue_found');
                  const isIssue = item.status === 'issue_found';

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 flex items-start gap-3 transition-colors ${
                        isIssue ? 'bg-[#FFEBEE]/40' : 'hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isIssue ? (
                          <div className="w-5 h-5 rounded-md bg-[#FFEBEE] border border-[#FFCDD2] flex items-center justify-center text-[#C62828]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        ) : isSafe ? (
                          <div className="w-5 h-5 rounded-md bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#2E7D32]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-[#F0E8DD] border border-[#E7DED2] flex items-center justify-center text-[#8B735B]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8B735B]" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-[#4B3621]">
                            {index + 1}. {item.title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#F0E8DD] text-[#8B735B] font-mono border border-[#E7DED2]">
                            {item.category}
                          </span>
                          {item.isCritical && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FFEBEE] border border-[#FFCDD2] text-[#B71C1C] font-bold">
                              CRITICAL
                            </span>
                          )}
                          {isIssue && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FFEBEE] text-[#B71C1C] border border-[#FFCDD2] font-bold uppercase font-mono">
                              Issue: {item.issueSeverity || 'Medium'}
                            </span>
                          )}
                        </div>

                        {item.issueDescription && (
                          <div className="mt-1.5 text-xs text-[#B71C1C] bg-[#FFEBEE] border border-[#FFCDD2] rounded-lg p-2.5">
                            <strong>Issue Logged by Officer:</strong> {item.issueDescription}
                          </div>
                        )}

                        {item.notes && !item.issueDescription && (
                          <div className="mt-1.5 text-xs text-[#4B3621] bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-2.5">
                            <strong>Officer Note:</strong> {item.notes}
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] font-mono shrink-0 font-semibold">
                        {isIssue ? (
                          <span className="text-[#C62828] bg-[#FFEBEE] px-2 py-0.5 rounded border border-[#FFCDD2]">Issue Found</span>
                        ) : isSafe ? (
                          <span className="text-[#1B5E20] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#C8E6C9]">Safe</span>
                        ) : (
                          <span className="text-[#8B735B] bg-[#F0E8DD] px-2 py-0.5 rounded border border-[#E7DED2]">Not Checked</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GPS & PHOTOS */}
          {activeTab === 'gps_photos' && (
            <div className="space-y-6">
              {/* GPS Verification Card */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#6F4E37]" />
                    <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wide">
                      GPS Check-In Geofence Telemetry
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] font-bold">
                    SIMULATED DEMO GPS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E7DED2]">
                    <div className="text-[#8B735B] text-[11px]">Check-in Coordinates</div>
                    <div className="font-mono text-[#4B3621] font-bold mt-0.5">
                      {report.gpsStatus.lat ? report.gpsStatus.lat.toFixed(4) : (site?.coordinates?.lat?.toFixed(4) || '37.7842')}° N, {report.gpsStatus.lng ? report.gpsStatus.lng.toFixed(4) : (site?.coordinates?.lng?.toFixed(4) || '-122.3965')}° W
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E7DED2]">
                    <div className="text-[#8B735B] text-[11px]">Distance from Site Centroid</div>
                    <div className="font-mono text-[#1B5E20] font-bold mt-0.5">
                      {report.gpsStatus.distanceDeviationMeters} meters (Tolerance: {site?.geofenceRadiusMeters || 50}m)
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E7DED2]">
                    <div className="text-[#8B735B] text-[11px]">Fix Accuracy</div>
                    <div className="font-mono text-[#4B3621] font-bold mt-0.5">
                      ±{report.gpsStatus.accuracyMeters || 4.2} meters (High Precision)
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-[#1B5E20] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
                  <span>
                    <strong>Geofence Verification Status:</strong> {report.gpsStatus.label}
                  </span>
                </div>
              </div>

              {/* Interactive Site Map & Navigation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#6F4E37]" />
                  <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wide">
                    Site Location & Patrol Route Map · साइट लोकेशन मैप
                  </span>
                </div>
                <SiteInteractiveMap
                  site={site || {
                    id: report.siteId,
                    code: 'SITE',
                    name: report.siteName,
                    clientName: report.clientName || 'Client',
                    siteType: 'factory',
                    area: report.area,
                    address: `${report.siteName}, ${report.area}`,
                    contactPerson: '',
                    contactPhone: '',
                    patrolFrequency: '2x per shift',
                    geofenceRadiusMeters: 50,
                    coordinates: {
                      lat: report.gpsStatus.lat,
                      lng: report.gpsStatus.lng
                    },
                    securityStatus: 'normal',
                    isActive: true,
                    requiredDailyPatrols: 6,
                    completedPatrolsToday: 1,
                    activeOfficersCount: 1,
                    checklistTemplates: [],
                    incidentCount: 0
                  }}
                  heightClass="h-64 sm:h-72"
                  showNavigationButton={true}
                  officerLocation={report.gpsStatus.lat && report.gpsStatus.lng ? { lat: report.gpsStatus.lat, lng: report.gpsStatus.lng } : undefined}
                  officerName={report.officerName}
                />
              </div>

              {/* Photos Gallery */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#6F4E37]" />
                    <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wide">
                      Checkpoint Photo Captures ({report.photos.length})
                    </span>
                  </div>
                  <span className="text-xs text-[#8B735B]">
                    Timestamped proof of presence
                  </span>
                </div>

                {report.photos.length === 0 ? (
                  <div className="p-8 rounded-xl bg-[#FAF7F2] border border-dashed border-[#E7DED2] text-center text-xs text-[#8B735B]">
                    <Camera className="w-8 h-8 text-[#8B735B] mx-auto mb-2" />
                    <div>No checkpoint photos or videos uploaded for this patrol yet.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {report.photos.map((photo) => {
                      const isVideo = photo.mediaType === 'video' || photo.contentType?.startsWith('video/') || photo.url.includes('.mp4');

                      return (
                        <div
                          key={photo.id}
                          className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl overflow-hidden group hover:border-[#8B735B] transition-colors shadow-2xs flex flex-col justify-between"
                        >
                          <div
                            className="relative aspect-video bg-[#FAF7F2] overflow-hidden flex items-center justify-center cursor-pointer"
                            onClick={() => setSelectedPhoto(photo.url)}
                          >
                            {isVideo ? (
                              <video
                                src={photo.url}
                                controls
                                className="w-full h-full object-cover"
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={photo.url}
                                alt={photo.caption}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            )}

                            {/* Top Badges */}
                            <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                              <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1">
                                {isVideo ? <Video className="w-2.5 h-2.5 text-sky-400" /> : <Camera className="w-2.5 h-2.5 text-amber-300" />}
                                {isVideo ? 'VIDEO EVIDENCE' : 'PHOTO EVIDENCE'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white">
                                {photo.timestamp}
                              </span>
                            </div>

                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[#6F4E37] text-[10px] font-medium text-white shadow-xs pointer-events-none">
                              {photo.locationName}
                            </div>
                          </div>

                          <div className="p-3 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs text-[#4B3621] font-semibold">{photo.caption}</p>
                              {photo.fileSizeBytes && (
                                <span className="font-mono text-[10px] text-[#8B735B] shrink-0">
                                  {(photo.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-[#8B735B] flex items-center justify-between flex-wrap gap-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#8B735B]" />
                                <span>Location: {photo.locationName}</span>
                              </div>
                              {photo.storagePath && (
                                <span className="text-[9px] font-mono text-[#1B5E20] bg-[#E8F5E9] px-1.5 py-0.2 rounded border border-[#C8E6C9]">
                                  Cloud Storage Secured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REMARKS */}
          {activeTab === 'remarks' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#6F4E37]" />
                    <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wide">
                      Patrolling Officer Field Log
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#8B735B]">
                    Logged at {report.actualCheckInTime || report.scheduledTime}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#FFFFFF] border border-[#E7DED2] text-xs text-[#4B3621] leading-relaxed font-sans shadow-2xs">
                  "{report.officerRemarks}"
                </div>

                <div className="mt-4 pt-3 border-t border-[#E7DED2] flex items-center justify-between text-xs text-[#8B735B]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#E8D8C5] flex items-center justify-center font-bold text-[10px] text-[#4B3621]">
                      {report.officerName.slice(0, 2).toUpperCase()}
                    </div>
                    <span>Submitted by <strong>{report.officerName}</strong> · Badge {report.officerBadge}</span>
                  </div>
                  <span className="text-[#1B5E20] font-mono text-[11px] font-bold bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#C8E6C9]">
                    Officer Certified
                  </span>
                </div>
              </div>

              {/* Site Emergency Contacts Reference (Only in Owner Mode. In Officer Mode, redundant site details are removed) */}
              {!isOfficerMode ? (
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                  <div className="text-xs font-bold text-[#4B3621] mb-2">
                    Site Contact & Escalation Protocol
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#E7DED2] space-y-1.5">
                      <div className="text-[#8B735B] text-[11px] font-semibold">Site Manager Contact</div>
                      <div className="font-bold text-[#4B3621]">{site?.contactPerson || 'Martin Sterling'}</div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E7DED2]">
                        <div className="text-[#8B735B] text-[11px] flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-[#6F4E37]" />
                          <span>{site?.contactPhone || '+1 (555) 392-8811'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={getCallUrl(site?.contactPhone || '+15553928811')}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] transition-colors"
                            title={`Call ${site?.contactPerson || 'Site Contact'}`}
                          >
                            <Phone className="w-3 h-3 text-[#6F4E37]" />
                          </a>
                          <a
                            href={getWhatsAppUrl(site?.contactPhone || '+15553928811', `Hello ${site?.contactPerson || 'Site Manager'}, contacting regarding site security patrol audit.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 transition-colors"
                            title="WhatsApp Chat"
                          >
                            <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E7DED2]">
                      <div className="text-[#8B735B] text-[11px]">Facility Address</div>
                      <div className="font-semibold text-[#4B3621] mt-0.5">{site?.address || report.area}</div>
                      <div className="text-[#1B5E20] text-[11px] mt-1 font-medium">Active 24/7 Security Coverage</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] text-xs space-y-2.5">
                  <div className="font-bold text-[#4B3621] text-xs">Patrol Submission Audit Log</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E7DED2]">
                      <div className="text-[10px] text-[#8B735B] uppercase font-mono font-bold">Report Code</div>
                      <div className="font-mono font-bold text-[#6F4E37] mt-0.5">{report.reportCode}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E7DED2]">
                      <div className="text-[10px] text-[#8B735B] uppercase font-mono font-bold">Patrol Area</div>
                      <div className="font-bold text-[#4B3621] mt-0.5">{report.area}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E7DED2]">
                      <div className="text-[10px] text-[#8B735B] uppercase font-mono font-bold">Check-in Verification</div>
                      <div className="font-mono font-bold text-[#1B5E20] mt-0.5">{report.gpsStatus.distanceDeviationMeters}m deviation</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INCIDENT HISTORY */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#6F4E37]" />
                  <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wide">
                    Site Incident History & Audit Log ({allSiteIncidents.length})
                  </span>
                </div>
                <span className="text-xs text-[#8B735B]">
                  Total Recorded Events
                </span>
              </div>

              {allSiteIncidents.length === 0 ? (
                <div className="p-8 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] text-center text-xs text-[#8B735B]">
                  <CheckCircle2 className="w-8 h-8 text-[#2E7D32] mx-auto mb-2" />
                  <div className="text-[#4B3621] font-bold mb-1">Zero Open Incidents at this Site</div>
                  <div>All security checks and perimeter integrity nominal.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {allSiteIncidents.map((incident) => {
                    const isCritical = incident.severity === 'critical';
                    const isHigh = incident.severity === 'high';
                    return (
                      <div
                        key={incident.id}
                        className={`p-4 rounded-xl border shadow-2xs ${
                          isCritical
                            ? 'bg-[#FFEBEE]/50 border-[#FFCDD2]'
                            : isHigh
                            ? 'bg-[#FEF3C7]/50 border-[#FDE68A]'
                            : 'bg-[#FAF7F2] border-[#E7DED2]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                isCritical
                                  ? 'bg-[#FFEBEE] text-[#B71C1C] border border-[#FFCDD2]'
                                  : isHigh
                                  ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                                  : 'bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2]'
                              }`}
                            >
                              {incident.severity} SEVERITY
                            </span>
                            <span className="text-xs font-bold text-[#4B3621]">
                              {incident.title}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-[#8B735B]">
                            Reported at {incident.reportedAt}
                          </span>
                        </div>

                        <p className="text-xs text-[#4B3621] mb-2 leading-relaxed">
                          {incident.summary}
                        </p>

                        <div className="p-2.5 rounded bg-[#FFFFFF] border border-[#E7DED2] text-xs">
                          <strong className="text-[#8B735B] text-[11px] uppercase tracking-wide block mb-0.5 font-bold">
                            Action Taken by Security:
                          </strong>
                          <span className="text-[#4B3621]">{incident.actionsTaken}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-[#8B735B] pt-2 border-t border-[#E7DED2]">
                          <span>Reporting Officer: <strong className="text-[#4B3621]">{incident.officerName}</strong></span>
                          <span className="font-mono uppercase text-[#1B5E20] font-bold bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#C8E6C9]">
                            Status: {incident.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer - Slim, space-saving & pure English */}
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 border-t border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-[#8B735B] flex items-center gap-1.5 text-[11px]">
            <span>Report Code:</span>
            <span className="font-mono text-[#4B3621] font-bold bg-[#F0E8DD] px-1.5 py-0.5 rounded border border-[#E7DED2]">{report.reportCode}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSinglePDF}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
              title="Download single patrol verification certificate PDF"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>{isGeneratingPdf ? 'Building PDF...' : 'Download PDF'}</span>
            </button>

            {site && (
              <button
                type="button"
                onClick={() => setIsSiteDownloadModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#E7DED2] font-semibold text-xs transition-colors cursor-pointer hidden sm:flex items-center gap-1 shadow-2xs"
                title="Download site history reports"
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Site History</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2] font-bold text-xs transition-colors cursor-pointer shadow-2xs text-center"
            >
              {isOfficerMode ? 'Close Report' : 'Close Details'}
            </button>
          </div>
        </div>
      </div>

      {/* Site Reports Download Modal */}
      {isSiteDownloadModalOpen && site && (
        <SiteReportsDownloadModal
          site={site}
          reports={[report]}
          onClose={() => setIsSiteDownloadModalOpen(false)}
        />
      )}

      {/* Lightbox Modal for Photo or Video */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            {selectedPhoto.endsWith('.mp4') || selectedPhoto.includes('video') || selectedPhoto.startsWith('blob:') && report.photos.find(p => p.url === selectedPhoto)?.mediaType === 'video' ? (
              <video
                src={selectedPhoto}
                controls
                autoPlay
                className="w-full max-h-[80vh] rounded-xl border-2 border-white/20 shadow-2xl bg-black"
              />
            ) : (
              <img
                src={selectedPhoto}
                alt="Evidence Zoom"
                className="w-full max-h-[80vh] object-contain rounded-xl border-2 border-white/20 shadow-2xl"
              />
            )}
            <p className="text-center text-xs text-white/80 mt-2 font-medium">Click outside to close preview</p>
          </div>
        </div>
      )}
    </div>
  );
};
