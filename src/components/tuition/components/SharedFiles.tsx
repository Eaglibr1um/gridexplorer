import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Upload, Download, Trash2, X, Loader2, CheckCircle2, AlertCircle, File, Image, FileVideo, Music, HardDrive, Filter, Search, User, Shield, Link as LinkIcon, ExternalLink, Copy } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import { SharedResource, uploadFile, fetchSharedFiles, deleteSharedFile, getFileUrl, addLink } from '../../../services/fileService';
import { format } from 'date-fns';
import ConfirmationModal from '../../ui/ConfirmationModal';
import { getColorClasses, getStatClasses } from '../../../utils/colorUtils';

interface SharedFilesProps {
  tutee: Tutee;
  isAdmin?: boolean;
}

const SharedFiles = ({ tutee, isAdmin = false }: SharedFilesProps) => {
  const [resources, setResources] = useState<SharedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'files' | 'links'>('all');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({ url: '', title: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; resource: SharedResource | null }>({
    isOpen: false,
    resource: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Use safe color classes from utility
  const gradientClass = tutee.colorScheme.gradient;
  const colorClasses = getColorClasses(tutee.colorScheme.primary);
  const statClasses = getStatClasses(tutee.colorScheme.primary);

  useEffect(() => {
    loadFiles();
  }, [tutee.id]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fetchSharedFiles(tutee.id);
      setResources(data);
    } catch (err) {
      console.error('Error loading resources:', err);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Max 10MB allowed.');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      const uploadedBy = isAdmin ? 'Admin' : tutee.name;
      await uploadFile(file, tutee.id, uploadedBy);
      await loadFiles();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkForm.url.trim() || !linkForm.title.trim()) {
      setError('URL and title are required');
      return;
    }

    // Auto-prepend https:// if no protocol is provided
    let urlToUse = linkForm.url.trim();
    if (!urlToUse.match(/^https?:\/\//i)) {
      urlToUse = `https://${urlToUse}`;
    }

    // Basic URL validation
    try {
      new URL(urlToUse);
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      const uploadedBy = isAdmin ? 'Admin' : tutee.name;
      await addLink(urlToUse, linkForm.title, tutee.id, uploadedBy, linkForm.description);
      await loadFiles();
      setShowLinkModal(false);
      setLinkForm({ url: '', title: '', description: '' });
    } catch (err) {
      console.error('Add link error:', err);
      setError('Failed to add link. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.resource) return;

    try {
      setLoading(true);
      await deleteSharedFile(deleteConfirm.resource);
      await loadFiles();
      setDeleteConfirm({ isOpen: false, resource: null });
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete resource.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-6 h-6 text-pink-500" />;
    if (type.startsWith('video/')) return <FileVideo className="w-6 h-6 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-6 h-6 text-indigo-500" />;
    if (type.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    return <File className="w-6 h-6 text-blue-500" />;
  };

  const getResourceIcon = (resource: SharedResource) => {
    if (resource.resourceType === 'link') {
      return <LinkIcon className="w-6 h-6 text-blue-500" />;
    }
    return getFileIcon(resource.fileType || '');
  };

  const filteredResources = resources.filter(r => {
    // Filter by type
    if (filterType === 'files' && r.resourceType !== 'file') return false;
    if (filterType === 'links' && r.resourceType !== 'link') return false;
    
    // Filter by search term
    const title = r.title || r.fileName || '';
    const searchMatch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchMatch;
  });

  const closeLinkModal = () => {
    setShowLinkModal(false);
    setLinkForm({ url: '', title: '', description: '' });
    setError('');
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-[2rem] sm:rounded-[2.5rem] shadow-xl overflow-hidden border border-white/40 animate-fade-in-up">
      {/* Header */}
      <div className={`p-4 sm:p-8 bg-gradient-to-r ${gradientClass} text-white shadow-lg`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-inner flex-shrink-0">
            <HardDrive className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight truncate">Shared Resources</h2>
            <p className="text-[10px] sm:text-xs text-white/80 font-bold uppercase tracking-widest mt-0.5 sm:mt-1 truncate">Files & Links</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-8">
        {/* Actions and Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`flex-1 ${statClasses.bg} rounded-2xl p-4 border border-white/50 shadow-inner flex flex-col justify-center`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total</p>
            <p className={`text-2xl font-black ${statClasses.text}`}>
              {resources.length} <span className="text-xs uppercase tracking-wider opacity-60">Items</span>
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-full flex items-center justify-center gap-2 px-4 min-h-[48px] py-3 bg-gradient-to-r ${gradientClass} text-white rounded-2xl font-bold uppercase tracking-wider text-xs shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 touch-manipulation`}
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Upload</span>
            </button>
            <button
              onClick={() => setShowLinkModal(true)}
              disabled={isUploading}
              className={`w-full flex items-center justify-center gap-2 px-4 min-h-[48px] py-3 bg-white border-2 ${colorClasses.border} ${colorClasses.text} rounded-2xl font-bold uppercase tracking-wider text-xs shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 touch-manipulation`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              filterType === 'all'
                ? `bg-gradient-to-r ${gradientClass} text-white shadow-md`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({resources.length})
          </button>
          <button
            onClick={() => setFilterType('files')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              filterType === 'files'
                ? `bg-gradient-to-r ${gradientClass} text-white shadow-md`
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
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              filterType === 'links'
                ? `bg-gradient-to-r ${gradientClass} text-white shadow-md`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Links ({resources.filter(r => r.resourceType === 'link').length})
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-transparent ${colorClasses.border} focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800 shadow-inner touch-target`}
          />
        </div>

        {error && (
          <div className="p-5 bg-red-50 text-red-600 text-sm font-black rounded-2xl border-2 border-red-100 flex items-center gap-3 animate-shake">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading && resources.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Loading...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="py-24 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-50">
              <HardDrive className="w-12 h-12 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tight">No Resources</h3>
            <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px] mt-2 max-w-xs mx-auto px-6 leading-relaxed">
              {searchTerm || filterType !== 'all' ? "No resources match your filters" : "Upload files or add links to get started!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredResources.map((resource) => (
              <div 
                key={resource.id}
                className="group relative bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`p-4 bg-gray-50 rounded-2xl ${colorClasses.hoverBg} group-hover:scale-110 transition-all duration-300 shadow-inner`}>
                    {getResourceIcon(resource)}
                  </div>
                  <div className="flex gap-2">
                    {resource.resourceType === 'file' ? (
                      <a
                        href={getFileUrl(resource.filePath!)}
                        download={resource.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-indigo-600 ${colorClasses.hoverBg} bg-white rounded-xl shadow-sm border border-gray-50 active:scale-90 transition-all touch-manipulation`}
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    ) : (
                      <>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-indigo-600 ${colorClasses.hoverBg} bg-white rounded-xl shadow-sm border border-gray-50 active:scale-90 transition-all touch-manipulation`}
                          title="Open link"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleCopyUrl(resource.url!)}
                          className={`min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-indigo-600 ${colorClasses.hoverBg} bg-white rounded-xl shadow-sm border border-gray-50 active:scale-90 transition-all touch-manipulation`}
                          title="Copy URL"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, resource })}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 bg-white rounded-xl shadow-sm border border-gray-50 active:scale-90 transition-all touch-manipulation"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-gray-800 text-lg leading-tight line-clamp-2 pr-2" title={resource.title || resource.fileName}>
                    {resource.title || resource.fileName}
                  </h4>
                  {resource.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {resource.resourceType === 'file' && resource.fileSize && (
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        {formatFileSize(resource.fileSize)}
                      </span>
                    )}
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      {format(new Date(resource.createdAt), 'MMM d, yyyy')}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                      resource.resourceType === 'file' 
                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                        : 'bg-purple-50 text-purple-600 border border-purple-100'
                    }`}>
                      {resource.resourceType === 'file' ? 'File' : 'Link'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {resource.uploadedBy === 'Admin' ? (
                      <div className={`flex items-center gap-1.5 px-3 py-1 ${colorClasses.bgSolid} text-white rounded-full shadow-md`}>
                        <Shield className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Tutor</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full shadow-md shadow-emerald-100">
                        <User className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Student</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {resource.uploadedBy}
                  </span>
                </div>

                <div className={`absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity rounded-r-[2rem]`} />
              </div>
            ))}
          </div>
        )}
      </div>


      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, resource: null })}
        onConfirm={handleDelete}
        title={`Delete ${deleteConfirm.resource?.resourceType === 'file' ? 'File' : 'Link'}?`}
        message={
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-gray-800">"{deleteConfirm.resource?.title || deleteConfirm.resource?.fileName}"</span>?
            </p>
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">
                This action cannot be undone{deleteConfirm.resource?.resourceType === 'file' ? ' and the file will be removed from storage' : ''}.
              </p>
            </div>
          </div>
        }
        confirmText="Yes, Delete Permanently"
        cancelText="Cancel"
        type="danger"
      />

      {/* Link Modal */}
      {showLinkModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            // Only close if clicking directly on the backdrop (not on modal content)
            if (e.target === e.currentTarget) {
              closeLinkModal();
            }
          }}
        >
          {/* Modal Content */}
          <div 
            ref={modalContentRef}
            className="relative bg-white rounded-[2rem] shadow-2xl max-w-md w-full animate-scale-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={`p-6 bg-gradient-to-r ${gradientClass} text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black">Add Link</h3>
                </div>
                <button
                  onClick={closeLinkModal}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={linkForm.url}
                  onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={linkForm.title}
                  onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                  placeholder="Resource title"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={linkForm.description}
                  onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                  placeholder="Brief description of this resource"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddLink}
                  disabled={isUploading || !linkForm.url.trim() || !linkForm.title.trim()}
                  className={`flex-1 px-6 py-3 bg-gradient-to-r ${gradientClass} text-white rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    'Add Link'
                  )}
                </button>
                <button
                  onClick={closeLinkModal}
                  disabled={isUploading}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SharedFiles;