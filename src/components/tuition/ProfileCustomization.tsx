import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Palette, Save, X, BookOpen, GraduationCap, User, Star, Heart, 
  Zap, Target, Award, Trophy, Lightbulb, Brain, Rocket, Sparkles,
  BookMarked, School, PenTool, Calculator, FlaskConical, Atom,
  Music, Palette as PaletteIcon, Camera, Gamepad2, Code, Globe, Coffee, Smile,
  ChevronRight, Settings2
} from 'lucide-react';
import { Tutee } from '../../types/tuition';
import { updateTuteeColors, updateTuteeIcon } from '../../services/tuteeService';

interface ProfileCustomizationProps {
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
  { name: 'Palette', label: 'Palette', component: PaletteIcon },
  { name: 'Camera', label: 'Camera', component: Camera },
  { name: 'Gamepad2', label: 'Game', component: Gamepad2 },
  { name: 'Code', label: 'Code', component: Code },
  { name: 'Globe', label: 'Globe', component: Globe },
  { name: 'Coffee', label: 'Coffee', component: Coffee },
  { name: 'Smile', label: 'Smile', component: Smile },
];

const ProfileCustomization = ({ tutee, onUpdate }: ProfileCustomizationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'icon'>('colors');
  const [selectedIcon, setSelectedIcon] = useState<string>(tutee.icon);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');

      let updated = tutee;

      // Save Colors
      const preset = PRESET_COLORS.find(p => 
        p.primary === tutee.colorScheme.primary && 
        p.secondary === tutee.colorScheme.secondary
      );
      if (preset) {
        updated = await updateTuteeColors({
          id: tutee.id,
          colorPrimary: preset.primary,
          colorSecondary: preset.secondary,
          colorGradient: preset.gradient,
        });
      }

      // Save Icon
      if (selectedIcon !== tutee.icon) {
        updated = await updateTuteeIcon({
          id: tutee.id,
          icon: selectedIcon,
        });
      }

      onUpdate(updated);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_COLORS[0]) => {
    onUpdate({
      ...tutee,
      colorScheme: {
        primary: preset.primary,
        secondary: preset.secondary,
        gradient: preset.gradient,
      },
    });
  };

  const getIconComponent = (iconName: string) => {
    const icon = AVAILABLE_ICONS.find(i => i.name === iconName);
    return icon ? icon.component : BookOpen;
  };

  const TuteeIcon = getIconComponent(tutee.icon);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl sm:rounded-2xl hover:bg-white transition-all shadow-sm hover:shadow-md active:scale-95 text-[10px] sm:text-sm font-black text-indigo-600 uppercase tracking-widest"
      >
        <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>Customize</span>
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-2xl w-full my-auto animate-modal-content border border-white/20 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-4 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-2xl shadow-lg transform rotate-3`}>
                  <TuteeIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Profile Settings</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Personalize your space</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-6 h-6 text-gray-300" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 bg-gray-50 rounded-2xl mb-8">
              <button
                onClick={() => setActiveTab('colors')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                  activeTab === 'colors' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <PaletteIcon className="w-4 h-4" />
                <span>Colors</span>
              </button>
              <button
                onClick={() => setActiveTab('icon')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                  activeTab === 'icon' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Smile className="w-4 h-4" />
                <span>Icon</span>
              </button>
            </div>

            <div className="space-y-8">
              {activeTab === 'colors' ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                    <p className="text-sm font-bold text-indigo-900/70 leading-relaxed">
                      Choose a color scheme that reflects your personality! These colors will be used for badges, buttons, and highlights.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {PRESET_COLORS.map((preset) => {
                      const isSelected = 
                        preset.primary === tutee.colorScheme.primary &&
                        preset.secondary === tutee.colorScheme.secondary;

                      return (
                        <button
                          key={preset.name}
                          onClick={() => handlePresetSelect(preset)}
                          className={`
                            p-3 rounded-2xl border-4 transition-all group relative overflow-hidden
                            ${isSelected 
                              ? 'border-indigo-500 bg-indigo-50/50 shadow-md' 
                              : 'border-transparent bg-gray-50 hover:bg-gray-100'
                            }
                          `}
                        >
                          <div className={`w-full h-16 rounded-xl mb-2 bg-gradient-to-br ${preset.gradient} shadow-inner transition-transform group-hover:scale-105 duration-300`} />
                          <p className={`text-[10px] font-black uppercase tracking-tight text-center ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                            {preset.name}
                          </p>
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                              <ChevronRight className="w-3 h-3 text-indigo-600" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                    <p className="text-sm font-bold text-indigo-900/70 leading-relaxed">
                      Pick an icon that represents you best. It will appear on your profile and next to your name.
                    </p>
                  </div>

                  {/* Current Selection Preview */}
                  <div className="flex items-center gap-6 p-6 bg-white border-2 border-dashed border-gray-100 rounded-[2rem]">
                    <div className={`p-5 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-[1.5rem] shadow-xl`}>
                      {(() => {
                        const SelectedIconComp = getIconComponent(selectedIcon);
                        return <SelectedIconComp className="w-10 h-10 text-white" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Active Selection</p>
                      <p className="text-2xl font-black text-gray-800">
                        {AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.label || selectedIcon}
                      </p>
                    </div>
                  </div>

                  {/* Icon Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-3">
                    {AVAILABLE_ICONS.map((icon) => {
                      const IconComponent = icon.component;
                      const isSelected = icon.name === selectedIcon;
                      const isCurrent = icon.name === tutee.icon;

                      return (
                        <button
                          key={icon.name}
                          onClick={() => {
                            setSelectedIcon(icon.name);
                            setError('');
                          }}
                          className={`
                            aspect-square rounded-2xl border-2 transition-all flex items-center justify-center relative group
                            ${isSelected 
                              ? 'border-indigo-500 bg-indigo-50 shadow-inner scale-105' 
                              : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-indigo-200'
                            }
                          `}
                          title={icon.label}
                        >
                          <IconComponent className={`w-6 h-6 transition-all duration-300 ${
                            isSelected ? 'text-indigo-600 scale-110' : 'text-gray-400 group-hover:text-indigo-400'
                          }`} />
                          
                          {isCurrent && !isSelected && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-shake flex items-center gap-3">
                  <X className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex-1 px-6 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r ${tutee.colorScheme.gradient}`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Apply Changes</span>
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

export default ProfileCustomization;

