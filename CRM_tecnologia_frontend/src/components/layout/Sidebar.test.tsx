/**
 * Property-based tests for Sidebar tab rendering by role.
 *
 * Feature: project-selector-and-auth-improvements, Property 7: Sidebar tabs by role
 * Validates: Requirements 3.1, 3.2
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { Sidebar } from './Sidebar';

// Mock context hooks so Sidebar renders without real providers
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../context/InvitacionesContext', () => ({
  useInvitaciones: vi.fn(),
}));

import { useAuth } from '../../context/AuthContext';
import { useInvitaciones } from '../../context/InvitacionesContext';

const mockInvitaciones = {
  kpis: { totalUsuarios: 0, usuariosHabilitados: 0, usuariosPendientes: 0, invitacionesActivas: 0 },
};

const ADMIN_TAB_IDS = ['reports', 'invitaciones', 'dataset', 'documentos', 'comparativa'];
const ANALISTA_TAB_IDS = ['reports', 'dataset', 'documentos', 'comparativa'];

function buildUser(role: string) {
  return {
    id: 'USR-001',
    name: 'Test User',
    email: 'test@example.com',
    role,
    company: 'DataTech',
    avatar: 'TU',
    biometricVerified: true,
    registeredAt: new Date().toISOString(),
    habilitado: true,
    estado: 'activo',
  };
}

function renderSidebar(role: string) {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: buildUser(role),
    logout: vi.fn(),
  });
  (useInvitaciones as ReturnType<typeof vi.fn>).mockReturnValue(mockInvitaciones);

  const { unmount } = render(
    <Sidebar activeTab="reports" onSelectTab={() => {}} />
  );
  return unmount;
}

describe('Property 7: Sidebar tabs by role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('administrador role always renders exactly 5 tabs', () => {
    /**
     * Feature: project-selector-and-auth-improvements, Property 7: Sidebar tabs by role
     * Validates: Requirements 3.1, 3.2
     *
     * For any user with role `administrador`, the Sidebar renders exactly 5 tabs.
     */
    const adminRoles = fc.constantFrom('administrador', 'admin', 'Administrador', 'ADMINISTRADOR');

    fc.assert(
      fc.property(adminRoles, (role) => {
        const unmount = renderSidebar(role);
        try {
          const buttons = screen.getAllByRole('button').filter(
            (btn) => !btn.matches('[aria-label="Cerrar sesión"]')
          );
          expect(buttons).toHaveLength(ADMIN_TAB_IDS.length);

          // Verify each expected tab label is present
          for (const tabId of ADMIN_TAB_IDS) {
            const labelMap: Record<string, string> = {
              reports: 'Reportes de Comparativas',
              invitaciones: 'Gestión de Invitaciones',
              dataset: 'Datasets de Empresas',
              documentos: 'Documentos Word y PDF',
              comparativa: 'Módulo Comparativa',
            };
            expect(screen.getByText(labelMap[tabId])).toBeInTheDocument();
          }
        } finally {
          unmount();
        }
      }),
      { numRuns: 20 }
    );
  });

  it('analista role always renders exactly 4 tabs', () => {
    /**
     * Feature: project-selector-and-auth-improvements, Property 7: Sidebar tabs by role
     * Validates: Requirements 3.1, 3.2
     *
     * For any user with role `analista`, the Sidebar renders exactly 4 tabs.
     */
    const analistaRoles = fc.constantFrom('analista', 'Analista', 'ANALISTA');

    fc.assert(
      fc.property(analistaRoles, (role) => {
        const unmount = renderSidebar(role);
        try {
          const buttons = screen.getAllByRole('button').filter(
            (btn) => !btn.matches('[aria-label="Cerrar sesión"]')
          );
          expect(buttons).toHaveLength(ANALISTA_TAB_IDS.length);

          const labelMap: Record<string, string> = {
            reports: 'Reportes de Comparativas',
            dataset: 'Datasets de Empresas',
            documentos: 'Documentos Word y PDF',
            comparativa: 'Módulo Comparativa',
          };
          for (const tabId of ANALISTA_TAB_IDS) {
            expect(screen.getByText(labelMap[tabId])).toBeInTheDocument();
          }

          // Invitaciones must NOT appear for analista
          expect(screen.queryByText('Gestión de Invitaciones')).not.toBeInTheDocument();
        } finally {
          unmount();
        }
      }),
      { numRuns: 20 }
    );
  });
});
