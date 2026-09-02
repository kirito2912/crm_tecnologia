import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CsvProvider } from './context/CsvContext';
import { ReportsProvider } from './context/ReportsContext';

import { AuthPage } from './components/auth/AuthPage';
import { Sidebar } from './components/layout/Sidebar';
import type { NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotificationsModal } from './components/layout/NotificationsModal';

import { DatasetView } from './components/dataset/DatasetView';
import { ComparacionView } from './components/comparacion/ComparacionView';
import { AdminReportsView } from './components/admin/AdminReportsView';

import { Cpu } from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();
  const role = (user?.role || 'analista').toLowerCase();
  const isAdmin = role === 'administrador' || role === 'admin';

  const [activeTab, setActiveTab] = useState<NavTab>(isAdmin ? 'reports' : 'dataset');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Estados para compartir selección entre Datasets/Reportes y Comparativa
  const [preselectedA, setPreselectedA] = useState<string | undefined>(undefined);
  const [preselectedB, setPreselectedB] = useState<string | undefined>(undefined);

  // Ajustar tab por defecto si cambia el rol
  useEffect(() => {
    if (isAdmin && activeTab !== 'reports' && activeTab !== 'dataset' && activeTab !== 'comparativa') {
      setActiveTab('reports');
    } else if (!isAdmin && activeTab === 'reports') {
      setActiveTab('dataset');
    }
  }, [isAdmin, activeTab]);

  return (
    <div className="app-container">
      {/* Barra de Navegación Lateral con Tabs por Rol */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
      />

      {/* Contenido Principal */}
      <main className="main-content">
        <Header
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadCount={isAdmin ? 2 : 1}
        />

        {/* Tab 1: Bandeja de Reportes de Comparativas (Solo Administrador) */}
        {activeTab === 'reports' && (
          <AdminReportsView
            searchQuery={searchQuery}
            onOpenComparison={(idA, idB) => {
              setPreselectedA(idA);
              setPreselectedB(idB);
              setActiveTab('comparativa');
            }}
          />
        )}

        {/* Tab 2: Datasets de Empresas (Analista & Admin) */}
        {activeTab === 'dataset' && (
          <DatasetView
            searchQuery={searchQuery}
            onGoToComparativa={(idA, idB) => {
              setPreselectedA(idA);
              setPreselectedB(idB);
              setActiveTab('comparativa');
            }}
          />
        )}

        {/* Tab 3: Módulo de Comparativa Interactiva (Analista & Admin) */}
        {activeTab === 'comparativa' && (
          <ComparacionView
            preselectedA={preselectedA}
            preselectedB={preselectedB}
          />
        )}
      </main>

      {/* Modal de Notificaciones */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
}

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f4f6fa',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <Cpu className="animate-spin" size={36} color="#0052cc" />
        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
          Cargando entorno seguro...
        </span>
      </div>
    );
  }

  // 1. Si no está autenticado, entrar directo a la pantalla de Inicio de Sesión
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // 2. Si está autenticado, entrar directo a la plataforma
  return <DashboardContent />;
}

export function App() {
  return (
    <AuthProvider>
      <ReportsProvider>
        <CsvProvider>
          <MainApp />
        </CsvProvider>
      </ReportsProvider>
    </AuthProvider>
  );
}

export default App;
