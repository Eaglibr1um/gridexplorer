import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Plus, Edit2, Trash2, Calendar, Tag, X } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import {
  fetchLearningPoints,
  createLearningPoint,
  updateLearningPoint,
  deleteLearningPoint,
  LearningPoint as LearningPointType,
} from '../../../services/componentService';
import { format, parseISO } from 'date-fns';
import ConfirmationModal from '../../ui/ConfirmationModal';
import { getColorClasses, getStatClasses } from '../../../utils/colorUtils';

interface LearningPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutee: Tutee;
}

const LearningPointsModal = ({ isOpen, onClose, tutee }: LearningPointsModalProps) => {
  // Use safe color classes from utility
  const colorClasses = getColorClasses(tutee.colorScheme.primary);
  const statClasses = getStatClasses(tutee.colorScheme.primary);
  const gradientClass = tutee.colorScheme.gradient;

  const [points, setPoints] = useState<LearningPointType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState<LearningPointType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; pointId: string | null }>({
    isOpen: false,
    pointId: null,
  });

  const [formData, setFormData] = useState({
    sessionDate: format(new Date(), 'yyyy-MM-dd'),
    points: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPoints();
    }
  }, [isOpen, tutee.id]);

  const loadPoints = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchLearningPoints(tutee.id);
      setPoints(data);
    } catch (err) {
      setError('Failed to load learning points. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPoint(null);
    setFormData({
      sessionDate: format(new Date(), 'yyyy-MM-dd'),
      points: '',
      tags: [],
    });
    setTagInput('');
    setShowAddModal(true);
  };

  const handleEdit = (point: LearningPointType) => {
    setEditingPoint(point);
    setFormData({
      sessionDate: point.sessionDate,
      points: point.points,
      tags: point.tags || [],
    });
    setTagInput('');
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.points.trim()) {
      setError('Please enter learning points');
      return;
    }

    try {
      setError('');
      if (editingPoint) {
        await updateLearningPoint(editingPoint.id, {
          sessionDate: formData.sessionDate,
          points: formData.points.trim(),
          tags: formData.tags,
        });
      } else {
        await createLearningPoint(
          tutee.id,
          formData.sessionDate,
          formData.points.trim(),
          formData.tags
        );
      }
      await loadPoints();
      setShowAddModal(false);
      setEditingPoint(null);
    } catch (err) {
      setError('Failed to save learning point. Please try again.');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.pointId) return;

    try {
      await deleteLearningPoint(deleteConfirm.pointId);
      await loadPoints();
      setDeleteConfirm({ isOpen: false, pointId: null });
    } catch (err) {
      setError('Failed to delete learning point. Please try again.');
      console.error(err);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  if (!isOpen) return null;

  return (
    <>
      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-4xl w-full my-auto animate-modal-content border border-white/20 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-4 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-2xl shadow-lg transform rotate-3`}>
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Learning Points</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{tutee.name}'s Vault</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAdd}
                  className={`flex items-center gap-2 px-5 py-3 min-h-[44px] bg-gradient-to-r ${gradientClass} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:opacity-90 transition-all active:scale-95 touch-manipulation`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Points</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
                >
                  <X className="w-6 h-6 text-gray-300" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading points...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-shake flex items-center gap-3">
                <X className="w-5 h-5 text-red-600" />
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            ) : points.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                <BookOpen className="w-16 h-12 mx-auto mb-4 text-gray-200" />
                <p className="text-gray-400 font-bold text-lg mb-6">No learning points yet</p>
                <button
                  onClick={handleAdd}
                  className={`${statClasses.text} min-h-[44px] font-black uppercase tracking-widest text-sm hover:underline underline-offset-8 transition-all touch-manipulation`}
                >
                  Add your first entry ✨
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {points.map((point, index) => (
                  <div
                    key={point.id}
                    className={`p-6 bg-white border-2 border-gray-100 rounded-3xl hover:border-${primaryColor}-200 transition-all animate-fade-in-up shadow-sm hover:shadow-md group`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 ${statClasses.bg} rounded-lg`}>
                            <Calendar className={`w-4 h-4 ${statClasses.text}`} />
                          </div>
                          <span className="font-black text-gray-800 text-sm uppercase tracking-tight">
                            {format(parseISO(point.sessionDate), 'EEEE, d MMMM yyyy')}
                          </span>
                        </div>
                        <p className="text-gray-600 font-medium whitespace-pre-wrap leading-relaxed mb-4 text-lg">{point.points}</p>
                        {point.tags && point.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {point.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${tutee.colorScheme.gradient} text-white shadow-sm flex items-center gap-1.5`}
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(point)}
                          className={`p-3 min-h-[44px] min-w-[44px] ${statClasses.text} ${colorClasses.hoverBg} rounded-2xl transition-all active:scale-90 touch-manipulation`}
                          aria-label="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, pointId: point.id })}
                          className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Add/Edit Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-2xl w-full my-auto animate-modal-content border border-white/20 relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
                {editingPoint ? 'Edit Entry' : 'New Entry'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPoint(null);
                  setError('');
                }}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-6 h-6 text-gray-300" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Session Date
                </label>
                <input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  className={`w-full px-6 py-4 min-h-[48px] bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white ${colorClasses.focusBorder} transition-all font-bold text-gray-800 shadow-inner touch-target`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Learning Points *
                </label>
                <textarea
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  rows={6}
                  className={`w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white ${colorClasses.focusBorder} transition-all font-medium text-gray-800 shadow-inner resize-none`}
                  placeholder="Enter your learning points from this session..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Tags (optional)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Type and press Enter"
                    className={`flex-1 px-6 py-4 min-h-[48px] bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white ${colorClasses.focusBorder} transition-all font-bold text-gray-800 shadow-inner touch-target`}
                  />
                  <button
                    onClick={addTag}
                    className={`px-6 py-4 min-h-[44px] ${statClasses.bg} ${statClasses.text} rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-opacity-80 transition-all active:scale-95 touch-manipulation`}
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 flex items-center gap-2 group`}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-shake flex items-center gap-3">
                  <X className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPoint(null);
                    setError('');
                  }}
                  className="flex-1 px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className={`flex-1 px-6 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all bg-gradient-to-r ${tutee.colorScheme.gradient}`}
                >
                  {editingPoint ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm({ isOpen: false, pointId: null })}
        title="Delete Learning Point"
        message="Are you sure you want to delete this learning point? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default LearningPointsModal;

