import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Save, X, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Tutee } from '../../types/tuition';
import { updateTuteePin } from '../../services/tuteeService';

interface PinChangeProps {
  tutee: Tutee;
  onUpdate: (updatedTutee: Tutee) => void;
}

const PinChange = ({ tutee, onUpdate }: PinChangeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError('');
    setSuccess(false);

    // Validation
    if (!currentPin || !newPin || !confirmPin) {
      setError('Please fill in all fields');
      return;
    }

    if (currentPin.length !== 4 || !/^\d{4}$/.test(currentPin)) {
      setError('Current PIN must be exactly 4 digits');
      return;
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PIN and confirmation do not match');
      return;
    }

    if (currentPin === newPin) {
      setError('New PIN must be different from current PIN');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const updated = await updateTuteePin({
        id: tutee.id,
        currentPin,
        newPin,
      });

      onUpdate(updated);
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update PIN. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setIsOpen(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      setSuccess(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl hover:bg-white transition-all shadow-sm hover:shadow-md active:scale-95 text-[10px] sm:text-sm font-black text-gray-600 uppercase tracking-widest"
      >
        <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>PIN</span>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-modal-backdrop">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-md w-full my-auto animate-modal-content border border-white/20 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-4 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-2xl shadow-lg`}>
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Change PIN</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Privacy & Security</p>
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
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100/50">
                <p className="text-xs font-bold text-amber-900/70 leading-relaxed">
                  Enter your current PIN and choose a new 4-digit secret code.
                </p>
              </div>

              {/* Current PIN */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Current PIN
                </label>
                <div className="relative group">
                  <input
                    type={showCurrentPin ? 'text' : 'password'}
                    value={currentPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCurrentPin(value);
                      setError('');
                    }}
                    placeholder="••••"
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all text-center text-2xl font-mono tracking-[1em] text-gray-800 shadow-inner"
                    maxLength={4}
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showCurrentPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* New PIN */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    New 4-Digit PIN
                  </label>
                  <div className="relative group">
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      value={newPin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setNewPin(value);
                        setError('');
                      }}
                      placeholder="••••"
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all text-center text-2xl font-mono tracking-[1em] text-gray-800 shadow-inner"
                      maxLength={4}
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm PIN */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Confirm New PIN
                  </label>
                  <div className="relative group">
                    <input
                      type={showConfirmPin ? 'text' : 'password'}
                      value={confirmPin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setConfirmPin(value);
                        setError('');
                      }}
                      placeholder="••••"
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all text-center text-2xl font-mono tracking-[1em] text-gray-800 shadow-inner"
                      maxLength={4}
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-shake flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border-2 border-green-100 rounded-2xl animate-fade-in flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-green-700">Success! Your PIN is now updated.</p>
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
                  disabled={isSaving || !currentPin || !newPin || !confirmPin}
                  className={`flex-1 px-6 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r ${tutee.colorScheme.gradient}`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update PIN</span>
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

export default PinChange;
