import { createContext, useState, useCallback, useRef, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    timers.current.set(id, setTimeout(() => removeToast(id), 3000));
  }, [removeToast]);

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[1000] w-[calc(100%-2rem)] max-w-sm space-y-2" aria-live="polite" aria-atomic="false">
        {toasts.map(toast => (
          <div
            key={toast.id}
            role={toast.type === 'success' ? 'status' : 'alert'}
            className={`px-4 py-2 rounded shadow-lg text-white transition-all duration-300 ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.message}
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Tutup notifikasi"
              className="ml-3 text-white opacity-80 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
