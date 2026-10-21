import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavigation } from './components/layout/TopNavigation';
import { DashboardView } from './components/views/DashboardView';
import { RekapPelanggaranView } from './components/views/RekapPelanggaranView';
import { DataSantriView } from './components/views/DataSantriView';
import { DataPelanggaranView } from './components/views/DataPelanggaranView';
import { CatatPelanggaranView } from './components/views/CatatPelanggaranView';
import { DataPembinaanView } from './components/views/DataPembinaanView';
import { RiwayatPembinaanView } from './components/views/RiwayatPembinaanView';
import { LaporanPembinaanView } from './components/views/LaporanPembinaanView';
import { AkunView } from './components/views/AkunView';
import { ManajemenUserView } from './components/views/ManajemenUserView';
import { InputMutabaahView } from './components/views/InputMutabaahView';
import { LoginView } from './components/views/LoginView';
import { DetailSantriModal } from './components/common/DetailSantriModal';
import { DatabaseSettingsModal } from './components/common/DatabaseSettingsModal';
import { ToastContainer } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { canRoleAccessRoute, getDefaultRouteForRole } from './lib/auth';

const AppContent: React.FC = () => {
  const { currentRoute, isAuthenticated, user, isDatabaseModalOpen, closeDatabaseModal, refreshData } = useApp();
  const { setAppAuthenticated } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setAppAuthenticated(Boolean(isAuthenticated && user));
  }, [isAuthenticated, user, setAppAuthenticated]);

  // If not logged in, show the simple username/password Login screen
  if (!isAuthenticated || !user) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    // Route guard check: if user cannot access currentRoute, redirect to allowed default
    const isAllowed = canRoleAccessRoute(user.role, currentRoute);
    const activeRoute = isAllowed ? currentRoute : getDefaultRouteForRole(user.role);

    switch (activeRoute) {
      case 'dashboard':
        return <DashboardView />;
      case 'rekap-pelanggaran':
        return <RekapPelanggaranView />;
      case 'data-santri':
        return <DataSantriView />;
      case 'data-pelanggaran':
      case 'kamus-pelanggaran':
        return <DataPelanggaranView />;
      case 'catat-pelanggaran':
        return <CatatPelanggaranView />;
      case 'input-mutabaah':
        return <InputMutabaahView />;
      case 'data-pembinaan':
        return <DataPembinaanView />;
      case 'riwayat-pembinaan':
        return <RiwayatPembinaanView />;
      case 'laporan-pembinaan':
        return <LaporanPembinaanView />;
      case 'manajemen-user':
        return <ManajemenUserView />;
      case 'akun':
        return <AkunView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#07101F] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col lg:flex-row antialiased transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[285px] flex flex-col min-w-0 min-h-screen">
        {/* Top Navigation Bar */}
        <TopNavigation onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary fallbackTitle="Terjadi Kendala Memuat Halaman">
            {renderActiveView()}
          </ErrorBoundary>
        </main>
      </div>

      {/* Modals & Notification Containers */}
      <DetailSantriModal />
      <DatabaseSettingsModal 
        isOpen={isDatabaseModalOpen} 
        onClose={closeDatabaseModal} 
        onConfigUpdated={refreshData} 
      />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
