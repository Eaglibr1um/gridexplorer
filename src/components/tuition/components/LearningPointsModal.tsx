import { useState, useEffect } from 'react';
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

interface LearningPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutee: Tutee;
}

const LearningPointsModal = ({ isOpen, onClose, tutee }: LearningPointsModalProps) => {
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-modal-content">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-lg`}>
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Learning Points</h3>
                <p className="text-sm text-gray-600">{tutee.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors-smooth press-effect"
              >
                <Plus className="w-4 h-4" />
                <span>Add Points</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors-smooth"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading learning points...</div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : points.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No learning points yet</p>
              <button
                onClick={handleAdd}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Add your first learning points
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {points.map((point, index) => (
                <div
                  key={point.id}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 transition-colors-smooth animate-fade-in-up card-hover"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-gray-800">
                          {format(parseISO(point.sessionDate), 'EEEE, d MMMM yyyy')}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap mb-3">{point.points}</p>
                      {point.tags && point.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {point.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${tutee.colorScheme.gradient} text-white flex items-center gap-1`}
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(point)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors-smooth press-effect"
                        aria-label="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, pointId: point.id })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors-smooth press-effect"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-content">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingPoint ? 'Edit Learning Points' : 'Add Learning Points'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPoint(null);
                  setError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors-smooth"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Date
                </label>
                <input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Points *
                </label>
                <textarea
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your learning points from this session..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (optional)
                </label>
                <div className="flex gap-2 mb-2">
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
                    placeholder="Add a tag and press Enter"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors-smooth press-effect"
                  >
                    Add
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${tutee.colorScheme.gradient} text-white flex items-center gap-2`}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:bg-white/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPoint(null);
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors-smooth press-effect"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors-smooth press-effect"
                >
                  {editingPoint ? 'Update' : 'Save'} Points
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, pointId: null })}
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

