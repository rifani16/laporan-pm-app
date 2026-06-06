import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { DataProvider } from './contexts/DataProvider';
import { ToastProvider } from './contexts/ToastProvider';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import DashboardPage from './pages/DashboardPage';
import MasterDataPage from './pages/MasterDataPage';
import PenyaluranPage from './pages/PenyaluranPage';
import ProgramPenerimaPage from './pages/ProgramPenerimaPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <DataProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="flex h-screen bg-gray-100 relative">
            <div className="hidden md:block">
              <Sidebar />
            </div>
            <div
              className={`fixed inset-0 z-20 transition-transform duration-300 transform ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              } md:hidden`}
            >
              <Sidebar isMobile onClose={closeSidebar} />
            </div>
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                onClick={closeSidebar}
              />
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header toggleSidebar={toggleSidebar} />
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/master" element={<MasterDataPage />} />
                  <Route path="/salur" element={<PenyaluranPage />} />
                  <Route path="/program-penerima" element={<ProgramPenerimaPage />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </DataProvider>
  );
}

export default App;