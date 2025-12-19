import { useState, useEffect } from 'react';
import { Plus, Save, X, BookOpen, GraduationCap, User, Star, Heart, Zap, Target, Award, Trophy, Lightbulb, Brain, Rocket, Sparkles, BookMarked, School, PenTool, Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2, Code, Globe, Coffee, Smile, Check, Layout } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import { createTutee } from '../../../services/tuteeService';
import { fetchDashboardComponents, assignComponentToTutee, DashboardComponent } from '../../../services/componentService';

const ICONS = [
  { name: 'BookOpen', icon: BookOpen },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'User', icon: User },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Zap', icon: Zap },
  { name: 'Target', icon: Target },
  { name: 'Award', icon: Award },
  { name: 'Trophy', icon: Trophy },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Brain', icon: Brain },
  { name: 'Rocket', icon: Rocket },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'BookMarked', icon: BookMarked },
  { name: 'School', icon: School },
  { name: 'PenTool', icon: PenTool },
  { name: 'Calculator', icon: Calculator },
  { name: 'FlaskConical', icon: FlaskConical },
  { name: 'Atom', icon: Atom },
  { name: 'Music', icon: Music },
  { name: 'Palette', icon: Palette },
  { name: 'Camera', icon: Camera },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Code', icon: Code },
  { name: 'Globe', icon: Globe },
  { name: 'Coffee', icon: Coffee },
  { name: 'Smile', icon: Smile },
];

const GRADIENTS = [
  { name: 'Pink to Purple', primary: 'pink', secondary: 'purple', gradient: 'from-pink-500 to-purple-600' },
  { name: 'Indigo to Blue', primary: 'indigo', secondary: 'blue', gradient: 'from-indigo-500 to-blue-600' },
  { name: 'Green to Teal', primary: 'green', secondary: 'teal', gradient: 'from-green-500 to-teal-600' },
  { name: 'Orange to Red', primary: 'orange', secondary: 'red', gradient: 'from-orange-500 to-red-600' },
  { name: 'Cyan to Blue', primary: 'cyan', secondary: 'blue', gradient: 'from-cyan-500 to-blue-600' },
  { name: 'Amber to Orange', primary: 'amber', secondary: 'orange', gradient: 'from-amber-500 to-orange-600' },
];

interface TuteeCreatorProps {
  onCreated: (newTutee: Tutee) => void;
}

