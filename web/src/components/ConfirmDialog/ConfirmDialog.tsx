import './ConfirmDialog.css';

interface ConfirmDialogProps {
  title:     string;
  message:   string;
  confirmLabel?: string;
  cancelLabel?:  string;
  variant?:  'danger' | 'default';
  onConfirm: () => void;
  onCancel:  () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  variant      = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
      >
        <div className="dialog__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h2 id="dialog-title" className="dialog__title">{title}</h2>
        <p  id="dialog-desc"  className="dialog__message">{message}</p>

        <div className="dialog__actions">
          <button
            id="dialog-cancel-btn"
            className="dialog__btn dialog__btn--cancel"
            onClick={onCancel}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            id="dialog-confirm-btn"
            className={`dialog__btn dialog__btn--confirm dialog__btn--${variant}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
