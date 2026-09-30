import { useEffect, useId, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export default function Dialog({
  title,
  children,
  onClose,
  maxWidth = 'max-w-lg',
  closeDisabled = false
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  }, [onClose, closeDisabled]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !closeDisabledRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;
      const focusable = [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)];
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !closeDisabledRef.current) onCloseRef.current();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropClick}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`dialog-panel max-h-[90dvh] w-full overflow-y-auto rounded-xl bg-white p-5 shadow-2xl ${maxWidth}`}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            disabled={closeDisabled}
            aria-label={`Tutup dialog ${title}`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-2xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
          >
            &times;
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
