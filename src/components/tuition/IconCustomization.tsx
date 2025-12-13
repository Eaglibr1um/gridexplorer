import { useState } from 'react';
import { 
  Smile, Save, X, BookOpen, GraduationCap, User, Star, Heart, 
  Zap, Target, Award, Trophy, Lightbulb, Brain, Rocket, Sparkles,
  BookMarked, School, PenTool, Calculator, FlaskConical, Atom,
  Music, Palette, Camera, Gamepad2, Code, Globe, Coffee
} from 'lucide-react';
import { Tutee } from '../../types/tuition';
import { updateTuteeIcon } from '../../services/tuteeService';

interface IconCustomizationProps {
  tutee: Tutee;
  onUpdate: (updatedTutee: Tutee) => void;
}

// Available icons for tutees to choose from
const AVAILABLE_ICONS = [
  { name: 'BookOpen', label: 'Book', component: BookOpen },
  { name: 'GraduationCap', label: 'Graduation', component: GraduationCap },
  { name: 'User', label: 'User', component: User },
  { name: 'Star', label: 'Star', component: Star },
  { name: 'Heart', label: 'Heart', component: Heart },
  { name: 'Zap', label: 'Zap', component: Zap },
  { name: 'Target', label: 'Target', component: Target },
  { name: 'Award', label: 'Award', component: Award },
  { name: 'Trophy', label: 'Trophy', component: Trophy },
  { name: 'Lightbulb', label: 'Lightbulb', component: Lightbulb },
  { name: 'Brain', label: 'Brain', component: Brain },
  { name: 'Rocket', label: 'Rocket', component: Rocket },
  { name: 'Sparkles', label: 'Sparkles', component: Sparkles },
  { name: 'BookMarked', label: 'Bookmarked', component: BookMarked },
  { name: 'School', label: 'School', component: School },
  { name: 'PenTool', label: 'Pen', component: PenTool },
  { name: 'Calculator', label: 'Calculator', component: Calculator },
  { name: 'FlaskConical', label: 'Chemistry', component: FlaskConical },
  { name: 'Atom', label: 'Atom', component: Atom },
  { name: 'Music', label: 'Music', component: Music },
  { name: 'Palette', label: 'Palette', component: Palette },
  { name: 'Camera', label: 'Camera', component: Camera },
  { name: 'Gamepad2', label: 'Game', component: Gamepad2 },
  { name: 'Code', label: 'Code', component: Code },
  { name: 'Globe', label: 'Globe', component: Globe },
  { name: 'Coffee', label: 'Coffee', component: Coffee },
  { name: 'Smile', label: 'Smile', component: Smile },
];

const IconCustomization = ({ tutee, onUpdate }: IconCustomizationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string>(tutee.icon);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!selectedIcon) {
      setError('Please select an icon');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const updated = await updateTuteeIcon({
        id: tutee.id,
        icon: selectedIcon,
      });

      onUpdate(updated);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save icon. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName);
    setError('');
  };

  const getIconComponent = (iconName: string) => {
    const icon = AVAILABLE_ICONS.find(i => i.name === iconName);
    return icon ? icon.component : BookOpen;
  };

  const CurrentIcon = getIconComponent(tutee.icon);
  const SelectedIcon = getIconComponent(selectedIcon);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors-smooth text-sm font-medium text-gray-700"
      >
        <CurrentIcon className="w-4 h-4" />
        <span>Change Icon</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-content">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-lg`}>
                  <CurrentIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Change Icon</h3>
                  <p className="text-sm text-gray-600">{tutee.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isSaving}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors-smooth"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose an icon that represents you. This icon will be displayed throughout the portal.
              </p>

              {/* Current Selection Preview */}
              <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Icon:</p>
                <div className="flex items-center gap-3">
                  <div className={`p-3 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-lg`}>
                    <SelectedIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.label || selectedIcon}
                    </p>
                    <p className="text-xs text-gray-600">This will be your new icon</p>
                  </div>
                </div>
              </div>

              {/* Icon Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {AVAILABLE_ICONS.map((icon) => {
                  const IconComponent = icon.component;
                  const isSelected = icon.name === selectedIcon;
                  const isCurrent = icon.name === tutee.icon;

                  return (
                    <button
                      key={icon.name}
                      onClick={() => handleIconSelect(icon.name)}
                      className={`
                        p-4 rounded-lg border-2 transition-all relative
                        ${isSelected 
                          ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                        ${isCurrent ? 'bg-green-50 border-green-300' : ''}
                      `}
                      title={icon.label}
                    >
                      <div className={`p-2 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      {isCurrent && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" title="Current icon" />
                      )}
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
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
                  disabled={isSaving || selectedIcon === tutee.icon}
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
                      <span>Save Icon</span>
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

export default IconCustomization;

