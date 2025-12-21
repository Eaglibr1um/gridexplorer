import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Save, X } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import { updateTuteeInfo } from '../../../services/tuteeService';

interface TuteeEditorProps {
  tutee: Tutee;
  onUpdate: (updatedTutee: Tutee) => void;
}

const TuteeEditor = ({ tutee, onUpdate }: TuteeEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(tutee.name);
  const [description, setDescription] = useState(tutee.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const updated = await updateTuteeInfo({
        id: tutee.id,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      onUpdate(updated);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update tutee. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setIsOpen(false);
      setName(tutee.name);
      setDescription(tutee.description || '');
      setError('');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors-smooth press-effect"
        title="Edit tutee"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-md w-full my-auto animate-modal-content border border-white/20 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-4 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-2xl shadow-lg`}>
                  <Edit2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Edit Tutee</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Profile Details</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-6 h-6 text-gray-300" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-800 shadow-inner"
                  placeholder="Tutee name"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setError('');
                  }}
                  rows={3}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-medium text-gray-800 shadow-inner resize-none"
                  placeholder="Tutee description (e.g., 'Primary school Science and Math')"
                  disabled={isSaving}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-shake flex items-center gap-3">
                  <X className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-bold text-red-700 uppercase tracking-wide">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className={`flex-[2] px-6 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r ${tutee.colorScheme.gradient}`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TuteeEditor;

