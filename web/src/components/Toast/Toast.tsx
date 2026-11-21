import { useEffect, useRef } from 'react';
import type { ToastData } from './Toast.types';
import './Toast.css';

interface ToastProps {
  toast:    ToastData;
  onRemove: (id: string) => void;
}

export function Toast({ toast, onRemove }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`toast toast--${toast.type}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast__icon">
        {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '⚠'}
      </span>
      <p className="toast__message">{toast.message}</p>
      <button
        className="toast__close"
        onClick={() => onRemove(toast.id)}
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  );
}
