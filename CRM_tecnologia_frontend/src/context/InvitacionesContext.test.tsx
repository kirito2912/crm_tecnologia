import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { InvitacionesProvider, useInvitaciones } from './InvitacionesContext';
const state = vi.hoisted(() => ({ role: 'colaborador', dashboard: vi.fn() }));
vi.mock('./AuthContext', () => ({ useAuth: () => ({ user: { id: 'user', role: state.role, habilitado: true, estado: 'activo' } }) }));
vi.mock('../services/invitacionesApi', () => ({
  getInvitacionesDashboard: state.dashboard,
  crearInvitacion: vi.fn(), toggleUserStatus: vi.fn(), revocarInvitacion: vi.fn(),
  validarTokenInvitacion: vi.fn(), completarRegistroInvitado: vi.fn(),
}));
function Consumer() {
  const { invitaciones } = useInvitaciones();
  return <div>{invitaciones.map(inv => <span key={inv.id}>{inv.email}</span>)}</div>;
}
beforeEach(() => { state.role = 'colaborador'; state.dashboard.mockReset(); });
it.each(['colaborador', 'analista', 'programador', 'auditor'])('does not load invitation data for %s', async (role) => {
  state.role = role;
  render(<InvitacionesProvider><Consumer /></InvitacionesProvider>);
  await act(async () => {});
  expect(state.dashboard).not.toHaveBeenCalled();
});
it('loads invitations for administrators', async () => {
  state.role = 'administrador';
  state.dashboard.mockResolvedValue({ invitaciones: [{ id: '1', email: 'invited@example.com' }] });
  render(<InvitacionesProvider><Consumer /></InvitacionesProvider>);
  expect(await screen.findByText('invited@example.com')).toBeInTheDocument();
});
it('discards an administrator response that arrives after changing to collaborator', async () => {
  state.role = 'administrador';
  let resolve!: (data: unknown) => void;
  state.dashboard.mockReturnValue(new Promise(done => { resolve = done; }));
  const { rerender } = render(<InvitacionesProvider><Consumer /></InvitacionesProvider>);
  await waitFor(() => expect(state.dashboard).toHaveBeenCalledOnce());
  state.role = 'colaborador';
  rerender(<InvitacionesProvider><Consumer /></InvitacionesProvider>);
  await act(async () => resolve({ invitaciones: [{ id: '1', email: 'private@example.com' }] }));
  expect(screen.queryByText('private@example.com')).not.toBeInTheDocument();
});
