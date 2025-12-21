import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, AlertCircle } from 'lucide-react';

interface PinProtectionProps {
  tuteeName: string;
  onPinVerified: () => void;
  onCancel: () => void;
  maxAttempts?: number;
}

const PinProtection = ({ 
  tuteeName, 
  onPinVerified, 
  onCancel,
  maxAttempts = 3 
}: PinProtectionProps) => {
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
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
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 4 digits are entered
    if (newPin.every(digit => digit !== '') && index === 3) {
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
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d{1,4}$/.test(pastedData)) {
      const newPin = [...pin];
      for (let i = 0; i < 4; i++) {
        newPin[i] = pastedData[i] || '';
      }
      setPin(newPin);
      if (pastedData.length === 4) {
        handleSubmit(pastedData);
      } else {
        inputRefs.current[Math.min(pastedData.length, 3)]?.focus();
      }
    }
  };

  const handleSubmit = (pinValue?: string) => {
    const pinToVerify = pinValue || pin.join('');
    
    if (pinToVerify.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    // This will be handled by parent component
    // We'll pass the PIN to parent for verification
    const event = new CustomEvent('pinEntered', { detail: { pin: pinToVerify } });
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
          setPin(['', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      }
    };

    window.addEventListener('pinResult' as any, handlePinResult as EventListener);
    return () => {
      window.removeEventListener('pinResult' as any, handlePinResult as EventListener);
    };
  }, [attempts, maxAttempts, onPinVerified]);

  if (isLocked) {
    return createPortal(
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-modal-backdrop">
        <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full my-auto animate-modal-content border border-white/20 relative">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Lock className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">Access Denied</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-8">
              Too many failed attempts. Please contact your tutor to reset access.
            </p>
            <button
              onClick={onCancel}
              className="w-full px-8 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-modal-backdrop">
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-md w-full my-auto animate-modal-content border border-white/20 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-inner">
              <Lock className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Identity Check</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Accessing {tuteeName}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex gap-3 justify-center">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl font-black rounded-2xl border-4 border-gray-50 focus:border-indigo-500 focus:bg-white transition-all outline-none bg-gray-50 text-gray-900 shadow-inner"
                style={{
                  borderColor: error ? '#fee2e2' : undefined,
                  color: error ? '#ef4444' : '#111827'
                }}
                disabled={isLocked}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide">{error}</p>
          </div>
        )}

        {attempts > 0 && attempts < maxAttempts && (
          <p className="mt-6 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Security Warning: {maxAttempts - attempts} attempts left
          </p>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PinProtection;

