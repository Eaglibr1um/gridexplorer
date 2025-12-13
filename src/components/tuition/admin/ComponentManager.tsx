import { useState, useEffect } from 'react';
import { Plus, X, CheckCircle, Settings } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import {
  fetchDashboardComponents,
  fetchTuteeComponents,
  assignComponentToTutee,
  removeComponentFromTutee,
  DashboardComponent,
  TuteeComponent,
} from '../../../services/componentService';
import Select from '../../ui/Select';
import { SelectOption } from '../../ui/Select';

interface ComponentManagerProps {
  tutee: Tutee;
  onUpdate?: () => void;
}

const ComponentManager = ({ tutee, onUpdate }: ComponentManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableComponents, setAvailableComponents] = useState<DashboardComponent[]>([]);
  const [assignedComponents, setAssignedComponents] = useState<TuteeComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, tutee.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [components, assigned] = await Promise.all([
        fetchDashboardComponents(),
        fetchTuteeComponents(tutee.id),
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
    try {
      setError('');
      await assignComponentToTutee(tutee.id, componentId, assignedComponents.length);
      await loadData();
      onUpdate?.();
    } catch (err) {
      setError('Failed to assign component. Please try again.');
      console.error(err);
    }
  };

  const handleRemove = async (tuteeComponentId: string) => {
    try {
      setError('');
      await removeComponentFromTutee(tuteeComponentId);
      await loadData();
      onUpdate?.();
    } catch (err) {
      setError('Failed to remove component. Please try again.');
      console.error(err);
    }
  };

  const unassignedComponents = availableComponents.filter(
    (comp) => !assignedComponents.some((ac) => ac.componentId === comp.id)
  );

  const componentOptions: SelectOption[] = unassignedComponents.map((comp) => ({
    value: comp.id,
    label: comp.displayName,
  }));

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors-smooth press-effect"
        title="Manage components"
      >
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-content">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-lg`}>
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Manage Components</h3>
                  <p className="text-sm text-gray-600">{tutee.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors-smooth"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading components...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add Component */}
                {unassignedComponents.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Component
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          value=""
                          onChange={(value) => {
                            if (value) {
                              handleAssign(value);
                            }
                          }}
                          options={componentOptions}
                          placeholder="Select a component to add..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Assigned Components */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Components ({assignedComponents.length})
                  </label>
                  {assignedComponents.length === 0 ? (
                    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                      <p>No components assigned yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assignedComponents.map((tuteeComp) => (
                        <div
                          key={tuteeComp.id}
                          className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium text-gray-800">
                              {tuteeComp.component?.displayName || 'Unknown Component'}
                            </span>
                            {tuteeComp.component?.description && (
                              <span className="text-sm text-gray-600">
                                - {tuteeComp.component.description}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemove(tuteeComp.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors-smooth press-effect"
                            title="Remove component"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ComponentManager;

