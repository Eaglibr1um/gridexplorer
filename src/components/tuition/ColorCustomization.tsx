import { useState } from 'react';
import { Palette, Save, X } from 'lucide-react';
import { Tutee } from '../../types/tuition';
import { updateTuteeColors } from '../../services/tuteeService';
import ConfirmationModal from '../ui/ConfirmationModal';

interface ColorCustomizationProps {
  tutee: Tutee;
  onUpdate: (updatedTutee: Tutee) => void;
}

const PRESET_COLORS = [
  { name: 'Pink & Purple', primary: 'pink', secondary: 'purple', gradient: 'from-pink-500 to-purple-600' },
  { name: 'Blue & Cyan', primary: 'blue', secondary: 'cyan', gradient: 'from-blue-500 to-cyan-600' },
  { name: 'Green & Teal', primary: 'green', secondary: 'teal', gradient: 'from-green-500 to-teal-600' },
  { name: 'Orange & Red', primary: 'orange', secondary: 'red', gradient: 'from-orange-500 to-red-600' },
  { name: 'Indigo & Purple', primary: 'indigo', secondary: 'purple', gradient: 'from-indigo-500 to-purple-600' },
  { name: 'Yellow & Amber', primary: 'yellow', secondary: 'amber', gradient: 'from-yellow-500 to-amber-600' },
  { name: 'Rose & Pink', primary: 'rose', secondary: 'pink', gradient: 'from-rose-500 to-pink-600' },
  { name: 'Emerald & Green', primary: 'emerald', secondary: 'green', gradient: 'from-emerald-500 to-green-600' },
];

const ColorCustomization = ({ tutee, onUpdate }: ColorCustomizationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const preset = PRESET_COLORS.find(p => 
      p.primary === tutee.colorScheme.primary && 
      p.secondary === tutee.colorScheme.secondary
    );

    if (!preset) {
      setError('Please select a color preset');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const updated = await updateTuteeColors({
        id: tutee.id,
        colorPrimary: preset.primary,
        colorSecondary: preset.secondary,
        colorGradient: preset.gradient,
      });

      onUpdate(updated);
      setIsOpen(false);
    } catch (err) {
      setError('Failed to save colors. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_COLORS[0]) => {
    setSelectedPreset(preset.name);
    onUpdate({
      ...tutee,
      colorScheme: {
        primary: preset.primary,
        secondary: preset.secondary,
        gradient: preset.gradient,
      },
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        <Palette className="w-4 h-4" />
        <span>Customise Colours</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-content">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-lg`}>
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Customise Colours</h3>
                  <p className="text-sm text-gray-600">{tutee.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose a colour scheme that will be used for your badges and highlights throughout the portal.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_COLORS.map((preset) => {
                  const isSelected = 
                    preset.primary === tutee.colorScheme.primary &&
                    preset.secondary === tutee.colorScheme.secondary;

                  return (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className={`
                        p-4 rounded-lg border-2 transition-all
                        ${isSelected 
                          ? 'border-indigo-500 ring-2 ring-indigo-200' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className={`w-full h-12 rounded mb-2 bg-gradient-to-br ${preset.gradient}`} />
                      <p className="text-xs font-medium text-gray-700">{preset.name}</p>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors-smooth press-effect disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
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
                      <span>Save Colours</span>
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

export default ColorCustomization;

