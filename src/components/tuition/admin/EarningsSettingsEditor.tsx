import { DollarSign } from 'lucide-react';
import { Tutee } from '../../../types/tuition';

interface EarningsSettingsEditorProps {
  tutee: Tutee;
  onSelectTutee?: (tuteeId: string) => void;
}

const EarningsSettingsEditor = ({ tutee, onSelectTutee }: EarningsSettingsEditorProps) => {
  const handleClick = () => {
    onSelectTutee?.(tutee.id);
    // Scroll to earnings section
    setTimeout(() => {
      const earningsSection = document.getElementById('earnings-admin-section');
      if (earningsSection) {
        earningsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors-smooth press-effect"
      title="View earnings settings"
    >
      <DollarSign className="w-4 h-4" />
    </button>
  );
};

export default EarningsSettingsEditor;
