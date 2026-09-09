import { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CsvProvider } from './context/CsvContext';
import { ReportsProvider } from './context/ReportsContext';
import { DocumentosProvider } from './context/DocumentosContext';
import { InvitacionesProvider, useInvitaciones } from './context/InvitacionesContext';

import { AuthPage } from './components/auth/AuthPage';
import { PendingApprovalScreen } from './components/auth/PendingApprovalScreen';
import { ProjectSelector } from './components/auth/ProjectSelector';
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

interface DashboardContentProps {
  project: string;
  onLogout: () => void;
}

function DashboardContent({ project, onLogout }: DashboardContentProps) {
  const { user } = useAuth();
  const { solicitudesPendientes } = useInvitaciones();
  const role = (user?.role || 'analista').toLowerCase();
  const isAdmin = role === 'administrador' || role === 'admin';

  const [activeTab, setActiveTab] = useState<NavTab>(isAdmin ? 'reports' : 'dataset');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const baseNotifications = 3;
  const pendingApprovalCount = solicitudesPendientes.length;
  const totalUnread = isAdmin ? baseNotifications + pendingApprovalCount : baseNotifications - 1;

  // Estados para compartir selección entre Datasets y Comparativa (analista)
  const [preselectedA, setPreselectedA] = useState<string | undefined>(undefined);
  const [preselectedB, setPreselectedB] = useState<string | undefined>(undefined);

  return (
    <div className="app-container">
      {/* Barra de Navegación Lateral con Tabs por Rol */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
        selectedProject={project}
        onLogout={onLogout}
      />

      {/* Contenido Principal */}
      <main className="main-content">
        <Header
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadCount={totalUnread}
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

const PERMISSIONS_STORAGE_KEY = 'hardcrm_user_permissions_v2';

function MainApp() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Compute allowed projects for current user from localStorage
  const allowedProjects = useMemo<string[] | null>(() => {
    if (!user?.id) return null;
    try {
      const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
      if (!raw) return null;
      const perms: Record<string, string[]> = JSON.parse(raw);
      const userPerms = perms[user.id];
      if (Array.isArray(userPerms)) return userPerms;
    } catch {
      // ignore parse errors
    }
    return null;
  }, [user?.id]);

  // Reset project on logout
  const handleLogout = () => {
    setSelectedProject(null);
    logout();
  };

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
        <Cpu className="animate-spin" size={36} color="#00d4ff" />
        <span style={{ fontSize: '14px', color: '#6b7494', fontWeight: 600 }}>
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

  // 3. Si está autenticado y habilitado, mostrar selector de proyecto primero
  if (!selectedProject) {
    return (
      <ProjectSelector
        allowedProjects={allowedProjects}
        onSelectProject={setSelectedProject}
      />
    );
  }

  // 4. Proyecto seleccionado → ingresar a la plataforma
  return <DashboardContent project={selectedProject} onLogout={handleLogout} />;
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


