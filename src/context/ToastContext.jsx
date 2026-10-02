import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Undo2 } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, action, duration = 4500 }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, type, title, message, action };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title, message, action) => {
    return addToast({ type: 'success', title, message, action });
  }, [addToast]);

  const error = useCallback((title, message, action) => {
    return addToast({ type: 'error', title, message, action, duration: 6000 });
  }, [addToast]);

  const info = useCallback((title, message, action) => {
    return addToast({ type: 'info', title, message, action });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
      {children}
      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-fadeIn ${
                isSuccess
                  ? 'bg-[#0a1b1a]/95 border-emerald-500/30 text-emerald-100'
                  : isError
                  ? 'bg-[#220d13]/95 border-red-500/30 text-red-100'
                  : 'bg-[#0d1528]/95 border-white/15 text-slate-100'
              }`}
              role="alert"
            >
              <div className="flex items-start gap-3">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                {isError && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}

                <div className="flex-1 text-sm">
                  {toast.title && <p className="font-semibold text-white leading-snug">{toast.title}</p>}
                  {toast.message && <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>}
                  {toast.action && (
                    <button
                      onClick={() => {
                        toast.action.onClick();
                        removeToast(toast.id);
                      }}
                      className="mt-2 inline-flex items-center text-xs font-semibold text-amber-400 hover:text-amber-300 underline gap-1"
                    >
                      <Undo2 className="w-3 h-3" />
                      {toast.action.label || 'Undo'}
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 -mr-1 -mt-1 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
