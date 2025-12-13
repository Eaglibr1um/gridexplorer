import { useState } from 'react';
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

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-modal-content">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-lg`}>
                  <Edit2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Edit Tutee</h3>
                  <p className="text-sm text-gray-600">Update name and description</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors-smooth"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tutee name"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setError('');
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tutee description (e.g., 'Primary school Science and Math')"
                  disabled={isSaving}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors-smooth press-effect disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors-smooth press-effect disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
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
        </div>
      )}
    </>
  );
};

export default TuteeEditor;

