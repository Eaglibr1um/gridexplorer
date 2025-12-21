import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, X, CheckCircle, Settings, Layout, AlertCircle, Search, User, ChevronRight, Sliders, GraduationCap,
  BookOpen, Star, Heart, Zap, Target, Award, Trophy, Lightbulb, Brain, Rocket, Sparkles, BookMarked, School, PenTool, Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2, Code, Globe, Coffee, Smile
} from 'lucide-react';

// Icon mapping for tutees
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  GraduationCap,
  User,
  Star,
  Heart,
  Zap,
  Target,
  Award,
  Trophy,
  Lightbulb,
  Brain,
  Rocket,
  Sparkles,
  BookMarked,
  School,
  PenTool,
  Calculator,
  FlaskConical,
  Atom,
  Music,
  Palette,
  Camera,
  Gamepad2,
  Code,
  Globe,
  Coffee,
  Smile,
};
import { Tutee } from '../../../types/tuition';
import {
  fetchDashboardComponents,
  fetchTuteeComponents,
  assignComponentToTutee,
  removeComponentFromTutee,
  checkComponentContent,
  DashboardComponent,
  TuteeComponent,
} from '../../../services/componentService';
import Select from '../../ui/Select';
import { SelectOption } from '../../ui/Select';
import AnimatedCard from '../../ui/AnimatedCard';
import ConfirmationModal from '../../ui/ConfirmationModal';

interface ComponentManagerProps {
  tutees: Tutee[];
  onUpdate?: () => void;
}

