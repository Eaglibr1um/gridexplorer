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
    <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-indigo-50 animate-fade-in-up">
      {/* Header */}
      <div className={`p-6 bg-gradient-to-r ${gradientClass} text-white`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <HardDrive className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Shared Files</h2>
              <p className="text-xs text-white/80 font-bold uppercase tracking-widest">Secure Document Exchange</p>
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
              className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-all disabled:opacity-50 press-effect"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload File
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Search and Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search files by name or sender..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            {files.length} Files Total
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {loading && files.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="text-gray-500 font-medium">Gathering your documents...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">No files found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              {searchTerm ? "No files match your search criteria." : "Start by uploading your first document to share!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => (
              <div 
                key={file.id}
                className="group relative bg-white border border-gray-100 rounded-3xl p-5 hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={getFileUrl(file.filePath)}
                      download={file.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, file })}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-gray-800 text-sm truncate pr-2 tracking-tight" title={file.fileName}>
                    {file.fileName}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {formatFileSize(file.fileSize)}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {format(new Date(file.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {file.uploadedBy === 'Admin' ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Shield className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Tutor</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                        <User className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Student</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
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
