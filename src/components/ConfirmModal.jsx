import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

/**
 * Custom Dark Navy + Amber Glassmorphic Confirmation Modal
 * Replaces native blocking window.confirm() and alert() calls with accessible, themed dialogs.
 */
export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'Please confirm this action to proceed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-[#060b18]/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative max-w-md w-full bg-[#0d1528] border border-white/10 rounded-2xl p-6 shadow-2xl z-10 animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Close icon button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isDanger ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>

          <div className="flex-1 pr-4">
            <h3 id="confirm-modal-title" className="text-lg font-semibold text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-white/8">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition-all focus:outline-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg focus:outline-none active:scale-[0.99] ${
              isDanger
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-amber-500/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
