import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  HardDrive, Search, Filter, User, FileText, Download, Trash2, Shield, 
  Calendar, ArrowUpRight, Loader2, AlertCircle, Upload, X, Check, 
  BookOpen, GraduationCap, Star, Heart, Zap, Target, Award, Trophy, 
  Lightbulb, Brain, Rocket, Sparkles, BookMarked, School, PenTool, 
  Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2, 
  Code, Globe, Coffee, Smile, Image, FileVideo, Link as LinkIcon, 
  ExternalLink, Copy
} from 'lucide-react';
import { SharedResource, fetchSharedFiles, deleteSharedFile, getFileUrl, uploadFile, addLink } from '../../../services/fileService';
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
  const [resources, setResources] = useState<(SharedResource & { tuteeName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTuteeId, setSelectedTuteeId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'files' | 'links'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; resource: SharedResource | null }>({
    isOpen: false,
    resource: null,
  });

  // Admin Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [linkForm, setLinkForm] = useState({ url: '', title: '', description: '' });
  const [targetTuteeIds, setTargetTuteeIds] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllFiles();
  }, [tutees]);

  const loadAllFiles = async () => {
    try {
      setLoading(true);
      const allResources: (SharedResource & { tuteeName: string })[] = [];
      
      await Promise.all(tutees.map(async (tutee) => {
        const tuteeResources = await fetchSharedFiles(tutee.id);
        tuteeResources.forEach(r => {
          allResources.push({ ...r, tuteeName: tutee.name });
        });
      }));

      // Sort by date newest first
      allResources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setResources(allResources);
    } catch (err) {
      console.error('Error loading global resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      // Filter by type
      if (filterType === 'files' && r.resourceType !== 'file') return false;
      if (filterType === 'links' && r.resourceType !== 'link') return false;

      const title = r.title || r.fileName || '';
      const matchesSearch = 
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tuteeName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTutee = selectedTuteeId === 'all' || r.tuteeId === selectedTuteeId;
      
      return matchesSearch && matchesTutee;
    });
  }, [resources, searchTerm, selectedTuteeId, filterType]);

  const handleDelete = async () => {
    if (!deleteConfirm.resource) return;

    try {
      setLoading(true);
      await deleteSharedFile(deleteConfirm.resource);
      await loadAllFiles();
      setDeleteConfirm({ isOpen: false, resource: null });
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

  const handleAdminAddLink = async () => {
    if (!linkForm.url.trim() || !linkForm.title.trim() || targetTuteeIds.length === 0) {
      setUploadError('URL, title, and at least one group are required');
      return;
    }

    // Basic URL validation
    try {
      new URL(linkForm.url);
    } catch {
      setUploadError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');

      await Promise.all(targetTuteeIds.map(tuteeId => 
        addLink(linkForm.url, linkForm.title, tuteeId, 'Admin', linkForm.description)
      ));

      await loadAllFiles();
      setIsLinkModalOpen(false);
      setLinkForm({ url: '', title: '', description: '' });
      setTargetTuteeIds([]);
    } catch (err) {
      console.error('Admin add link error:', err);
      setUploadError('Failed to add link to one or more groups.');
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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Global Resource Manager</h2>
              <p className="text-xs sm:text-sm text-gray-500">Monitor and manage all files and links shared across groups</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                {filteredResources.length} Resources
              </span>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">Upload</span>
            </button>
            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl sm:rounded-2xl font-black text-sm shadow-sm hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95"
            >
              <LinkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Add Link</span>
              <span className="sm:hidden">Link</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({resources.length})
          </button>
          <button
            onClick={() => setFilterType('files')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              filterType === 'files'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Files ({resources.filter(r => r.resourceType === 'file').length})
            </span>
          </button>
          <button
            onClick={() => setFilterType('links')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
              filterType === 'links'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Links ({resources.filter(r => r.resourceType === 'link').length})
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources, senders, or groups..."
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

        {loading && resources.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <HardDrive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800">No resources found</h3>
            <p className="text-gray-500">{searchTerm || filterType !== 'all' ? 'No resources match your filters' : 'No resources have been shared yet.'}</p>
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
                  {filteredResources.map((resource) => (
                    <tr key={resource.id} className="group hover:bg-indigo-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:border-indigo-100">
                            {resource.resourceType === 'link' ? (
                              <LinkIcon className="w-5 h-5 text-purple-500" />
                            ) : (
                              <FileText className="w-5 h-5 text-indigo-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 pr-4">{resource.title || resource.fileName}</p>
                            {resource.description && (
                              <p className="text-xs text-gray-600 line-clamp-1">{resource.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-0.5">
                              {resource.resourceType === 'file' && resource.fileSize && (
                                <>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatFileSize(resource.fileSize)}</span>
                                  <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                </>
                              )}
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(resource.createdAt), 'MMM d, yyyy')}</span>
                              <span className="w-1 h-1 bg-gray-200 rounded-full" />
                              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                resource.resourceType === 'file' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                              }`}>
                                {resource.resourceType === 'file' ? 'File' : 'Link'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 bg-gradient-to-br ${getTuteeColor(resource.tuteeId)} rounded-lg flex items-center justify-center text-white shadow-sm`}>
                            {getTuteeIcon(resource.tuteeId)}
                          </div>
                          <span className="text-xs font-black text-gray-700 tracking-tight">{resource.tuteeName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          resource.uploadedBy === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {resource.uploadedBy === 'Admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {resource.uploadedBy}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {resource.resourceType === 'file' ? (
                            <a
                              href={getFileUrl(resource.filePath!)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-indigo-100 transition-all"
                              title="View/Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          ) : (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-indigo-100 transition-all"
                              title="Open link"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, resource })}
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
              {filteredResources.map((resource) => (
                <div key={resource.id} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm active:bg-gray-50 transition-colors w-full">
                  {/* Resource name - full width, word wrap enabled */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg sm:rounded-xl flex-shrink-0 ${
                      resource.resourceType === 'link' ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {resource.resourceType === 'link' ? (
                        <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-800 break-words leading-snug">
                        {resource.title || resource.fileName}
                      </p>
                      {resource.description && (
                        <p className="text-[10px] text-gray-600 line-clamp-2 mt-0.5">{resource.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        {resource.resourceType === 'file' && resource.fileSize && (
                          <>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{formatFileSize(resource.fileSize)}</span>
                            <span className="text-gray-300">•</span>
                          </>
                        )}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{format(new Date(resource.createdAt), 'MMM d, yyyy')}</span>
                        <span className="text-gray-300">•</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          resource.resourceType === 'file' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {resource.resourceType === 'file' ? 'File' : 'Link'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bottom row: tutee info + actions */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-6 h-6 bg-gradient-to-br ${getTuteeColor(resource.tuteeId)} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                        {getTuteeIcon(resource.tuteeId)}
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide truncate">{resource.tuteeName}</span>
                      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${
                        resource.uploadedBy === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {resource.uploadedBy === 'Admin' ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                        {resource.uploadedBy}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {resource.resourceType === 'file' ? (
                        <a
                          href={getFileUrl(resource.filePath!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 text-indigo-600 bg-indigo-50 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      ) : (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 text-purple-600 bg-purple-50 rounded-lg active:scale-95 transition-all touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Open link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, resource })}
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

      {/* Admin Add Link Modal */}
      {isLinkModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsLinkModalOpen(false);
              setLinkForm({ url: '', title: '', description: '' });
              setTargetTuteeIds([]);
              setUploadError('');
            }
          }}
        >
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-xl w-full animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-200">
                  <LinkIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">Add Link</h3>
                  <p className="text-sm text-gray-500 font-medium">Share links with one or more groups</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setLinkForm({ url: '', title: '', description: '' });
                  setTargetTuteeIds([]);
                  setUploadError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Link Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={linkForm.title}
                    onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                    placeholder="Resource title"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={linkForm.description}
                    onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                    placeholder="Brief description of this resource"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Tutee Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Share with Groups</label>
                  <button 
                    onClick={selectAllTutees}
                    className="text-xs font-black text-purple-600 hover:text-purple-700 uppercase tracking-wider"
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
                          ? 'border-purple-500 bg-purple-50/50'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-10 h-10 bg-gradient-to-br ${t.colorScheme.gradient} rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
                        {ICONS[t.icon] ? React.createElement(ICONS[t.icon], { className: "w-5 h-5" }) : <User className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={`text-xs font-black truncate tracking-tight ${targetTuteeIds.includes(t.id) ? 'text-purple-900' : 'text-gray-700'}`}>
                          {t.name}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Group</span>
                          {targetTuteeIds.includes(t.id) && <Check className="w-3 h-3 text-purple-500" />}
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
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    setLinkForm({ url: '', title: '', description: '' });
                    setTargetTuteeIds([]);
                    setUploadError('');
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdminAddLink();
                  }}
                  disabled={uploading || !linkForm.url.trim() || !linkForm.title.trim() || targetTuteeIds.length === 0}
                  className="flex-[2] px-6 py-4 bg-purple-600 text-white rounded-2xl font-black shadow-xl shadow-purple-100 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding to {targetTuteeIds.length} groups...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      Add to {targetTuteeIds.length} Group{targetTuteeIds.length !== 1 ? 's' : ''}
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
        onClose={() => setDeleteConfirm({ isOpen: false, resource: null })}
        onConfirm={handleDelete}
        title={`Delete ${deleteConfirm.resource?.resourceType === 'file' ? 'File' : 'Link'} Globally?`}
        message={
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              You are about to delete <span className="font-bold text-gray-800">"{deleteConfirm.resource?.title || deleteConfirm.resource?.fileName}"</span> from the <span className="font-bold text-indigo-600">{deleteConfirm.resource?.tuteeName}</span> group.
            </p>
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">
                This will remove the {deleteConfirm.resource?.resourceType === 'file' ? 'file' : 'link'} for both you and the student. This action is irreversible.
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
