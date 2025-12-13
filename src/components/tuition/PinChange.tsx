import { useState } from 'react';
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
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors-smooth text-sm font-medium text-gray-700"
      >
        <Lock className="w-4 h-4" />
        <span>Change PIN</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-modal-content">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-lg`}>
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Change PIN</h3>
                  <p className="text-sm text-gray-600">{tutee.name}</p>
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
              <p className="text-sm text-gray-600">
                Enter your current PIN and choose a new 4-digit PIN.
              </p>

              {/* Current PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current PIN
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPin ? 'text' : 'password'}
                    value={currentPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCurrentPin(value);
                      setError('');
                    }}
                    placeholder="Enter current PIN"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                    maxLength={4}
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New PIN
                </label>
                <div className="relative">
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    value={newPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setNewPin(value);
                      setError('');
                    }}
                    placeholder="Enter new PIN"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                    maxLength={4}
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm PIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New PIN
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setConfirmPin(value);
                      setError('');
                    }}
                    placeholder="Confirm new PIN"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                    maxLength={4}
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700">PIN updated successfully!</p>
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
                  disabled={isSaving || !currentPin || !newPin || !confirmPin}
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
                      <span>Save PIN</span>
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

export default PinChange;

