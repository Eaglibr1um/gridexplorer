import { useState } from 'react';
import { createPortal } from 'react-dom';
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

      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-md w-full my-auto animate-modal-content border border-white/20 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl shadow-inner">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Delete Group?</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Permanent Action</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-6 h-6 text-gray-300" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-5 bg-red-50/50 border-2 border-red-100 rounded-2xl">
                <p className="text-sm font-bold text-red-900/70 leading-relaxed">
                  You are about to delete <span className="text-red-600">"{tutee.name}"</span>. 
                  All associated sessions, earnings, and worksheet data will be <span className="underline decoration-red-200">permanently removed</span>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Type group name to confirm
                </label>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => {
                    setConfirmName(e.target.value);
                    setError('');
                  }}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-500 transition-all font-bold text-gray-800 shadow-inner"
                  placeholder={tutee.name}
                  autoFocus
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
                  disabled={isDeleting}
                  className="flex-1 px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || confirmName !== tutee.name}
                  className="flex-[2] px-6 py-4 text-white bg-red-500 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-red-600 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Delete</span>
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

export default TuteeDeleteModal;
