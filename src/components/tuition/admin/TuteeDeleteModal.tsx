import { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import { deleteTutee } from '../../../services/tuteeService';

interface TuteeDeleteModalProps {
  tutee: Tutee;
  onDeleted: (id: string) => void;
}

const TuteeDeleteModal = ({ tutee, onDeleted }: TuteeDeleteModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (confirmName !== tutee.name) {
      setError('Name does not match');
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      await deleteTutee(tutee.id);
      onDeleted(tutee.id);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete tuition group');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setIsOpen(false);
      setConfirmName('');
      setError('');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors press-effect"
        title="Delete tuition group"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-modal-content border border-red-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Group?</h3>
                  <p className="text-sm text-gray-500">This action is permanent</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                <p className="text-sm text-red-800 leading-relaxed">
                  You are about to delete <span className="font-bold">"{tutee.name}"</span>. 
                  All associated sessions, earnings, and worksheet data will be permanently removed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Type group name to confirm
                </label>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => {
                    setConfirmName(e.target.value);
                    setError('');
                  }}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-red-500 outline-none transition-all font-medium"
                  placeholder={tutee.name}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleClose}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || confirmName !== tutee.name}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      <span>Delete</span>
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

export default TuteeDeleteModal;
