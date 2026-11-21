import { useCallback, useState } from 'react';
import type { ToastData, ToastType } from './Toast.types';

/** Hook para gestionar el sistema de notificaciones */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, push, remove };
}

