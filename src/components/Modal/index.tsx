import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width class override. Defaults to max-w-md. */
  maxWidthClass?: string;
  /** When true, render a subtle click-blocker inside the card so the
   *  backdrop click handler isn't fired by card content clicks.
   *  (Backdrop already stops propagation from itself, so this is just
   *  defensive — left as future hook for nested clickable children.) */
  ariaLabel?: string;
}

/**
 * Accessible modal: backdrop overlay, ESC to close, click-outside to
 * close, body scroll lock. Portal-rendered to <body> so it escapes any
 * parent overflow:hidden / transform context.
 */
export default function Modal({
  open,
  onClose,
  children,
  maxWidthClass = 'max-w-md',
  ariaLabel = 'Dialog',
}: ModalProps) {
  // ESC + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        tabIndex={-1}
      />
      {/* Card container — child component (e.g. DetailActivity) provides
          its own background / border / padding. Modal is just backdrop,
          centering, scroll-lock, and ESC handling. */}
      <div
        className={`relative z-10 w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