const TuteeCreator = ({ onCreated }: TuteeCreatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('BookOpen');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [availableModules, setAvailableModules] = useState<DashboardComponent[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const loadModules = async () => {
        try {
          setLoadingModules(true);
          const modules = await fetchDashboardComponents();
          setAvailableModules(modules);
          // By default select all modules
          setSelectedModules(modules.map(m => m.id));
        } catch (err) {
          console.error('Failed to load modules:', err);
        } finally {
          setLoadingModules(false);
        }
      };
      loadModules();
    }
  }, [isOpen]);

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) 
        : [...prev, moduleId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      // Generate ID from name
      const id = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const newTutee = await createTutee({
        id,
        name: name.trim(),
        description: description.trim() || undefined,
        pin,
        icon: selectedIcon,
        colorPrimary: selectedGradient.primary,
        colorSecondary: selectedGradient.secondary,
        colorGradient: selectedGradient.gradient,
      });

      // Assign selected modules
      for (let i = 0; i < selectedModules.length; i++) {
        await assignComponentToTutee(newTutee.id, selectedModules[i], i);
      }

      onCreated(newTutee);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create tutee. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setIsOpen(false);
      setStep(1);
      setName('');
      setDescription('');
      setPin('');
      setSelectedIcon('BookOpen');
      setSelectedGradient(GRADIENTS[0]);
      setSelectedModules([]);
      setError('');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-4 group min-h-[200px]"
      >
        <div className="p-4 bg-gray-50 group-hover:bg-indigo-100 rounded-full transition-colors">
          <Plus className="w-8 h-8 text-gray-400 group-hover:text-indigo-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-400 group-hover:text-indigo-600">New Tuition Group</h2>
          <p className="text-sm text-gray-400 group-hover:text-indigo-400">Set up a new student or group</p>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-content">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-3 bg-gradient-to-br ${selectedGradient.gradient} rounded-2xl shadow-lg`}>
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">New Tuition Group</h3>
                  <p className="text-sm text-gray-500">Step {step} of 4</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Group Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all text-lg font-medium"
                    placeholder="e.g., Primary School Math"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                    placeholder="Brief details about the group..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">4-Digit PIN *</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all text-2xl font-black tracking-[1em] text-center"
                    placeholder="0000"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider text-center">Choose an Icon</label>
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-3">
                    {ICONS.map((item) => {
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.name}
                          onClick={() => setSelectedIcon(item.name)}
                          className={`p-3 rounded-xl transition-all ${
                            selectedIcon === item.name
                              ? `bg-gradient-to-br ${selectedGradient.gradient} text-white shadow-lg scale-110`
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                          }`}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider text-center">Choose Color Scheme</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {GRADIENTS.map((grad) => (
                      <button
                        key={grad.name}
                        onClick={() => setSelectedGradient(grad)}
                        className={`p-4 rounded-2xl transition-all border-2 flex items-center gap-3 ${
                          selectedGradient.name === grad.name
                            ? 'border-indigo-500 bg-indigo-50/30 ring-4 ring-indigo-50'
                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad.gradient} shadow-sm flex items-center justify-center text-white`}>
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className={`font-bold text-sm ${selectedGradient.name === grad.name ? 'text-indigo-700' : 'text-gray-600'}`}>
                          {grad.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Layout className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">Select Modules</h4>
                  <p className="text-sm text-gray-500">Choose which features to enable for this group</p>
                </div>

                {loadingModules ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Loading available modules...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {availableModules.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => toggleModule(module.id)}
                        className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                          selectedModules.includes(module.id)
                            ? 'border-indigo-500 bg-indigo-50/30'
                            : 'border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          selectedModules.includes(module.id)
                            ? `bg-gradient-to-br ${selectedGradient.gradient} text-white shadow-lg`
                            : 'bg-white text-gray-400'
                        }`}>
                          {selectedModules.includes(module.id) ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                          <h5 className={`font-bold ${selectedModules.includes(module.id) ? 'text-indigo-900' : 'text-gray-700'}`}>
                            {module.displayName}
                          </h5>
                          <p className="text-sm text-gray-500 line-clamp-1">{module.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 text-center py-4">
                <div className="flex justify-center">
                  <div className={`p-8 bg-gradient-to-br ${selectedGradient.gradient} rounded-[2.5rem] shadow-2xl shadow-indigo-200 animate-bounce-subtle`}>
                    {(() => {
                      const IconComp = ICONS.find(i => i.name === selectedIcon)?.icon || Plus;
                      return <IconComp className="w-16 h-16 text-white" />;
                    })()}
                  </div>
                </div>
                <div>
                  <h4 className="text-3xl font-black text-gray-800 mb-2">{name}</h4>
                  <p className="text-gray-500 max-w-sm mx-auto">{description || 'No description provided'}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl inline-block mx-auto">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Access PIN</p>
                  <p className="text-3xl font-black text-indigo-600 tracking-[0.5em]">{pin}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {availableModules.filter(m => selectedModules.includes(m.id)).map(m => (
                    <span key={m.id} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                      {m.displayName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 flex gap-4 pt-8 border-t border-gray-100">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  disabled={isSaving}
                  className="flex-1 px-8 py-4 rounded-2xl text-lg font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Back
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={() => {
                    if (step === 1 && (!name.trim() || pin.length !== 4)) {
                      setError('Please fill in Name and 4-digit PIN');
                      return;
                    }
                    setError('');
                    setStep(step + 1);
                  }}
                  className="flex-[2] px-8 py-4 rounded-2xl text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={isSaving}
                  className="flex-[2] px-8 py-4 rounded-2xl text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-6 h-6" />
                  )}
                  Launch Group
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TuteeCreator;
