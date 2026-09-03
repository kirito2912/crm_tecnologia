import React from 'react';
import { Search, Bell, Shield, User } from 'lucide-react';
import type { NavTab } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  activeTab: NavTab;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  searchQuery,
  onSearchChange,
  onOpenNotifications,
  unreadCount = 1,
}) => {
  const { user } = useAuth();
  const role = (user?.role || 'analista').toLowerCase();
  const isAdmin = role === 'administrador' || role === 'admin';

  const getTitles = () => {
    switch (activeTab) {
      case 'reports':
        return {
          title: isAdmin ? 'Bandeja de Reportes de Comparativas' : 'Reportes de Comparativas y Auditoría',
          subtitle: isAdmin
            ? 'Revisión y retroalimentación ejecutiva de los análisis de empresas'
            : 'Historial de análisis comparativos, auditorías y retroalimentación de la administración',
        };

      case 'dataset':
        return {
          title: 'Datasets de Empresas',
          subtitle: 'Catálogos CSV, registros de ventas y preparación de comparativas',
        };
      case 'documentos':
        return {
          title: 'Documentos Word y PDF',
          subtitle: 'Repositorio corporativo compartido de contratos, especificaciones e informes',
        };
      case 'invitaciones':
        return {
          title: 'Gestión de Invitaciones y Personal',
          subtitle: 'Generación de enlaces únicos estilo GitHub, control de altas y autorización de cuentas',
        };
      case 'comparativa':
        return {
          title: 'Módulo de Comparativa',
          subtitle: 'Análisis cruzado de precios, catálogo, volúmenes e informes ejecutivos',
        };
      default:
        return {
          title: 'Plataforma Analítica',
          subtitle: 'Inteligencia comparativa de empresas',
        };
    }
  };

  const { title, subtitle } = getTitles();

  return (
    <header className="top-header">
      <div className="header-titles">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 className="page-title">{title}</h1>
          <span
            className="header-role-badge"
            style={{
              background: isAdmin ? '#e0e7ff' : '#dcfce7',
              color: isAdmin ? '#4338ca' : '#15803d',
              padding: '3px 9px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isAdmin ? <Shield size={12} /> : <User size={12} />}
            {isAdmin ? 'Modo Administrador' : 'Modo Analista'}
          </span>
        </div>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      <div className="header-actions">
        <div className="search-bar-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={
              activeTab === 'reports'
                ? 'Buscar por reporte, empresa o analista...'
                : activeTab === 'documentos'
                ? 'Buscar documentos por nombre, categoría, tags o autor...'
                : activeTab === 'invitaciones'
                ? 'Buscar por nombre, correo o rol de trabajador...'
                : 'Buscar dataset, producto o empresa...'
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>


        <button
          className="icon-button"
          onClick={onOpenNotifications}
          title="Notificaciones y Avisos"
          aria-label="Ver notificaciones"
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="notification-dot" />}
        </button>
      </div>
    </header>
  );
};
