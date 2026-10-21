import React, { useState } from 'react';
import {
  ListChecks,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  AlertTriangle,
  Building2,
  BookmarkCheck,
  Save,
  RotateCcw,
  Library,
  HelpCircle
} from 'lucide-react';
import { Site, ChecklistItem } from '../types';

interface SiteChecklistModalProps {
  site: Site;
  masterLibrary: ChecklistItem[];
  onSaveSiteChecklist: (siteId: string, updatedChecklists: ChecklistItem[]) => void;
  onClose: () => void;
}

export const SiteChecklistModal: React.FC<SiteChecklistModalProps> = ({
  site,
  masterLibrary,
  onSaveSiteChecklist,
  onClose
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    if (site.checklistTemplates && site.checklistTemplates.length > 0) {
      return [...site.checklistTemplates];
    }
    return [...masterLibrary.slice(0, 4)];
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isImportLibraryOpen, setIsImportLibraryOpen] = useState(false);

  // Form states for creating / editing checkpoint
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ChecklistItem['category']>('Perimeter');
  const [isCritical, setIsCritical] = useState(false);
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleStartAdd = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Perimeter');
    setIsCritical(false);
    setNotes('');
    setIsAddingNew(true);
    setIsImportLibraryOpen(false);
  };

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setIsCritical(item.isCritical);
    setNotes(item.notes || '');
    setIsAddingNew(false);
    setIsImportLibraryOpen(false);
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setTitle('');
    setNotes('');
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isAddingNew) {
      const newItem: ChecklistItem = {
        id: `sitechk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: title.trim(),
        category,
        checked: false,
        isCritical,
        isActive: true,
        notes: notes.trim() || undefined
      };
      setItems((prev) => [...prev, newItem]);
    } else if (editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title: title.trim(),
                category,
                isCritical,
                notes: notes.trim() || undefined
              }
            : item
        )
      );
    }
    handleCancelForm();
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isActive: item.isActive === false ? true : false } : item
      )
    );
  };

  const handleImportSelectedFromLibrary = (selectedIds: string[]) => {
    const toAdd = masterLibrary
      .filter((m) => selectedIds.includes(m.id) && !items.some((it) => it.title.toLowerCase() === m.title.toLowerCase()))
      .map((m) => ({
        ...m,
        id: `sitechk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }));
    setItems((prev) => [...prev, ...toAdd]);
    setIsImportLibraryOpen(false);
  };

  const handleResetToStandard = () => {
    if (confirm('Reset this site checklist to the standard template checkpoints?')) {
      setItems([...masterLibrary.slice(0, 5)]);
    }
  };

  const handleFinalSave = () => {
    onSaveSiteChecklist(site.id, items);
    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E7DED2] flex items-center justify-between bg-[#F8F5EF]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E8D8C5] text-[#6F4E37] rounded-xl border border-[#D5C2AD]">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#4B3621]">
                  Site Master Checklist · {site.name}
                </h2>
                <span className="text-[10px] font-mono text-[#6F4E37] bg-[#F5EFE6] px-2 py-0.5 rounded border border-[#E7DED2]">
                  {items.length} Master Checkpoints
                </span>
              </div>
              <p className="text-xs text-[#8B735B]">
                Client: <strong>{site.clientName}</strong> · Zone: <strong>{site.area}</strong> (Site-Specific Master Checklist)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8B735B] hover:text-[#4B3621] hover:bg-[#E8D8C5] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Info Box */}
        <div className="bg-[#FAF7F2] border-b border-[#E7DED2] px-4 py-2.5 flex items-center justify-between text-xs text-[#8B735B]">
          <span className="flex items-center gap-1.5 text-[11px]">
            <BookmarkCheck className="w-4 h-4 text-[#6F4E37] shrink-0" />
            <span>Dedicated Master Checklist for this site. Field officers inspecting this site will evaluate <strong>only</strong> these checkpoints.</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportLibraryOpen(!isImportLibraryOpen)}
              className="text-[#6F4E37] font-semibold hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <Library className="w-3.5 h-3.5" />
              <span>Library Presets</span>
            </button>
            <span className="text-[#D5C2AD]">|</span>
            <button
              onClick={handleResetToStandard}
              className="text-[#8B735B] hover:text-[#4B3621] flex items-center gap-1 cursor-pointer text-[11px]"
              title="Reset to default checkpoints"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* Top Add Button */}
          {!isAddingNew && !editingId && (
            <button
              onClick={handleStartAdd}
              className="w-full py-2.5 px-3 bg-[#FAF7F2] hover:bg-[#F0E8DD] border-2 border-dashed border-[#D5C2AD] hover:border-[#6F4E37] text-[#6F4E37] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Checkpoint to Site Master Checklist / मास्टर चेकपॉइंट जोड़ें</span>
            </button>
          )}

          {/* Quick Import Drawer */}
          {isImportLibraryOpen && (
            <div className="p-3 bg-[#F5EFE6] border border-[#D5C2AD] rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#4B3621]">
                <span className="flex items-center gap-1.5">
                  <Library className="w-4 h-4 text-[#6F4E37]" />
                  <span>Select Items to Add from Master Library</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsImportLibraryOpen(false)}
                  className="text-[#8B735B] hover:text-[#4B3621]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 p-1">
                {masterLibrary.map((libItem) => {
                  const alreadyExists = items.some(
                    (it) => it.title.toLowerCase() === libItem.title.toLowerCase()
                  );
                  return (
                    <div
                      key={libItem.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                        alreadyExists
                          ? 'bg-[#EFEAE2]/60 border-[#D5C2AD] text-[#8B735B]'
                          : 'bg-[#FFFFFF] border-[#E7DED2] text-[#4B3621] hover:border-[#6F4E37]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-medium truncate">{libItem.title}</span>
                        <span className="text-[10px] font-mono text-[#8B735B] bg-[#FAF7F2] border border-[#E7DED2] px-1.5 py-0.2 rounded shrink-0">
                          {libItem.category}
                        </span>
                      </div>
                      {alreadyExists ? (
                        <span className="text-[10px] font-semibold text-[#8B735B]">Added</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleImportSelectedFromLibrary([libItem.id])}
                          className="px-2 py-0.8 bg-[#6F4E37] text-white rounded text-[11px] font-bold hover:bg-[#5A3E2B] transition-colors cursor-pointer shrink-0"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add / Edit Form Box */}
          {(isAddingNew || editingId) && (
            <form onSubmit={handleSaveItem} className="p-3.5 bg-[#FAF7F2] border border-[#6F4E37]/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4B3621]">
                  {isAddingNew ? 'Create New Checkpoint for this Site' : 'Edit Site Checkpoint'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-[#8B735B] hover:text-[#4B3621]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B3621] mb-1">
                  Checkpoint Title * (चेकपॉइंट का नाम)
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Server Room Cold Aisle Temperature or Chemical Containment Valve"
                  className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#4B3621] mb-1">
                    Inspection Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ChecklistItem['category'])}
                    className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                  >
                    <option value="Perimeter">Perimeter (चारदीवारी / बाउंड्री)</option>
                    <option value="Access Control">Access Control (गेट व ताला सुरक्षा)</option>
                    <option value="Fire & Life Safety">Fire & Life Safety (अग्निशमन / सुरक्षा)</option>
                    <option value="Utilities">Utilities (बिजली / पानी / यूटिलिटी)</option>
                    <option value="Equipment">Equipment (मशीन व उपकरण)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#4B3621] font-semibold">
                    <input
                      type="checkbox"
                      checked={isCritical}
                      onChange={(e) => setIsCritical(e.target.checked)}
                      className="w-4 h-4 rounded border-[#E7DED2] text-[#C62828] focus:ring-0 cursor-pointer"
                    />
                    <span>Mark as Critical Checkpoint (अनिवार्य)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4B3621] mb-1">
                  Patrol Inspection Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Verify seal number and ensure emergency light illuminates on switch test"
                  className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1 rounded-lg bg-[#E7DED2] text-[#4B3621] hover:bg-[#D5C2AD] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg bg-[#6F4E37] text-white hover:bg-[#5A3E2B] text-xs font-bold cursor-pointer"
                >
                  {isAddingNew ? 'Add to Checklist' : 'Update Checkpoint'}
                </button>
              </div>
            </form>
          )}

          {/* List of Site Checkpoints */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 bg-[#FFFFFF] border border-[#E7DED2] rounded-xl hover:border-[#8B735B] transition-colors flex items-start justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#E7DED2] text-[#8B735B] text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#4B3621] break-words">
                        {item.title}
                      </span>
                      {item.isCritical && (
                        <span className="text-[10px] font-bold text-[#C62828] bg-[#FFEBEE] border border-[#FFCDD2] px-1.5 py-0.2 rounded shrink-0">
                          Critical
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[#8B735B] bg-[#FAF7F2] border border-[#E7DED2] px-1.5 py-0.2 rounded shrink-0">
                        {item.category}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-[#8B735B] mt-1 break-words">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(item.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer border ${
                      item.isActive !== false
                        ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                        : 'bg-[#F0E8DD] text-[#8B735B] border-[#E7DED2]'
                    }`}
                    title="Toggle active status"
                  >
                    {item.isActive !== false ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="p-1 text-[#8B735B] hover:text-[#4B3621] hover:bg-[#F0E8DD] rounded transition-colors cursor-pointer"
                    title="Edit checkpoint"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-[#C62828] hover:text-[#B71C1C] hover:bg-[#FFEBEE] rounded transition-colors cursor-pointer"
                    title="Remove from site"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="p-6 text-center bg-[#FAF7F2] border border-dashed border-[#D5C2AD] rounded-xl text-xs text-[#8B735B] space-y-2">
                <AlertTriangle className="w-6 h-6 text-[#8B735B] mx-auto" />
                <p>No checklist checkpoints configured for this site yet.</p>
                <p>Click "Add Custom Checkpoint" or "Import From Library" above to assign inspection tasks.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between">
          <span className="text-xs text-[#8B735B]">
            {items.length} total checkpoint(s) configured for {site.name}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E7DED2] text-[#4B3621] hover:bg-[#F0E8DD] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFinalSave}
              className="px-4 py-1.5 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Site Master Checklist / मास्टर चेकलिस्ट सेव करें</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
