import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  HardDrive, Search, Filter, User, FileText, Download, Trash2, Shield, 
  Calendar, ArrowUpRight, Loader2, AlertCircle, Upload, X, Check, 
  BookOpen, GraduationCap, Star, Heart, Zap, Target, Award, Trophy, 
  Lightbulb, Brain, Rocket, Sparkles, BookMarked, School, PenTool, 
  Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2, 
  Code, Globe, Coffee, Smile, Image, FileVideo
} from 'lucide-react';
import { SharedFile, fetchSharedFiles, deleteSharedFile, getFileUrl, uploadFile } from '../../../services/fileService';
import { Tutee } from '../../../types/tuition';
import AnimatedCard from '../../ui/AnimatedCard';
import { format } from 'date-fns';
import ConfirmationModal from '../../ui/ConfirmationModal';

// Icon mapping same as TuteeCreator
const ICONS: Record<string, any> = {
  BookOpen, GraduationCap, User, Star, Heart, Zap, Target, Award, Trophy,
  Lightbulb, Brain, Rocket, Sparkles, BookMarked, School, PenTool,
  Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2,
  Code, Globe, Coffee, Smile
};

interface GlobalFileManagerProps {
  tutees: Tutee[];
}

const GlobalFileManager = ({ tutees }: GlobalFileManagerProps) => {
  const [files, setFiles] = useState<(SharedFile & { tuteeName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTuteeId, setSelectedTuteeId] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; file: SharedFile | null }>({
    isOpen: false,
    file: null,
  });

  // Admin Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [targetTuteeIds, setTargetTuteeIds] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllFiles();
  }, [tutees]);

  const loadAllFiles = async () => {
    try {
      setLoading(true);
      const allFiles: (SharedFile & { tuteeName: string })[] = [];
      
      await Promise.all(tutees.map(async (tutee) => {
        const tuteeFiles = await fetchSharedFiles(tutee.id);
        tuteeFiles.forEach(f => {
          allFiles.push({ ...f, tuteeName: tutee.name });
        });
      }));

      // Sort by date newest first
      allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFiles(allFiles);
    } catch (err) {
      console.error('Error loading global files:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = 
        f.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.tuteeName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTutee = selectedTuteeId === 'all' || f.tuteeId === selectedTuteeId;
      
      return matchesSearch && matchesTutee;
    });
  }, [files, searchTerm, selectedTuteeId]);

  const handleDelete = async () => {
    if (!deleteConfirm.file) return;

    try {
      setLoading(true);
      await deleteSharedFile(deleteConfirm.file);
      await loadAllFiles();
      setDeleteConfirm({ isOpen: false, file: null });
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminUpload = async () => {
    if (!uploadFileObj || targetTuteeIds.length === 0) return;

    try {
      setUploading(true);
      setUploadError('');

      await Promise.all(targetTuteeIds.map(tuteeId => 
        uploadFile(uploadFileObj, tuteeId, 'Admin')
      ));

      await loadAllFiles();
      setIsUploadModalOpen(false);
      setUploadFileObj(null);
      setTargetTuteeIds([]);
    } catch (err) {
      console.error('Admin upload error:', err);
      setUploadError('Failed to upload file to one or more groups.');
    } finally {
      setUploading(false);
    }
  };

  const toggleTargetTutee = (id: string) => {
    setTargetTuteeIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllTutees = () => {
    if (targetTuteeIds.length === tutees.length) {
      setTargetTuteeIds([]);
    } else {
      setTargetTuteeIds(tutees.map(t => t.id));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTuteeIcon = (tuteeId: string) => {
    const tutee = tutees.find(t => t.id === tuteeId);
    if (!tutee) return <User className="w-4 h-4" />;
    const IconComp = ICONS[tutee.icon] || User;
    return <IconComp className="w-4 h-4" />;
  };

  const getTuteeColor = (tuteeId: string) => {
    const tutee = tutees.find(t => t.id === tuteeId);
    return tutee?.colorScheme.gradient || 'from-indigo-500 to-blue-600';
  };

  return (
    <>
      <AnimatedCard className="overflow-visible !p-0">
        <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm flex-shrink-0">
              <HardDrive className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Global File Manager</h2>
              <p className="text-xs sm:text-sm text-gray-500">Monitor and manage all files shared across groups</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                {filteredFiles.length} Shared Files
              </span>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Admin Upload
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search files, senders, or groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm sm:text-base"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <select
              value={selectedTuteeId}
              onChange={(e) => setSelectedTuteeId(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-700 appearance-none text-sm sm:text-base"
            >
              <option value="all">All Groups</option>
              {tutees.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && files.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Scanning storage...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800">No files found</h3>
            <p className="text-gray-500">No documents have been shared yet.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto -mx-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">File Details</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tuition Group</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Uploaded By</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="group hover:bg-indigo-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:border-indigo-100">
                            <FileText className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 pr-4">{file.fileName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatFileSize(file.fileSize)}</span>
                              <span className="w-1 h-1 bg-gray-200 rounded-full" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(file.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 bg-gradient-to-br ${getTuteeColor(file.tuteeId)} rounded-lg flex items-center justify-center text-white shadow-sm`}>
                            {getTuteeIcon(file.tuteeId)}
                          </div>
                          <span className="text-xs font-black text-gray-700 tracking-tight">{file.tuteeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          file.uploadedBy === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {file.uploadedBy === 'Admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {file.uploadedBy}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={getFileUrl(file.filePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-indigo-100 transition-all"
                            title="View/Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, file })}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-red-100 transition-all"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {filteredFiles.map((file) => (
                <div key={file.id} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm active:bg-gray-50 transition-colors w-full">
                  {/* File name - full width, word wrap enabled */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-indigo-50 rounded-lg sm:rounded-xl text-indigo-600 flex-shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-800 break-words leading-snug">
                        {file.fileName}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{formatFileSize(file.fileSize)}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{format(new Date(file.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom row: tutee info + actions */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-6 h-6 bg-gradient-to-br ${getTuteeColor(file.tuteeId)} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                        {getTuteeIcon(file.tuteeId)}
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide truncate">{file.tuteeName}</span>
                      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${
                        file.uploadedBy === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {file.uploadedBy === 'Admin' ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                        {file.uploadedBy}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <a
                        href={getFileUrl(file.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 text-indigo-600 bg-indigo-50 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, file })}
                        className="p-2.5 text-red-600 bg-red-50 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AnimatedCard>

    {/* Admin Upload Modal */}
    {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-xl w-full animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">Admin Upload</h3>
                  <p className="text-sm text-gray-500 font-medium">Share files with one or more groups</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-8">
              {/* File Selection */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select File</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setUploadFileObj(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-6 border-2 border-dashed rounded-[2rem] transition-all flex flex-col items-center gap-2 ${
                    uploadFileObj 
                      ? 'border-emerald-200 bg-emerald-50/30' 
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {uploadFileObj ? (
                    <>
                      <FileText className="w-8 h-8 text-emerald-500" />
                      <span className="font-bold text-emerald-700">{uploadFileObj.name}</span>
                      <span className="text-xs text-emerald-600 font-bold uppercase">{formatFileSize(uploadFileObj.size)}</span>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-white rounded-2xl shadow-sm mb-1">
                        <Upload className="w-6 h-6 text-indigo-500" />
                      </div>
                      <span className="font-bold text-gray-600">Click to choose a file</span>
                      <span className="text-xs text-gray-400">Max 10MB allowed</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tutee Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Share with Groups</label>
                  <button 
                    onClick={selectAllTutees}
                    className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
                  >
                    {targetTuteeIds.length === tutees.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {tutees.map(t => (
                    <button
                      key={t.id}
                      onClick={() => toggleTargetTutee(t.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                        targetTuteeIds.includes(t.id)
                          ? 'border-indigo-500 bg-indigo-50/50'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-10 h-10 bg-gradient-to-br ${t.colorScheme.gradient} rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                        {ICONS[t.icon] ? React.createElement(ICONS[t.icon], { className: "w-5 h-5" }) : <User className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={`text-xs font-black truncate tracking-tight ${targetTuteeIds.includes(t.id) ? 'text-indigo-900' : 'text-gray-700'}`}>
                          {t.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Group</span>
                          {targetTuteeIds.includes(t.id) && <Check className="w-3 h-3 text-indigo-500" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {uploadError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {uploadError}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdminUpload}
                  disabled={uploading || !uploadFileObj || targetTuteeIds.length === 0}
                  className="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading to {targetTuteeIds.length} groups...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload to {targetTuteeIds.length} Group{targetTuteeIds.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, file: null })}
        onConfirm={handleDelete}
        title="Delete Globally?"
        message={
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              You are about to delete <span className="font-bold text-gray-800">"{deleteConfirm.file?.fileName}"</span> from the <span className="font-bold text-indigo-600">{deleteConfirm.file?.tuteeName}</span> group.
            </p>
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">
                This will remove the file for both you and the student. This action is irreversible.
              </p>
            </div>
          </div>
        }
        confirmText="Confirm Global Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default GlobalFileManager;
