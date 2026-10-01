import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { DataProvider } from './contexts/DataProvider';
import { ToastProvider } from './contexts/ToastProvider';
import ProtectedRoute from './components/Common/ProtectedRoute';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MasterDataPage from './pages/MasterDataPage';
import PenyaluranPage from './pages/PenyaluranPage';
import ProgramPenerimaPage from './pages/ProgramPenerimaPage';
import ProgramManagementPage from './pages/ProgramManagementPage';

function AuthenticatedApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  return (
    <DataProvider>
      <a
        href="#main-content"
        className="sr-only z-[1000] rounded bg-white px-4 py-2 text-teal-800 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Lewati ke konten utama
      </a>
      <div className="relative flex h-dvh bg-gray-100">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        {sidebarOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="fixed inset-y-0 left-0 z-30 w-64 md:hidden"
          >
            <Sidebar isMobile onClose={closeSidebar} />
          </div>
        )}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
        <div
          className="flex flex-1 flex-col overflow-hidden"
          inert={sidebarOpen ? '' : undefined}
          aria-hidden={sidebarOpen || undefined}
        >
          <Header toggleSidebar={toggleSidebar} />
          <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="mx-auto w-full max-w-screen-2xl">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/master" element={<MasterDataPage />} />
                <Route path="/salur" element={<PenyaluranPage />} />
                <Route path="/program-penerima" element={<ProgramPenerimaPage />} />
                <Route
                  path="/program"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <ProgramManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </DataProvider>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AuthenticatedApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
