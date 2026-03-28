import React, { createContext, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);
let uid = 0;

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

const normalizeToast = (input, type) =>
  typeof input === 'string' ? { message: input, type } : { ...input, type };

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = (id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const show = (payload, type = 'info', duration = 3000) => {
    const id = ++uid;
    const next = { id, duration, ...normalizeToast(payload, type) };
    setToasts((prev) => [...prev.slice(-3), next]);
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  };

  const toast = {
    success: (payload, duration) => show(payload, 'success', duration),
    error: (payload, duration) => show(payload, 'error', duration),
    info: (payload, duration) => show(payload, 'info', duration),
  };

  const icons = { success: '✓', error: '✕', info: 'i' };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toastItem) => (
          <div key={toastItem.id} className={`toast toast-${toastItem.type}`} role="status">
            <span className="toast-icon" aria-hidden="true">
              {icons[toastItem.type]}
            </span>
            <div className="toast-content">
              <p className="toast-message">{toastItem.message}</p>
              {toastItem.actionLabel && toastItem.onAction ? (
                <button
                  type="button"
                  className="toast-action"
                  onClick={() => {
                    toastItem.onAction();
                    dismiss(toastItem.id);
                  }}
                >
                  {toastItem.actionLabel}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(toastItem.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
