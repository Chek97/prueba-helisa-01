export type ToastType = 'success' | 'error' | 'warning';

export interface ToastData {
  id:      string;
  type:    ToastType;
  message: string;
}
