import React, { useState } from 'react';
import { uploadAttachment } from '../services/taskService';
import { Paperclip, Upload, FileText, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import {
  MAX_FILE_SIZE_BYTES,
  isAllowedFileSize,
  isAllowedFileType,
  isSafeUrl,
} from '../utils/validation';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';

export default function AttachmentUploader({ taskId, attachments = [], onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setError('');
    setSuccess('');
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!isAllowedFileSize(selectedFile, MAX_FILE_SIZE_BYTES)) {
      setError('File size exceeds the 10MB maximum limit.');
      setFile(null);
      e.target.value = '';
      return;
    }

    if (!isAllowedFileType(selectedFile)) {
      setError('Unsupported file type. Please upload PDF, images (PNG, JPG, WebP), JSON, or text files.');
      setFile(null);
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a valid file to upload');
      return;
    }

    if (!isAllowedFileSize(file, MAX_FILE_SIZE_BYTES)) {
      setError('File size exceeds the 10MB maximum limit.');
      return;
    }

    if (!isAllowedFileType(file)) {
      setError('Unsupported file type. Allowed formats: PDF, images, JSON, TXT.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const updatedTask = await uploadAttachment(taskId, formData);
      setSuccess('Attachment uploaded successfully.');
      setFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(updatedTask.data || updatedTask);
      }
    } catch (err) {
      setError(sanitizeErrorMessage(err, 'Failed to upload attachment. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-white/8 pt-4 mt-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
        <span className="flex items-center">
          <Paperclip className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
          Attachments ({attachments.length})
        </span>
        <span className="text-[10px] text-slate-500 lowercase font-mono">max 10mb</span>
      </h4>

      {/* Attachment List */}
      {attachments.length > 0 ? (
        <ul className="divide-y divide-white/8 border border-white/8 rounded-xl bg-white/[0.02] overflow-hidden">
          {attachments.map((att, index) => {
            const fileName = att.filename || att.originalName || 'Attachment';
            const safe = isSafeUrl(att.url);
            return (
              <li key={att._id || index} className="py-2.5 px-3 flex items-center justify-between text-xs hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center space-x-2 truncate pr-2">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                  {safe ? (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 hover:text-indigo-200 hover:underline truncate font-medium flex items-center"
                      title={fileName}
                    >
                      <span>{fileName}</span>
                      <ExternalLink className="w-3 h-3 ml-1 shrink-0 opacity-70" />
                    </a>
                  ) : (
                    <span className="text-slate-400 line-through" title="Unsafe attachment link disabled">
                      {fileName}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                  {att.createdAt ? new Date(att.createdAt).toLocaleDateString() : ''}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-slate-500 italic">No attachments uploaded yet.</p>
      )}

      {/* File Upload Form */}
      {taskId ? (
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <input
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/15 file:text-amber-300 hover:file:bg-amber-500/25 file:cursor-pointer transition-colors"
          />
          <button
            type="submit"
            disabled={uploading || !file}
            className="inline-flex items-center justify-center px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-40 shrink-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Upload className="w-3.5 h-3.5 mr-1.5" />
            )}
            Upload
          </button>
        </form>
      ) : (
        <p className="text-xs text-amber-400/80 italic">Save task first to attach files.</p>
      )}

      {/* Status Messages */}
      {error && (
        <div className="text-xs text-red-400 flex items-center space-x-1.5 bg-red-500/10 p-2 rounded-lg border border-red-500/20 animate-shake">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="text-xs text-emerald-400 flex items-center space-x-1.5 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}

