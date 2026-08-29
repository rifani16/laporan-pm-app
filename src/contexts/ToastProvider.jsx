import { createContext, useState, useCallback } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
