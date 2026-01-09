import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit2, Trash2, Save, X, AlertCircle, CheckCircle2,
  BookOpen, GraduationCap, User, Star, Heart, Zap, Target, Award, Trophy, 
  Lightbulb, Brain, Rocket, Sparkles, BookMarked, School, PenTool, Calculator, 
  FlaskConical, Atom, Music, Palette, Camera, Gamepad2, Code, Globe, Coffee, Smile,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { fetchStudentsForTutee, createStudent, updateStudent, deleteStudent, TuteeStudent } from '../../../services/tuteeService';
import { Tutee } from '../../../types/tuition';
import AnimatedCard from '../../ui/AnimatedCard';

// Icon mapping for tutees
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, GraduationCap, User, Star, Heart, Zap, Target, Award, Trophy,
  Lightbulb, Brain, Rocket, Sparkles, BookMarked, School, PenTool, Calculator,
  FlaskConical, Atom, Music, Palette, Camera, Gamepad2, Code, Globe, Coffee, Smile,
};

interface StudentManagementProps {
  tutees: Tutee[];
}

const StudentManagement: React.FC<StudentManagementProps> = ({ tutees }) => {
  const [selectedTutee, setSelectedTutee] = useState<Tutee | null>(null);
  const [students, setStudents] = useState<TuteeStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  useEffect(() => {
    if (tutees.length > 0 && !selectedTutee) {
      setSelectedTutee(tutees[0]);
    }
  }, [tutees, selectedTutee]);

  useEffect(() => {
    if (selectedTutee) {
      loadStudents();
    }
  }, [selectedTutee]);

  const loadStudents = async () => {
    if (!selectedTutee) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchStudentsForTutee(selectedTutee.id);
      setStudents(data);
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedTutee || !newStudentName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      const nextOrder = students.length > 0 ? Math.max(...students.map(s => s.displayOrder)) + 1 : 0;
      await createStudent({
        tuteeId: selectedTutee.id,
        studentName: newStudentName.toLowerCase().trim(),
        displayOrder: nextOrder,
      });
      setNewStudentName('');
      setIsAdding(false);
      await loadStudents();
    } catch (err) {
      console.error('Error adding student:', err);
      setError('Failed to add student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStudent = async (id: string) => {
    if (!editName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      await updateStudent({
        id,
        studentName: editName.toLowerCase().trim(),
      });
      setEditingId(null);
      setEditName('');
      await loadStudents();
    } catch (err) {
      console.error('Error updating student:', err);
      setError('Failed to update student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete "${studentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await deleteStudent(id);
      await loadStudents();
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (student: TuteeStudent) => {
    setEditingId(student.id);
    setEditName(student.studentName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewStudentName('');
  };

  const moveStudentUp = async (index: number) => {
    if (index === 0) return; // Already at top
    
    const currentStudent = students[index];
    const previousStudent = students[index - 1];

    try {
      setIsLoading(true);
      // Swap display orders
      await updateStudent({ id: currentStudent.id, displayOrder: index - 1 });
      await updateStudent({ id: previousStudent.id, displayOrder: index });
      await loadStudents();
    } catch (err) {
      console.error('Error reordering students:', err);
      setError('Failed to reorder students');
    } finally {
      setIsLoading(false);
    }
  };

  const moveStudentDown = async (index: number) => {
    if (index === students.length - 1) return; // Already at bottom
    
    const currentStudent = students[index];
    const nextStudent = students[index + 1];

    try {
      setIsLoading(true);
      // Swap display orders
      await updateStudent({ id: currentStudent.id, displayOrder: index + 1 });
      await updateStudent({ id: nextStudent.id, displayOrder: index });
      await loadStudents();
    } catch (err) {
      console.error('Error reordering students:', err);
      setError('Failed to reorder students');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedTutee) {
    return (
      <AnimatedCard className="overflow-hidden">
        <div className="p-6 md:p-8">
          <p className="text-gray-600">No tutees available</p>
        </div>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard className="overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
              <p className="text-sm text-gray-500">Manage students for each tutee group</p>
            </div>
          </div>
        </div>

      {/* Tutee Group Selector */}
      <div className="mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            Manage Students for Group
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tutees.map((tutee) => {
            const isActive = tutee.id === selectedTutee.id;
            const IconComp = iconMap[tutee.icon || 'BookOpen'] || BookOpen;

            return (
              <button
                key={tutee.id}
                onClick={() => {
                  setSelectedTutee(tutee);
                  setEditingId(null);
                  setIsAdding(false);
                }}
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
                    <CheckCircle2 className="w-2.5 h-2.5 stroke-[4]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Students List */}
      <div className="space-y-3 mb-4">
        {isLoading && students.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No students added yet</p>
            <p className="text-sm text-gray-400">Click the button below to add your first student</p>
          </div>
        ) : (
          students.map((student, index) => {
            const primaryColor = selectedTutee.colorScheme.primary;
            const secondaryColor = selectedTutee.colorScheme.secondary;
            const bgGradient = `bg-gradient-to-r from-${primaryColor}-50 to-${secondaryColor}-50`;
            const borderColor = `border-${primaryColor}-200`;
            const iconColor = `text-${primaryColor}-600`;
            const inputBorderColor = `border-${primaryColor}-300`;
            const inputFocusRing = `focus:ring-${primaryColor}-500`;
            
            return (
              <div
                key={student.id}
                className={`flex items-center justify-between p-4 ${bgGradient} rounded-lg border ${borderColor} hover:shadow-md transition-shadow`}
              >
                {editingId === student.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Student name"
                      className={`flex-1 px-3 py-2 border ${inputBorderColor} rounded-lg focus:ring-2 ${inputFocusRing} focus:border-transparent`}
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateStudent(student.id)}
                      disabled={isLoading || !editName.trim()}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                      title="Save"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Users className={`w-5 h-5 ${iconColor}`} />
                      <span className="font-medium text-gray-800 capitalize">
                        {student.studentName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Reorder buttons */}
                      <button
                        onClick={() => moveStudentUp(index)}
                        disabled={isLoading || index === 0}
                        className={`p-1.5 ${iconColor} hover:bg-white/50 rounded-lg transition-colors disabled:text-gray-300 disabled:cursor-not-allowed`}
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveStudentDown(index)}
                        disabled={isLoading || index === students.length - 1}
                        className={`p-1.5 ${iconColor} hover:bg-white/50 rounded-lg transition-colors disabled:text-gray-300 disabled:cursor-not-allowed`}
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {/* Edit and Delete buttons */}
                      <button
                        onClick={() => startEdit(student)}
                        disabled={isLoading}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:text-gray-300"
                        title="Edit name"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id, student.studentName)}
                        disabled={isLoading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:text-gray-300"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Student Form */}
      {isAdding ? (
        <div className={`p-4 bg-${selectedTutee.colorScheme.primary}-50 rounded-lg border border-${selectedTutee.colorScheme.primary}-200`}>
          <h3 className="font-medium text-gray-800 mb-3">Add New Student</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Enter student name"
              className={`flex-1 px-4 py-2 border border-${selectedTutee.colorScheme.primary}-300 rounded-lg focus:ring-2 focus:ring-${selectedTutee.colorScheme.primary}-500 focus:border-transparent`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newStudentName.trim()) {
                  handleAddStudent();
                }
              }}
              autoFocus
            />
            <button
              onClick={handleAddStudent}
              disabled={isLoading || !newStudentName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors font-medium"
            >
              Add
            </button>
            <button
              onClick={cancelAdd}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            💡 Tip: Names will be automatically converted to lowercase for consistency
          </p>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          disabled={isLoading}
          className={`w-full py-3 bg-gradient-to-r ${selectedTutee.colorScheme.gradient} text-white rounded-lg hover:opacity-90 disabled:from-gray-300 disabled:to-gray-300 transition-all font-medium flex items-center justify-center gap-2 shadow-md`}
        >
          <Plus className="w-5 h-5" />
          Add Student
        </button>
      )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">ℹ️ About Student Management</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Each tutee group can have multiple students</li>
            <li>Student names are used to organize quiz records and word lists</li>
            <li>Deleting a student won't delete their quiz records or words</li>
            <li>Names are case-insensitive and stored in lowercase</li>
          </ul>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default StudentManagement;
