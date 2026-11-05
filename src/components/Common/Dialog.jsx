import { useEffect, useId, useRef } from 'react';

export default function Dialog({
  title,
  children,
  onClose,
  maxWidth = 'max-w-lg',
  closeDisabled = false
}) {
  const titleId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    dialog.showModal();
    dialog.querySelector('[data-autofocus]')?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  const requestClose = () => {
    if (!closeDisabled) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); requestClose(); }}
      // Chrome bisa tetap menutup dialog bila Escape ditekan berulang; samakan state React.
      onClose={onClose}
      onMouseDown={event => { if (event.target === event.currentTarget) requestClose(); }}
      className={`dialog-panel max-h-[90dvh] w-full overflow-y-auto rounded-xl bg-white p-0 shadow-2xl backdrop:bg-black/50 ${maxWidth}`}
    >
      {/* Padding di elemen dalam: klik di area dialog sendiri hanya terjadi di backdrop. */}
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={requestClose}
            disabled={closeDisabled}
            aria-label={`Tutup dialog ${title}`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-2xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
