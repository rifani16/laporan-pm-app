import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
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

function StatePanel({ title, children }) {
  return (
    <div role="status" className="mx-auto mt-10 max-w-lg rounded-lg border border-gray-200 bg-white p-6 text-center">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      <p className="mt-2 text-sm text-gray-600">{children}</p>
    </div>
  );
}

function PageContent() {
  const { isSuperAdmin, userDaerah } = useAuth();
  const { loaded, error } = useData();

  if (!isSuperAdmin && !userDaerah) {
    return (
      <StatePanel title="Akun belum memiliki daerah">
        Data hanya tampil untuk daerah akun Anda. Minta Super Admin mengisi kolom daerah untuk akun ini di sheet Users, lalu login ulang.
      </StatePanel>
    );
  }

  // Gagal muat pertama: jangan tampilkan tabel kosong seolah datanya memang tidak ada.
  if (error && !loaded) {
    return (
      <StatePanel title="Data belum bisa dimuat">
        Halaman ini butuh data dari server. Tekan "Coba lagi" di bagian atas. Kalau tetap gagal, periksa koneksi internet.
      </StatePanel>
    );
  }

  return (
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
  );
}

function MobileSidebar({ onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => dialogRef.current.showModal(), []);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Menu navigasi"
      onClose={onClose}
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}
      className="m-0 h-dvh max-h-none w-64 p-0 backdrop:bg-black/50 md:hidden"
    >
      <Sidebar isMobile onClose={onClose} />
    </dialog>
  );
}

function AuthenticatedApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

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
        {sidebarOpen && <MobileSidebar onClose={closeSidebar} />}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header toggleSidebar={() => setSidebarOpen(true)} />
          <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="mx-auto w-full max-w-screen-2xl">
              <PageContent />
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
