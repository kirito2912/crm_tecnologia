import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CsvProvider } from './context/CsvContext';
import { ReportsProvider } from './context/ReportsContext';
import { DocumentosProvider } from './context/DocumentosContext';
import { InvitacionesProvider } from './context/InvitacionesContext';

import { AuthPage } from './components/auth/AuthPage';
import { PendingApprovalScreen } from './components/auth/PendingApprovalScreen';
import { Sidebar } from './components/layout/Sidebar';
import type { NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotificationsModal } from './components/layout/NotificationsModal';

import { DatasetView } from './components/dataset/DatasetView';
import { ComparacionView } from './components/comparacion/ComparacionView';
import { AdminReportsView } from './components/admin/AdminReportsView';
import { DocumentosView } from './components/documentos/DocumentosView';
import { InvitacionesView } from './components/admin/InvitacionesView';

import { Cpu } from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();
  const role = (user?.role || 'analista').toLowerCase();
  const isAdmin = role === 'administrador' || role === 'admin';

  const [activeTab, setActiveTab] = useState<NavTab>(isAdmin ? 'reports' : 'dataset');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Estados para compartir selección entre Datasets y Comparativa (analista)
  const [preselectedA, setPreselectedA] = useState<string | undefined>(undefined);
  const [preselectedB, setPreselectedB] = useState<string | undefined>(undefined);

  // Ajustar tab por defecto si cambia el rol:
  // - Administrador reemplaza CSV por Documentos
  // - Analista puede navegar libremente por Reportes, Datasets, Documentos y Comparativa
  useEffect(() => {
    if (isAdmin && activeTab === 'dataset') {
      setActiveTab('documentos');
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
          />
        )}

        {/* Tab 2: Gestión de Invitaciones y Personal (Solo Administrador) */}
        {activeTab === 'invitaciones' && <InvitacionesView />}

        {/* Tab 3: Datasets de Empresas CSV (Analista) */}
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

        {/* Tab 4: Módulo Compartido de Documentos Word y PDF (Administrador & Analista) */}
        {activeTab === 'documentos' && (
          <DocumentosView searchQuery={searchQuery} />
        )}

        {/* Tab 5: Módulo de Comparativa Interactiva (Analista & Admin) */}
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
  const { user, isAuthenticated, isLoading } = useAuth();

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
  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  // 2. Si la cuenta está deshabilitada o pendiente de autorización, mostrar pantalla de bloqueo
  const isPendingApproval = user.habilitado === false || user.estado === 'pendiente_aprobacion';
  if (isPendingApproval) {
    return <PendingApprovalScreen />;
  }

  // 3. Si está autenticado y habilitado, ingresar a la plataforma
  return <DashboardContent />;
}

export function App() {
  return (
    <AuthProvider>
      <InvitacionesProvider>
        <ReportsProvider>
          <CsvProvider>
            <DocumentosProvider>
              <MainApp />
            </DocumentosProvider>
          </CsvProvider>
        </ReportsProvider>
      </InvitacionesProvider>
    </AuthProvider>
  );
}

export default App;


