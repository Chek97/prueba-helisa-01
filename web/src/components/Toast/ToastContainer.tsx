import { Toast } from './Toast';
import type { ToastData } from './Toast.types';
import './Toast.css';

interface ToastContainerProps {
  toasts:   ToastData[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="toast-container" aria-label="Notificaciones">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
