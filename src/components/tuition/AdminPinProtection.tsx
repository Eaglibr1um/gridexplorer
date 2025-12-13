import { useState, useRef, useEffect } from 'react';
import { Lock, X, AlertCircle, Shield } from 'lucide-react';

interface AdminPinProtectionProps {
  onPinVerified: () => void;
  onCancel: () => void;
  pinLength?: number;
  maxAttempts?: number;
}

const AdminPinProtection = ({ 
  onPinVerified, 
  onCancel,
  pinLength = 8,
  maxAttempts = 3 
}: AdminPinProtectionProps) => {
  const [pin, setPin] = useState<string[]>(Array(pinLength).fill(''));
  const [error, setError] = useState<string>('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handlePinChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (value && index < pinLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newPin.every((digit, i) => i === index ? digit !== '' : digit !== '') && index === pinLength - 1) {
      handleSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, pinLength);
    if (new RegExp(`^\\d{1,${pinLength}}$`).test(pastedData)) {
      const newPin = [...pin];
      for (let i = 0; i < pinLength; i++) {
        newPin[i] = pastedData[i] || '';
      }
      setPin(newPin);
      if (pastedData.length === pinLength) {
        handleSubmit(pastedData);
      } else {
        inputRefs.current[Math.min(pastedData.length, pinLength - 1)]?.focus();
      }
    }
  };

  const handleSubmit = (pinValue?: string) => {
    const pinToVerify = pinValue || pin.join('');
    
    if (pinToVerify.length !== pinLength) {
      setError(`Please enter a ${pinLength}-digit PIN`);
      return;
    }

    // Dispatch event for parent to verify
    const event = new CustomEvent('adminPinEntered', { detail: { pin: pinToVerify } });
    window.dispatchEvent(event);
  };

  // Listen for PIN verification result
  useEffect(() => {
    const handlePinResult = (e: CustomEvent) => {
      if (e.detail.verified) {
        onPinVerified();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          setIsLocked(true);
          setError(`Too many failed attempts. Please try again later.`);
        } else {
          setError(`Incorrect PIN. ${maxAttempts - newAttempts} attempt(s) remaining.`);
          setPin(Array(pinLength).fill(''));
          inputRefs.current[0]?.focus();
        }
      }
    };

    window.addEventListener('adminPinResult' as any, handlePinResult as EventListener);
    return () => {
      window.removeEventListener('adminPinResult' as any, handlePinResult as EventListener);
    };
  }, [attempts, maxAttempts, onPinVerified, pinLength]);

  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Locked</h2>
            <p className="text-gray-600 mb-6">
              Too many failed attempts. Please try again later.
            </p>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-modal-content">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Admin Access</h2>
              <p className="text-sm text-gray-600">Enter admin PIN</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                style={{
                  borderColor: error ? '#ef4444' : '#e5e7eb'
                }}
                disabled={isLocked}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors-smooth press-effect"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={pin.some(d => !d) || isLocked}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors-smooth press-effect"
          >
            Verify
          </button>
        </div>

        {attempts > 0 && attempts < maxAttempts && (
          <p className="mt-4 text-center text-sm text-gray-500">
            {maxAttempts - attempts} attempt(s) remaining
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminPinProtection;

