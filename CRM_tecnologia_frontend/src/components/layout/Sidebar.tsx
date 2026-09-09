import {
  FileText,
  Database,
  GitCompare,
  LogOut,
  Files,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInvitaciones } from '../../context/InvitacionesContext';

export type NavTab = 'reports' | 'dataset' | 'documentos' | 'comparativa' | 'invitaciones';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedProject?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, selectedProject, onLogout }) => {
  const { user, logout } = useAuth();
  const { kpis } = useInvitaciones();

  const handleLogout = onLogout ?? logout;

  const role = (user?.role || 'analista').toLowerCase();
  const isAdmin = role === 'administrador' || role === 'admin';

  // Ítems de navegación dinámicos según el rol:
  // - Administrador: Reportes, Gestión de Personal e Invitaciones, Documentos Word y PDF
  // - Analista: Reportes, Datasets CSV, Documentos Word y PDF y Comparativa
  const menuItems = isAdmin
    ? [
        { id: 'reports' as NavTab, label: 'Reportes de Comparativas', icon: FileText },
        {
          id: 'invitaciones' as NavTab,
          label: 'Gestión de Invitaciones',
          icon: UserPlus,
          badge: kpis.usuariosPendientes > 0 ? kpis.usuariosPendientes : undefined,
        },
        { id: 'dataset' as NavTab, label: 'Datasets de Empresas', icon: Database },
        { id: 'documentos' as NavTab, label: 'Documentos Word y PDF', icon: Files },
        { id: 'comparativa' as NavTab, label: 'Módulo Comparativa', icon: GitCompare },
      ]
    : [
        { id: 'reports' as NavTab, label: 'Reportes de Comparativas', icon: FileText },
        { id: 'dataset' as NavTab, label: 'Datasets de Empresas', icon: Database },
        { id: 'documentos' as NavTab, label: 'Documentos Word y PDF', icon: Files },
        { id: 'comparativa' as NavTab, label: 'Módulo Comparativa', icon: GitCompare },
      ];



  const displayName = user?.name || (isAdmin ? 'Jane Doe (Admin)' : 'Carlos Mendoza (Analista)');
  const displayRole = isAdmin ? 'Administrador' : 'Analista de Datos';
  const displayAvatar = user?.avatar || (isAdmin ? 'AD' : 'AN');

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div
          className="brand-logo-icon"
          style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #bf00ff 100%)', boxShadow: '0 0 20px rgba(0, 212, 255, 0.45)', border: 'none' }}
        >
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="14" width="5.5" height="14" rx="2.75" fill="#00d4ff" opacity="0.85" />
            <rect x="13.25" y="6" width="5.5" height="22" rx="2.75" fill="#00d4ff" />
            <rect x="22.5" y="10" width="5.5" height="18" rx="2.75" fill="#33e0ff" />
          </svg>
        </div>
        <div className="brand-info">
          <span className="brand-title" style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            DataTech Analytics
          </span>
          <span className="brand-subtitle" style={{ fontSize: '9px', letterSpacing: '0.8px', fontWeight: 700 }}>
            {selectedProject
              ? selectedProject.toUpperCase()
              : isAdmin
              ? 'PANEL ADMINISTRADOR'
              : 'PLATAFORMA ANALISTA'}
          </span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item: any) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="sidebar-link-icon">
                <Icon size={18} strokeWidth={isActive ? 2.3 : 1.9} />
              </span>
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.badge !== undefined && (
                <span className="sidebar-badge-alert">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar" style={{ background: isAdmin ? '#00b8e6' : '#00ff88' }}>
            {displayAvatar}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <span
              className="user-name"
              title={displayName}
              style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              {displayName}
            </span>
            <span
              className="user-role"
              title={displayRole}
              style={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                color: isAdmin ? '#00b8e6' : '#00ff88',
                fontWeight: 700,
              }}
            >
              {displayRole}
            </span>
          </div>
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            title="Cerrar Sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
