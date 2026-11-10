import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Button from './Button.jsx';

const ModalCloseContext = createContext(null);

/** A modal footer button that respects the modal's unsaved-changes guard. */
export function ModalCloseButton({ children = 'Cancel', ...props }) {
  const requestClose = useContext(ModalCloseContext);
  return <Button {...props} onClick={requestClose || props.onClick}>{children}</Button>;
}

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md', hasUnsavedChanges = false, closeDisabled = false }) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const requestClose = useCallback(() => {
    if (closeDisabled) return;
    if (hasUnsavedChanges) setConfirmDiscard(true);
    else onClose();
  }, [closeDisabled, hasUnsavedChanges, onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        if (confirmDiscard) setConfirmDiscard(false);
        else requestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmDiscard, requestClose]);

  if (!isOpen) return null;

  return (
    <ModalCloseContext.Provider value={requestClose}>
      <div className="modal-overlay" onClick={requestClose} role="dialog" aria-modal="true">
        <div
          className={`modal-content${size === 'lg' ? ' modal-content-lg' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button
              onClick={requestClose}
              disabled={closeDisabled}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-sm)',
              }}
              aria-label="Close modal dialog"
            >
              <X size={18} />
            </button>
          </div>

          {confirmDiscard && (
            <div className="alert alert-info" role="alertdialog" aria-label="Discard unsaved changes" style={{ margin: '16px 20px 0', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <span>You have unsaved changes. Discard them?</span>
              <span style={{ display: 'inline-flex', gap: '8px' }}>
                <Button variant="secondary" size="sm" autoFocus disabled={closeDisabled} onClick={() => setConfirmDiscard(false)}>Keep editing</Button>
                <Button variant="danger" size="sm" disabled={closeDisabled} onClick={onClose}>Discard changes</Button>
              </span>
            </div>
          )}

          <div className="modal-body">{children}</div>

          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </ModalCloseContext.Provider>
  );
}
