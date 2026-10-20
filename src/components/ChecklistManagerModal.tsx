import React, { useState } from 'react';
import {
  ListChecks,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { ChecklistItem } from '../types';

interface ChecklistManagerModalProps {
  checklists: ChecklistItem[];
  onSaveChecklist: (updatedChecklists: ChecklistItem[]) => void;
  onClose: () => void;
}

export const ChecklistManagerModal: React.FC<ChecklistManagerModalProps> = ({
  checklists,
  onSaveChecklist,
  onClose
}) => {
  const [items, setItems] = useState<ChecklistItem[]>(checklists);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ChecklistItem['category']>('Perimeter');
  const [isCritical, setIsCritical] = useState(false);
  const [notes, setNotes] = useState('');

  const handleStartEdit = (item: ChecklistItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setIsCritical(item.isCritical);
    setNotes(item.notes || '');
    setIsAddingNew(false);
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Perimeter');
    setIsCritical(false);
    setNotes('');
    setIsAddingNew(true);
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isAddingNew) {
      const newItem: ChecklistItem = {
        id: `chk-${Date.now()}`,
        title: title.trim(),
        category,
        checked: false,
        isCritical,
        isActive: true,
        notes: notes.trim() || undefined
      };
      const updated = [...items, newItem];
      setItems(updated);
      onSaveChecklist(updated);
    } else if (editingId) {
      const updated = items.map((item) =>
        item.id === editingId
          ? {
              ...item,
              title: title.trim(),
              category,
              isCritical,
              notes: notes.trim() || undefined
            }
          : item
      );
      setItems(updated);
      onSaveChecklist(updated);
    }

    handleCancelForm();
  };

  const handleToggleActive = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, isActive: item.isActive === false ? true : false } : item
    );
    setItems(updated);
    onSaveChecklist(updated);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to remove this checklist item?')) {
      const updated = items.filter((item) => item.id !== id);
      setItems(updated);
      onSaveChecklist(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E7DED2] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E7DED2] flex items-center justify-between bg-[#F8F5EF]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E8D8C5] text-[#6F4E37] rounded-xl border border-[#D5C2AD]">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#4B3621]">Inspection Checklist Library</h2>
              <p className="text-xs text-[#8B735B]">
                Configure standard inspection points assigned to patrol routes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8B735B] hover:text-[#4B3621] hover:bg-[#E8D8C5] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Top action */}
          {!isAddingNew && !editingId && (
            <button
              onClick={handleStartAdd}
              className="w-full py-3 px-4 bg-[#F8F5EF] hover:bg-[#F0E8DD] border-2 border-dashed border-[#D5C2AD] hover:border-[#6F4E37] text-[#6F4E37] font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Inspection Checklist Item
            </button>
          )}

          {/* Form for Add / Edit */}
          {(isAddingNew || editingId) && (
            <form onSubmit={handleSubmit} className="bg-[#F8F5EF] border border-[#E7DED2] rounded-xl p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E7DED2]">
                <h4 className="text-sm font-bold text-[#4B3621]">
                  {isAddingNew ? 'Register New Checklist Point' : 'Edit Checklist Item'}
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8B735B] uppercase tracking-wider mb-1">
                  Item / Checkpoint Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Check rear emergency exit locks and seal"
                  className="w-full bg-white border border-[#E7DED2] rounded-lg px-3 py-2 text-sm text-[#4B3621] placeholder-[#8B735B]/50 focus:outline-hidden focus:border-[#6F4E37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8B735B] uppercase tracking-wider mb-1">
                  Specific Guidance / Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Verify padlock is fully locked and latch is unobstructed"
                  className="w-full bg-white border border-[#E7DED2] rounded-lg px-3 py-2 text-sm text-[#4B3621] placeholder-[#8B735B]/50 focus:outline-hidden focus:border-[#6F4E37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#8B735B] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ChecklistItem['category'])}
                    className="w-full bg-white border border-[#E7DED2] rounded-lg px-3 py-2 text-sm text-[#4B3621] focus:outline-hidden focus:border-[#6F4E37]"
                  >
                    <option value="Perimeter">Perimeter & Boundary</option>
                    <option value="Access Control">Access Control & Locks</option>
                    <option value="Fire & Life Safety">Fire & Life Safety</option>
                    <option value="Utilities">Utilities & Power</option>
                    <option value="Equipment">Equipment & Assets</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#4B3621]">
                    <input
                      type="checkbox"
                      checked={isCritical}
                      onChange={(e) => setIsCritical(e.target.checked)}
                      className="w-4 h-4 rounded text-[#6F4E37] focus:ring-[#6F4E37] border-[#D5C2AD]"
                    />
                    Mark as Critical Checkpoint
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3.5 py-1.5 text-xs font-medium text-[#8B735B] hover:text-[#4B3621] bg-white border border-[#E7DED2] hover:bg-[#F0E8DD] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#6F4E37] hover:bg-[#5C3F2B] rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {isAddingNew ? 'Add to Checklist Library' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* List of current items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8B735B] px-1">
              <span>CONFIGURED INSPECTION POINTS ({items.length})</span>
              <span>STATUS / ACTIONS</span>
            </div>

            {items.map((item) => {
              const active = item.isActive !== false;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    active
                      ? 'bg-white border-[#E7DED2] hover:border-[#D5C2AD]'
                      : 'bg-[#F8F5EF] border-[#E7DED2] opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          active
                            ? 'bg-[#E8D8C5] text-[#6F4E37]'
                            : 'bg-[#E7DED2] text-[#8B735B]'
                        }`}
                      >
                        {item.category}
                      </span>
                      {item.isCritical && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                          CRITICAL
                        </span>
                      )}
                      <span className="text-sm font-semibold text-[#4B3621]">
                        {item.title}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-[#8B735B] pl-1">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleStartEdit(item)}
                      title="Edit Item"
                      className="p-1.5 text-[#8B735B] hover:text-[#4B3621] hover:bg-[#F0E8DD] rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleActive(item.id)}
                      title={active ? 'Deactivate Checklist Point' : 'Activate Checklist Point'}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {active ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-stone-400" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete Item"
                      className="p-1.5 text-[#8B735B] hover:text-[#C62828] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E7DED2] bg-[#F8F5EF] flex justify-between items-center">
          <span className="text-xs text-[#8B735B]">
            All changes are saved to browser local state for this demo.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-[#6F4E37] hover:bg-[#5C3F2B] rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
};