const ComponentManager = ({ tutees, onUpdate }: ComponentManagerProps) => {
  const [selectedTuteeId, setSelectedTuteeId] = useState<string>(tutees[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableComponents, setAvailableComponents] = useState<DashboardComponent[]>([]);
  const [assignedComponents, setAssignedComponents] = useState<TuteeComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    tuteeComponentId: string;
    displayName: string;
    summary: string;
  }>({
    isOpen: false,
    tuteeComponentId: '',
    displayName: '',
    summary: '',
  });

  const selectedTutee = useMemo(() => tutees.find(t => t.id === selectedTuteeId), [tutees, selectedTuteeId]);

  const filteredTutees = useMemo(() => {
    if (!searchTerm.trim()) return tutees;
    return tutees.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tutees, searchTerm]);

  // Icon helper
  const getIcon = (iconName: string) => {
    return iconMap[iconName] || GraduationCap;
  };

  useEffect(() => {
    loadData();
  }, [selectedTuteeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [components, assigned] = await Promise.all([
        fetchDashboardComponents(),
        selectedTuteeId ? fetchTuteeComponents(selectedTuteeId) : Promise.resolve([]),
      ]);
      setAvailableComponents(components);
      setAssignedComponents(assigned);
    } catch (err) {
      setError('Failed to load components. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (componentId: string) => {
    if (!selectedTuteeId) return;
    try {
      setError('');
      await assignComponentToTutee(selectedTuteeId, componentId, assignedComponents.length);
      await loadData();
      onUpdate?.();
    } catch (err) {
      setError('Failed to assign component. Please try again.');
      console.error(err);
    }
  };

  const handleRemove = async (tuteeComponent: TuteeComponent) => {
    if (!selectedTuteeId) return;

    try {
      setError('');
      
      // Check for existing content
      const { hasContent, summary } = await checkComponentContent(
        selectedTuteeId, 
        tuteeComponent.component?.name || ''
      );

      if (hasContent) {
        setConfirmDelete({
          isOpen: true,
          tuteeComponentId: tuteeComponent.id,
          displayName: tuteeComponent.component?.displayName || 'Module',
          summary: summary,
        });
        return;
      }

      // If no content, remove directly
      setIsRemoving(true);
      await removeComponentFromTutee(tuteeComponent.id);
      await loadData();
      onUpdate?.();
    } catch (err) {
      setError('Failed to remove component. Please try again.');
      console.error(err);
    } finally {
      setIsRemoving(false);
    }
  };

  const confirmRemoval = async () => {
    if (!confirmDelete.tuteeComponentId) return;

    try {
      setIsRemoving(true);
      setError('');
      await removeComponentFromTutee(confirmDelete.tuteeComponentId);
      await loadData();
      onUpdate?.();
      setConfirmDelete(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      setError('Failed to remove component. Please try again.');
      console.error(err);
    } finally {
      setIsRemoving(false);
    }
  };

  const unassignedComponents = availableComponents.filter(
    (comp) => !assignedComponents.some((ac) => ac.componentId === comp.id)
  );

  const componentOptions: SelectOption[] = unassignedComponents.map((comp) => ({
    value: comp.id,
    label: comp.displayName,
  }));

  const tuteeOptions: SelectOption[] = tutees.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  return (
    <AnimatedCard className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Module Manager</h2>
              <p className="text-sm text-gray-500">Assign reusable modules to tuition groups</p>
            </div>
          </div>
        </div>

        <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Manage Modules for Group
            </label>
            {tutees.length > 5 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none w-48 transition-all shadow-sm"
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredTutees.map((tutee) => {
              const IconComp = getIcon(tutee.icon);
              const isActive = selectedTuteeId === tutee.id;
              
              return (
                <button
                  key={tutee.id}
                  onClick={() => setSelectedTuteeId(tutee.id)}
                  className={`group relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? `bg-gradient-to-br ${tutee.colorScheme.gradient} text-white shadow-lg scale-105 z-10` 
                      : 'bg-white text-gray-500 hover:bg-gray-100 border-2 border-transparent hover:border-indigo-100 shadow-sm'
                  }`}
                >
                  <div className={`mb-2 p-2 rounded-xl transition-colors duration-300 ${
                    isActive ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-white'
                  }`}>
                    <IconComp className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                  </div>
                  <span className={`text-[10px] font-bold text-center line-clamp-1 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                    {tutee.name}
                  </span>
                  {isActive && (
                    <div className="absolute -top-1 -right-1 bg-white text-indigo-600 rounded-full p-1 shadow-md animate-in zoom-in-50 duration-300">
                      <CheckCircle className="w-2.5 h-2.5 stroke-[4]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4 text-gray-400">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p>Loading modules...</p>
          </div>
        ) : !selectedTuteeId ? (
          <div className="py-12 text-center text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-100">
            <p>Please select a tuition group to manage their modules</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Add Component */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Add Available Module</h3>
              {unassignedComponents.length === 0 ? (
                <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  All available modules are already assigned to this group.
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex-1 max-w-md">
                    <Select
                      value=""
                      onChange={(value) => value && handleAssign(value)}
                      options={componentOptions}
                      placeholder="Select a module to add..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Assigned Components */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                Assigned Modules for {selectedTutee?.name} ({assignedComponents.length})
              </h3>
              {assignedComponents.length === 0 ? (
                <div className="py-12 text-center text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-100">
                  <Layout className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No modules assigned to this group yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedComponents.map((tuteeComp) => (
                    <div
                      key={tuteeComp.id}
                      className="group p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:shadow-lg hover:border-indigo-100 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-800 block">
                            {tuteeComp.component?.displayName || 'Unknown Module'}
                          </span>
                          {tuteeComp.component?.description && (
                            <span className="text-xs text-gray-500">
                          {tuteeComp.component.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        // Scroll to the respective admin section if it exists
                        const sectionMap: Record<string, string> = {
                          'learning_points': 'feedback-admin-section',
                          'worksheet_tracker': 'module-manager-section',
                          'spelling_quiz': 'spelling-quiz-admin-section',
                          'chemistry_quiz': 'module-manager-section', // For now, chemistry is managed elsewhere or simpler
                          'shared_files': 'global-file-admin-section',
                        };
                        const sectionId = sectionMap[tuteeComp.component?.name || ''];
                        if (sectionId) {
                          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          // Handle other modules (like worksheet_tracker)
                          // For now, we'll just show an alert or we could expand a configuration area
                          alert(`Configuration for ${tuteeComp.component?.displayName} is handled within the module on the tutee's dashboard.`);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Configure module"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRemove(tuteeComp)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Remove module"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmRemoval}
        title={`Remove ${confirmDelete.displayName}?`}
        message={
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Existing Content Found!</p>
                <p className="text-xs text-amber-700 mt-1">
                  This module currently contains <span className="font-bold underline">{confirmDelete.summary}</span> for {selectedTutee?.name}.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Removing this module will hide it from the dashboard. The data will remain in the database, but the student will no longer be able to access it.
            </p>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Are you sure you want to proceed?
              </p>
            </div>
          </div>
        }
        confirmText="Yes, Remove Module"
        cancelText="No, Keep It"
        type="warning"
        isLoading={isRemoving}
      />
    </AnimatedCard>
  );
};

export default ComponentManager;
