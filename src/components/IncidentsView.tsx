import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Building2,
  User,
  Clock,
  Check,
  ShieldCheck,
  Mic,
  MessageSquare,
  Plus
} from 'lucide-react';
import { IncidentRecord, IncidentSeverity, IncidentStatus } from '../types';
import { VoiceInputControl } from './VoiceInputControl';

interface IncidentsViewProps {
  incidents: IncidentRecord[];
  onUpdateIncidentStatus: (incidentId: string, status: IncidentStatus) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onUpdateIncidentStatus
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | IncidentSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [activeVoiceNoteId, setActiveVoiceNoteId] = useState<string | null>(null);
  const [voiceNotes, setVoiceNotes] = useState<Record<string, string>>({});
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const filteredIncidents = incidents.filter((inc) => {
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    return true;
  });

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#FFEBEE] text-[#B71C1C] border border-[#FFCDD2]">
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2]">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'investigating':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            Investigating
          </span>
        );
      case 'action_required':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFEBEE] text-[#B71C1C] border border-[#FFCDD2]">
            Action Required
          </span>
        );
      case 'resolved':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]">
            Resolved
          </span>
        );
    }
  };

  const handleSaveVoiceNote = (incidentId: string) => {
    setSaveFeedback(`Voice dispatch note logged for Incident #${incidentId}`);
    setActiveVoiceNoteId(null);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-[#4B3621] flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-[#6F4E37]" />
            <span>Incident Response & Escalation Desk</span>
          </h2>
          <p className="text-xs text-[#8B735B] mt-0.5">
            Security exceptions, perimeter breaches and safety incidents reported during field patrols
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-xs">
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'all'
                  ? 'bg-[#6F4E37] text-white shadow-2xs'
                  : 'text-[#8B735B] hover:text-[#4B3621]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'critical'
                  ? 'bg-[#B71C1C] text-white shadow-2xs'
                  : 'text-[#8B735B] hover:text-[#B71C1C]'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setSeverityFilter('high')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'high'
                  ? 'bg-[#C2410C] text-white shadow-2xs'
                  : 'text-[#8B735B] hover:text-[#C2410C]'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setSeverityFilter('medium')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                severityFilter === 'medium'
                  ? 'bg-[#D97706] text-white shadow-2xs'
                  : 'text-[#8B735B] hover:text-[#D97706]'
              }`}
            >
              Medium
            </button>
          </div>
        </div>
      </div>

      {saveFeedback && (
        <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs text-[#1B5E20] flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-10 text-center shadow-2xs">
            <ShieldCheck className="w-10 h-10 text-[#2E7D32] mx-auto mb-2" />
            <div className="text-sm font-bold text-[#4B3621]">No Incidents Found</div>
            <div className="text-xs text-[#8B735B] mt-1">
              No reported incidents match the selected severity filter.
            </div>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const currentVoiceNote = voiceNotes[incident.id] || '';
            const isVoiceInputOpen = activeVoiceNoteId === incident.id;

            return (
              <div
                key={incident.id}
                className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-4 sm:p-5 space-y-3 hover:border-[#8B735B] transition-colors shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7DED2] pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(incident.severity)}
                    {getStatusBadge(incident.status)}
                    <h3 className="text-sm font-bold text-[#4B3621]">
                      {incident.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-[#8B735B]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reported at {incident.reportedAt}</span>
                  </div>
                </div>

                {/* Site & Officer Info */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#8B735B]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#6F4E37]" />
                    <span>Site: <strong className="text-[#4B3621]">{incident.siteName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#6F4E37]" />
                    <span>Officer: <strong className="text-[#4B3621]">{incident.officerName}</strong></span>
                  </div>
                  <div className="text-[#8B735B] font-mono text-[11px]">
                    ID: {incident.id}
                  </div>
                </div>

                {/* Summary */}
                <div className="text-xs text-[#4B3621] bg-[#FAF7F2] p-3 rounded-lg border border-[#E7DED2] leading-relaxed">
                  <strong>Incident Summary:</strong> {incident.summary}
                </div>

                {/* Security Action Taken */}
                <div className="text-xs text-[#4B3621] bg-[#FAF7F2] p-3 rounded-lg border border-[#E7DED2] leading-relaxed">
                  <strong className="text-[#1B5E20] font-semibold">Resolution & Mitigation Actions:</strong> {incident.actionsTaken}
                </div>

                {/* Additional Voice Note if present */}
                {voiceNotes[incident.id] && (
                  <div className="text-xs text-[#4B3621] bg-[#E8F5E9] p-3 rounded-lg border border-[#C8E6C9] leading-relaxed">
                    <strong className="text-[#1B5E20]">Supervisor Voice Dispatch Note:</strong> {voiceNotes[incident.id]}
                  </div>
                )}

                {/* Voice Input Drawer */}
                {isVoiceInputOpen && (
                  <div className="p-3.5 bg-[#FAF7F2] border border-[#6F4E37]/30 rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-[#4B3621]">
                      <span className="flex items-center gap-1.5">
                        <Mic className="w-4 h-4 text-[#6F4E37]" />
                        <span>Dictate Incident Resolution Note (हिन्दी / English Voice Input)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveVoiceNoteId(null)}
                        className="text-xs text-[#8B735B] hover:text-[#4B3621]"
                      >
                        Cancel
                      </button>
                    </div>

                    <VoiceInputControl
                      currentText={currentVoiceNote}
                      onTranscriptReceived={(transcript) => {
                        setVoiceNotes((prev) => ({
                          ...prev,
                          [incident.id]: prev[incident.id] ? `${prev[incident.id]} ${transcript}` : transcript
                        }));
                      }}
                      fieldLabel="Incident Resolution Voice Note"
                      placeholderHint="Tap mic to speak notes in Hindi or English..."
                    />

                    <textarea
                      rows={2}
                      value={currentVoiceNote}
                      onChange={(e) =>
                        setVoiceNotes({
                          ...voiceNotes,
                          [incident.id]: e.target.value
                        })
                      }
                      placeholder="Add supervisor notes or speak using the microphone above..."
                      className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                    />

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveVoiceNote(incident.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      >
                        Save Note to Incident
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Status Changer & Voice Note Action */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E7DED2] text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveVoiceNoteId(isVoiceInputOpen ? null : incident.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] text-xs font-semibold border border-[#E7DED2] transition-colors cursor-pointer shadow-2xs"
                    >
                      <Mic className="w-3.5 h-3.5 text-[#6F4E37]" />
                      <span>{isVoiceInputOpen ? 'Close Voice Tool' : 'Voice Input Note (हिन्दी/Eng)'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {incident.status !== 'investigating' && (
                      <button
                        onClick={() => onUpdateIncidentStatus(incident.id, 'investigating')}
                        className="px-2.5 py-1 rounded bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border border-[#FDE68A] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Mark Investigating
                      </button>
                    )}
                    {incident.status !== 'action_required' && (
                      <button
                        onClick={() => onUpdateIncidentStatus(incident.id, 'action_required')}
                        className="px-2.5 py-1 rounded bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#B71C1C] border border-[#FFCDD2] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Flag Action Required
                      </button>
                    )}
                    {incident.status !== 'resolved' && (
                      <button
                        onClick={() => onUpdateIncidentStatus(incident.id, 'resolved')}
                        className="px-2.5 py-1 rounded bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] border border-[#C8E6C9] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3 h-3 text-[#2E7D32]" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
