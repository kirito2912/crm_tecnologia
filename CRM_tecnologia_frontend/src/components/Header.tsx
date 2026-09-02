import React from 'react';
import { Search, Bell } from 'lucide-react';
import type { NavTab } from './Sidebar';

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
  unreadCount = 3,
}) => {
  const getTitles = () => {
    switch (activeTab) {
      case 'clients':
        return { title: 'Clientes', subtitle: 'Directorio B2B y estado de cuentas · Agosto 2026' };
      case 'products':
        return { title: 'Productos', subtitle: 'Inventario de hardware corporativo y disponibilidad' };
      case 'sales':
        return { title: 'Ventas', subtitle: 'Historial de transacciones comerciales y contratos' };
      case 'predictions':
        return { title: 'Carga y Predicción', subtitle: 'Modelos de Machine Learning e Inteligencia Explicable (XAI)' };
      case 'dashboard':
      default:
        return { title: 'Dashboard', subtitle: 'Resumen comercial · Agosto 2026' };
    }
  };

  const { title, subtitle } = getTitles();

  return (
    <header className="top-header">
      <div className="header-titles">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      <div className="header-actions">
        <div className="search-bar-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar cliente, producto, predicción o venta..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <button
          className="icon-button"
          onClick={onOpenNotifications}
          title="Notificaciones"
          aria-label="Ver notificaciones"
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="notification-dot" />}
        </button>
      </div>
    </header>
  );
};
