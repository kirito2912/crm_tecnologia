import React from 'react';
import { LayoutGrid, Users, Package, ReceiptText, Network, LogOut, BrainCircuit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'dashboard' | 'clients' | 'products' | 'sales' | 'predictions';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutGrid },
    { id: 'clients' as NavTab, label: 'Clientes', icon: Users },
    { id: 'products' as NavTab, label: 'Productos', icon: Package },
    { id: 'sales' as NavTab, label: 'Ventas', icon: ReceiptText },
    { id: 'predictions' as NavTab, label: 'Carga y Predicción', icon: BrainCircuit },
  ];

  const displayName = user?.name || 'Jane Doe';
  const displayRole = user?.role || 'Big Data Lead';
  const displayAvatar = user?.avatar || 'JD';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo-icon" style={{ background: '#ffffff', boxShadow: 'none', border: '1px solid #e2e8f0' }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="14" width="5.5" height="14" rx="2.75" fill="#4f5bc9" opacity="0.85" />
            <rect x="13.25" y="6" width="5.5" height="22" rx="2.75" fill="#4f5bc9" />
            <rect x="22.5" y="10" width="5.5" height="18" rx="2.75" fill="#7e87e8" />
          </svg>
        </div>
        <div className="brand-info">
          <span className="brand-title" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>nexaflow</span>
          <span className="brand-subtitle" style={{ fontSize: '9px', letterSpacing: '0.8px', fontWeight: 700 }}>TU EQUIPO, EN SINCRONÍA</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
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
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">{displayAvatar}</div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <span className="user-name" title={displayName} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
            <span className="user-role" title={displayRole} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {displayRole}
            </span>
          </div>
          <button
            type="button"
            className="logout-btn"
            onClick={logout}
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
