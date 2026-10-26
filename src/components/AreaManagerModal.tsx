import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Building2,
  Users,
  AlertTriangle,
  Compass
} from 'lucide-react';
import { Site, FieldOfficer } from '../types';

interface AreaManagerModalProps {
  areas: string[];
  sites: Site[];
  officers: FieldOfficer[];
  onAddArea: (newAreaName: string) => boolean | void;
  onEditArea: (oldAreaName: string, newAreaName: string) => void;
  onDeleteArea: (areaName: string) => boolean | void;
  onClose: () => void;
}

export const AreaManagerModal: React.FC<AreaManagerModalProps> = ({
  areas,
  sites,
  officers,
  onAddArea,
  onEditArea,
  onDeleteArea,
  onClose
}) => {
  const [newAreaInput, setNewAreaInput] = useState('');
  const [editingAreaName, setEditingAreaName] = useState<string | null>(null);
  const [editInputVal, setEditInputVal] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = newAreaInput.trim();
    if (!trimmed) {
      setErrorMsg('कृपया एरिया / ज़ोन का नाम दर्ज करें (Please enter an area/zone name).');
      return;
    }

    if (areas.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`"${trimmed}" एरिया / ज़ोन पहले से मौजूद है (Area already exists).`);
      return;
    }

    onAddArea(trimmed);
    setNewAreaInput('');
    setFeedbackMsg(`नया ज़ोन "${trimmed}" सफलतापूर्वक जोड़ा गया (Zone added).`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleStartEdit = (area: string) => {
    setEditingAreaName(area);
    setEditInputVal(area);
    setErrorMsg(null);
  };

  const handleSaveEdit = (oldArea: string) => {
    setErrorMsg(null);
    const trimmed = editInputVal.trim();
    if (!trimmed) {
      setErrorMsg('एरिया / ज़ोन का नाम खाली नहीं हो सकता (Area name cannot be empty).');
      return;
    }

    if (trimmed !== oldArea && areas.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`"${trimmed}" नाम से दूसरा एरिया / ज़ोन मौजूद है (Another area already has this name).`);
      return;
    }

    onEditArea(oldArea, trimmed);
    setEditingAreaName(null);
    setFeedbackMsg(`एरिया "${oldArea}" को बदलकर "${trimmed}" कर दिया गया (Zone renamed).`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDelete = (area: string) => {
    setErrorMsg(null);
    const linkedSites = sites.filter((s) => s.area === area);
    const linkedOfficers = officers.filter((o) => o.area === area);

    let confirmPrompt = `क्या आप एरिया / ज़ोन "${area}" को डिलीट करना चाहते हैं?`;
    if (linkedSites.length > 0 || linkedOfficers.length > 0) {
      confirmPrompt += `\nनोट: इस ज़ोन में ${linkedSites.length} साइट्स और ${linkedOfficers.length} गार्ड्स जुड़े हुए हैं।`;
    }

    if (confirm(confirmPrompt)) {
      onDeleteArea(area);
      setFeedbackMsg(`एरिया "${area}" को हटा दिया गया (Zone removed).`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#4B3621]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8D8C5] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4B3621] flex items-center gap-1.5">
                <span>Patrol Areas & Zones Management</span>
              </h3>
              <p className="text-xs text-[#8B735B]">
                पेट्रोलिंग एरिया / ज़ोन जोड़ें, एडिट करें या डिलीट करें (Manage patrol sectors)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8B735B] hover:text-[#4B3621] p-1.5 rounded-lg hover:bg-[#F0E8DD] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-xs text-[#C62828] flex items-start gap-2 shadow-2xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C62828]" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {feedbackMsg && (
            <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs text-[#1B5E20] flex items-center gap-2 shadow-2xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D32]" />
              <span className="font-semibold">{feedbackMsg}</span>
            </div>
          )}

          {/* Add New Zone Form */}
          <form onSubmit={handleAddNew} className="p-3.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl space-y-2">
            <label className="block text-xs font-bold text-[#4B3621] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span>Create New Patrol Area / Zone (नया एरिया / ज़ोन बनाएं)</span>
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <MapPin className="w-3.5 h-3.5 text-[#8B735B] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={newAreaInput}
                  onChange={(e) => {
                    setNewAreaInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="e.g. Zone North - Sector 62 Industrial Hub"
                  className="w-full pl-8 pr-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-xs text-[#4B3621] placeholder-[#8B735B]/70 focus:outline-none focus:border-[#6F4E37]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Zone (जोड़ें)</span>
              </button>
            </div>
          </form>

          {/* List of Configured Zones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8B735B] font-semibold px-1">
              <span>Configured Zones ({areas.length})</span>
              <span>Linked Records</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {areas.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-[#8B735B]">
                  कोई एरिया / ज़ोन उपलब्ध नहीं है। ऊपर से नया ज़ोन बनाएं।
                </div>
              ) : (
                areas.map((area, idx) => {
                  const linkedSitesCount = sites.filter((s) => s.area === area).length;
                  const linkedOfficersCount = officers.filter((o) => o.area === area).length;
                  const isEditingThis = editingAreaName === area;

                  return (
                    <div
                      key={area}
                      className="p-3 bg-[#FFFFFF] border border-[#E7DED2] hover:border-[#8B735B] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors shadow-2xs"
                    >
                      {isEditingThis ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editInputVal}
                            onChange={(e) => setEditInputVal(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-[#FAF7F2] border border-[#6F4E37] rounded-lg text-xs text-[#4B3621] font-bold focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(area)}
                            className="px-3 py-1.5 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAreaName(null)}
                            className="px-2.5 py-1.5 bg-[#FAF7F2] text-[#8B735B] hover:text-[#4B3621] border border-[#E7DED2] rounded-lg text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#E7DED2] text-[#6F4E37] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-[#4B3621] text-xs truncate flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                              <span className="truncate">{area}</span>
                            </div>
                            <div className="text-[10px] text-[#8B735B] flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-[#8B735B]" />
                                <span>{linkedSitesCount} Sites</span>
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-[#8B735B]" />
                                <span>{linkedOfficersCount} Officers</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {!isEditingThis && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(area)}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] transition-colors cursor-pointer"
                            title="Edit / Rename Zone"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#6F4E37]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(area)}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#FFEBEE] text-[#C62828] border border-[#E7DED2] hover:border-[#FFCDD2] transition-colors cursor-pointer"
                            title="Delete Zone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#E7DED2] bg-[#FAF7F2] flex justify-between items-center text-xs">
          <span className="text-[11px] text-[#8B735B]">
            All updates synchronize automatically with Site Creation & Filters.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold cursor-pointer shadow-2xs"
          >
            Done (संपन्न)
          </button>
        </div>
      </div>
    </div>
  );
};
