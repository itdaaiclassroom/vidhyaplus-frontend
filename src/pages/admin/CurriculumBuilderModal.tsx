import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Loader } from 'lucide-react';
import { createGrade, updateGrade, deleteGrade, createSubject, updateSubject, deleteSubject, createChapter, updateChapter, deleteChapter, createTopic, updateTopic, deleteTopic } from '@/api/client';
import { toast } from 'sonner';

interface CurriculumBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'grade' | 'subject' | 'chapter' | 'topic';
  parentData?: any; // e.g. selectedGrade for subject, selectedSubject for chapter, selectedChapter for topic
  existingList: any[];
  onRefresh: () => void;
}

export function CurriculumBuilderModal({ isOpen, onClose, entityType, parentData, existingList, onRefresh }: CurriculumBuilderModalProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editOrder, setEditOrder] = useState(0);

  const [newValue, setNewValue] = useState('');
  const [newOrder, setNewOrder] = useState(0);

  useEffect(() => {
    setItems(existingList);
  }, [existingList, isOpen]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!newValue.trim()) return toast.error('Name cannot be empty');
    setLoading(true);
    try {
      if (entityType === 'grade') {
        const id = parseInt(newValue.replace(/[^0-9]/g, '')) || items.length + 1;
        await createGrade({ id, grade_label: newValue });
      } else if (entityType === 'chapter') {
        if (!parentData?.subjectId || !parentData?.gradeId) throw new Error('Parent info missing');
        await createChapter({ subject_id: parentData.subjectId, grade_id: parentData.gradeId, chapter_name: newValue, chapter_no: newOrder || items.length + 1 });
      } else if (entityType === 'topic') {
        if (!parentData?.chapterId) throw new Error('Parent chapter missing');
        await createTopic({ chapter_id: parentData.chapterId, name: newValue, order_num: newOrder || items.length + 1 });
      } else if (entityType === 'subject') {
        // create subject mapping
        await createSubject({ name: newValue, grades: [parseInt(parentData?.gradeId || '0')], icon: '📚' });
      }
      toast.success(`${entityType} added successfully`);
      setNewValue('');
      setNewOrder(0);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: any) => {
    if (!editValue.trim()) return;
    setLoading(true);
    try {
      if (entityType === 'grade') {
        await updateGrade(id, { grade_label: editValue });
      } else if (entityType === 'chapter') {
        await updateChapter(id, { chapter_name: editValue, chapter_no: editOrder });
      } else if (entityType === 'topic') {
        await updateTopic(id, { name: editValue, order_num: editOrder });
      } else if (entityType === 'subject') {
        await updateSubject(id, { name: editValue });
      }
      toast.success('Updated successfully');
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (!window.confirm('Are you sure you want to delete this? It may remove associated data.')) return;
    setLoading(true);
    try {
      if (entityType === 'grade') await deleteGrade(id);
      else if (entityType === 'chapter') await deleteChapter(id);
      else if (entityType === 'topic') await deleteTopic(id);
      else if (entityType === 'subject') await deleteSubject(id, parentData?.gradeId);
      toast.success('Deleted successfully');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id || item);
    setEditValue(item.name || item.chapter_name || item.grade_label || `Class ${item}`);
    setEditOrder(item.order_num || item.chapter_no || 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 capitalize">Manage {entityType}s</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-2 items-center">
            <input 
              type="text" 
              placeholder={`New ${entityType} name...`}
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {(entityType === 'chapter' || entityType === 'topic') && (
              <input 
                type="number" 
                placeholder="Order"
                value={newOrder || ''}
                onChange={e => setNewOrder(parseInt(e.target.value) || 0)}
                className="w-20 h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            )}
            <button 
              onClick={handleAdd}
              disabled={loading}
              className="h-10 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => {
              const id = item.id || item;
              const name = item.name || item.chapter_name || item.grade_label || `Class ${item}`;
              const order = item.order_num || item.chapter_no || '';
              const isEditing = editingId === id;

              return (
                <div key={id || idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-slate-300 transition-colors group">
                  {isEditing ? (
                    <div className="flex flex-1 gap-2 items-center mr-2">
                      <input 
                        type="text" 
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="flex-1 h-8 px-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      {(entityType === 'chapter' || entityType === 'topic') && (
                        <input 
                          type="number" 
                          value={editOrder}
                          onChange={e => setEditOrder(parseInt(e.target.value) || 0)}
                          className="w-16 h-8 px-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {order && <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">#{order}</span>}
                      <span className="font-medium text-slate-700">{name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <button onClick={() => handleUpdate(id)} disabled={loading} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => startEdit(item)} disabled={loading} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(id)} disabled={loading} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded disabled:opacity-30">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <div className="text-center py-8 text-slate-400">No items found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
