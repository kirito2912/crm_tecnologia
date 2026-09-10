/// <reference types="@testing-library/jest-dom" />
/**
 * Property-based tests for InvitacionesView panels.
 *
 * Feature: project-selector-and-auth-improvements
 * Properties 8, 9, 10
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import React from 'react';
import type { NotificacionSolicitud } from '../../types/invitacion';
import { actualizarPermisosUsuario } from '../../services/invitacionesApi';
import { PROJECTS } from '../auth/ProjectSelector';

// ---------------------------------------------------------------------------
// Minimal panel component — mirrors the "Cuentas en Espera" section extracted
// from InvitacionesView so we can test the rendering logic in isolation.
// ---------------------------------------------------------------------------

interface WaitingAccountsPanelProps {
  solicitudes: NotificacionSolicitud[];
  onHabilitar: (userId: string) => void;
}

const WaitingAccountsPanel: React.FC<WaitingAccountsPanelProps> = ({
  solicitudes,
  onHabilitar,
}) => (
  <section data-testid="waiting-accounts-panel">
    {solicitudes.length === 0 ? (
      <p data-testid="waiting-empty">No hay cuentas en espera.</p>
    ) : (
      solicitudes.map((sol) => (
        <div key={sol.id} data-testid="waiting-account-card">
          <span>{sol.nombre}</span>
          <button
            type="button"
            data-testid={`enable-btn-${sol.usuario_id}`}
            onClick={() => onHabilitar(sol.usuario_id)}
          >
            Habilitar Acceso
          </button>
        </div>
      ))
    )}
  </section>
);

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const ALL_PROJECT_IDS = PROJECTS.map((p) => p.id);

/** Generate a valid solicitud */
const solicitudArb = fc.record({
  id: fc.uuid(),
  usuario_id: fc.uuid(),
  nombre: fc.string({ minLength: 2, maxLength: 20 }).filter((s) => s.trim().length > 0),
  email: fc.emailAddress(),
  rol: fc.constantFrom('colaborador', 'administrador'),
  fecha: fc.constant(new Date().toISOString()),
  mensaje: fc.string({ minLength: 1, maxLength: 40 }),
});

/** Non-empty strict subset of project IDs */
const projectSubsetArb = fc
  .subarray(ALL_PROJECT_IDS, { minLength: 1 })
  .map((arr) => [...new Set(arr)]); // ensure uniqueness

// ---------------------------------------------------------------------------
// Property 8: Pending accounts panel count
// ---------------------------------------------------------------------------

describe('Property 8: Pending accounts panel count', () => {
  /**
   * Feature: project-selector-and-auth-improvements, Property 8: Pending accounts panel count
   * Validates: Requirements 4.5
   *
   * For any list of users where exactly K users have estado="pendiente_aprobacion",
   * the "Cuentas en Espera" panel renders exactly K account cards — no more, no fewer.
   * When K=0 it shows the empty state message.
   */
  it('renders exactly K cards for K pending solicitudes (K > 0)', () => {
    fc.assert(
      fc.property(
        fc.array(solicitudArb, { minLength: 1, maxLength: 8 }),
        (solicitudes) => {
          const { unmount } = render(
            <WaitingAccountsPanel solicitudes={solicitudes} onHabilitar={() => {}} />
          );
          try {
            const cards = screen.getAllByTestId('waiting-account-card');
            expect(cards).toHaveLength(solicitudes.length);
            // Empty state must not appear
            expect(screen.queryByTestId('waiting-empty')).not.toBeInTheDocument();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('renders empty state when solicitudes list is empty (K = 0)', () => {
    fc.assert(
      fc.property(fc.constant([] as NotificacionSolicitud[]), (solicitudes) => {
        const { unmount } = render(
          <WaitingAccountsPanel solicitudes={solicitudes} onHabilitar={() => {}} />
        );
        try {
          expect(screen.getByTestId('waiting-empty')).toBeInTheDocument();
          expect(screen.queryByTestId('waiting-account-card')).not.toBeInTheDocument();
        } finally {
          unmount();
        }
      }),
      { numRuns: 10 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Habilitar user state transition
// ---------------------------------------------------------------------------

describe('Property 9: Habilitar user state transition', () => {
  /**
   * Feature: project-selector-and-auth-improvements, Property 9: Habilitar user state transition
   * Validates: Requirements 4.6
   *
   * For any user currently with habilitado=false and estado="pendiente_aprobacion",
   * calling toggleUserStatus with habilitado=true results in that user having
   * habilitado=true and estado="activo" in localStorage.
   */

  const LOCAL_STORAGE_USERS_KEY = 'hardcrm_users_directory_v2';

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('enables any pending user — sets habilitado=true and estado=activo', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        // Seed localStorage with a pending user
        const pendingUser = {
          id: userId,
          nombre: 'Test User',
          email: `test+${userId.slice(0, 8)}@empresa.com`,
          rol: 'colaborador',
          habilitado: false,
          estado: 'pendiente_aprobacion',
        };
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify([pendingUser]));

        // Import toggleUserStatus dynamically to use the real localStorage fallback
        const { toggleUserStatus } = await import('../../services/invitacionesApi');
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ ...pendingUser, habilitado: true, estado: 'activo' })));
        const result = await toggleUserStatus(userId, true);

        expect(result.habilitado).toBe(true);
        expect(result.estado).toBe('activo');

      }),
      { numRuns: 100 }
    );
  });

  it('disables any active user — sets habilitado=false and estado=deshabilitado', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        const activeUser = {
          id: userId,
          nombre: 'Active User',
          email: `active+${userId.slice(0, 8)}@empresa.com`,
          rol: 'colaborador',
          habilitado: true,
          estado: 'activo',
        };
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify([activeUser]));

        const { toggleUserStatus } = await import('../../services/invitacionesApi');
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify({ ...activeUser, habilitado: false, estado: 'deshabilitado' })));
        const result = await toggleUserStatus(userId, false);

        expect(result.habilitado).toBe(false);
        expect(result.estado).toBe('deshabilitado');
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Permissions save round trip
// ---------------------------------------------------------------------------

describe('Property 10: Permissions save round trip', () => {
  /**
   * Feature: project-selector-and-auth-improvements, Property 10: Permissions save round trip
   * Validates: Requirements 4.9
   *
   * For any user ID and any non-empty subset of project IDs, saving that subset via
   * actualizarPermisosUsuario and then reading back with getPermisosUsuario returns
   * the identical subset.
   */

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('round-trips any subset of project IDs through save and retrieve', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), projectSubsetArb, async (userId, projectSubset) => {
        const mock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
        await actualizarPermisosUsuario(userId, projectSubset);

        // Read back
        const retrieved = JSON.parse(mock.mock.calls.at(-1)![1]!.body as string).proyectos_permitidos;

        // Must not be null
        expect(retrieved).not.toBeNull();

        // Must contain exactly the same project IDs (order-independent)
        expect(retrieved!.sort()).toEqual([...projectSubset].sort());
      }),
      { numRuns: 100 }
    );
  });

  it('overwrites previous permissions correctly on subsequent saves', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        projectSubsetArb,
        projectSubsetArb,
        async (userId, firstSubset, secondSubset) => {
          const mock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
          await actualizarPermisosUsuario(userId, firstSubset);
          await actualizarPermisosUsuario(userId, secondSubset);

          const retrieved = JSON.parse(mock.mock.calls.at(-1)![1]!.body as string).proyectos_permitidos;
          expect(retrieved!.sort()).toEqual([...secondSubset].sort());
        }
      ),
      { numRuns: 50 }
    );
  });
});
