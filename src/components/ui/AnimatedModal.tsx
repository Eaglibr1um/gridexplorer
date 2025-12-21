import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  className?: string;
}

const AnimatedModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
}: AnimatedModalProps) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  if (!isOpen && !isClosing) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop ${
        isClosing ? 'animate-fade-out' : ''
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full my-auto ${sizeClasses[size]} ${
          isClosing ? 'animate-modal-content-out' : 'animate-modal-content'
        } ${className} border border-white/20 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100">
            {title && (
              <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">{title}</h3>
            )}
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-300" />
              </button>
            )}
          </div>
        )}
        <div className="p-6 sm:p-10">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default AnimatedModal;

