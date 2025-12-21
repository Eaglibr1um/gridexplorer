import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, X, Loader2, CheckCircle2, AlertCircle, File, Image, FileVideo, Music, HardDrive, Filter, Search, User, Shield } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import { SharedFile, uploadFile, fetchSharedFiles, deleteSharedFile, getFileUrl } from '../../../services/fileService';
import { format } from 'date-fns';
import ConfirmationModal from '../../ui/ConfirmationModal';

interface SharedFilesProps {
  tutee: Tutee;
  isAdmin?: boolean;
}

const SharedFiles = ({ tutee, isAdmin = false }: SharedFilesProps) => {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; file: SharedFile | null }>({
    isOpen: false,
    file: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [tutee.id]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await fetchSharedFiles(tutee.id);
      setFiles(data);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load files');
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
      setIsTyping(true);
      setError('');
      const uploadedBy = isAdmin ? 'Admin' : tutee.name;
      await uploadFile(file, tutee.id, uploadedBy);
      await loadFiles();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.file) return;

    try {
      setLoading(true);
      await deleteSharedFile(deleteConfirm.file);
      await loadFiles();
      setDeleteConfirm({ isOpen: false, file: null });
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete file.');
    } finally {
      setLoading(false);
    }
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

  const filteredFiles = files.filter(f => 
    f.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const gradientClass = tutee.colorScheme.gradient;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-[2.5rem] shadow-xl overflow-hidden border border-white/40 animate-fade-in-up">
      {/* Header */}
      <div className={`p-6 sm:p-8 bg-gradient-to-r ${gradientClass} text-white shadow-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
              <HardDrive className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight leading-tight">Shared Files</h2>
              <p className="text-xs text-white/80 font-bold uppercase tracking-widest mt-1">Cloud Storage</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              <span>Upload</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-8">
        {/* Search and Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800 shadow-inner"
            />
          </div>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100 shadow-sm self-start md:self-auto">
            <FileText className="w-4 h-4" />
            <span>{files.length} Resources</span>
          </div>
        </div>

        {error && (
          <div className="p-5 bg-red-50 text-red-600 text-sm font-black rounded-2xl border-2 border-red-100 flex items-center gap-3 animate-shake">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading && files.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Syncing Cloud...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-24 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-50">
              <FileText className="w-12 h-12 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tight">Vault Empty</h3>
            <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px] mt-2 max-w-xs mx-auto px-6 leading-relaxed">
              {searchTerm ? "No files match your current search" : "Your shared space is empty. Upload materials to get started!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredFiles.map((file) => (
              <div 
                key={file.id}
                className="group relative bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-indigo-50 group-hover:scale-110 transition-all duration-300 shadow-inner">
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={getFileUrl(file.filePath)}
                      download={file.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 bg-white rounded-xl shadow-sm border border-gray-50 active:scale-90 transition-all"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, file })}
                      className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-white rounded-xl shadow-sm border border-gray-50 active:scale-90 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-gray-800 text-lg leading-tight truncate pr-2" title={file.fileName}>
                    {file.fileName}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      {formatFileSize(file.fileSize)}
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      {format(new Date(file.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {file.uploadedBy === 'Admin' ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-full shadow-md shadow-indigo-100">
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
                    {file.uploadedBy}
                  </span>
                </div>

                <div className={`absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            ))}
          </div>
        )}
      </div>


      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, file: null })}
        onConfirm={handleDelete}
        title="Delete Shared File?"
        message={
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-gray-800">"{deleteConfirm.file?.fileName}"</span>?
            </p>
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">
                This action cannot be undone and the file will be removed from our storage immediately.
              </p>
            </div>
          </div>
        }
        confirmText="Yes, Delete Permanently"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default SharedFiles;
