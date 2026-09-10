import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InvitacionesView } from './InvitacionesView';
const { cancelarInvitacion } = vi.hoisted(() => ({ cancelarInvitacion: vi.fn() }));
vi.mock('../../context/InvitacionesContext', () => ({
  useInvitaciones: () => ({
    usuarios: [], solicitudesPendientes: [], kpis: {}, isLoading: false,
    refreshDashboard: vi.fn(), generarInvitacion: vi.fn(), alternarEstadoUsuario: vi.fn(),
    cancelarInvitacion,
    invitaciones: [
      { id: 'old', email: 'old@example.com', estado: 'registrado', created_at: '2026-01-01', rol_asignado: 'colaborador', token: 'old' },
      { id: 'hidden', email: 'hidden@example.com', estado: 'cancelado', created_at: '2026-03-01', rol_asignado: 'colaborador', token: 'hidden' },
      { id: 'new', email: 'new@example.com', estado: 'pendiente', created_at: '2026-02-01', rol_asignado: 'colaborador', token: 'new' },
    ],
  }),
}));
describe('Invitation links', () => {
  beforeEach(() => { vi.restoreAllMocks(); cancelarInvitacion.mockReset(); });
  it('shows newest first, excludes revoked links and allows removing used links', () => {
    render(<InvitacionesView />);
    const buttons = screen.getAllByRole('button', { name: /Eliminar enlace para/ });
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Eliminar enlace para new@example.com', 'Eliminar enlace para old@example.com',
    ]);
    expect(screen.queryByText('hidden@example.com')).not.toBeInTheDocument();
  });
  it('does not delete when confirmation is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<InvitacionesView />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar enlace para old@example.com' }));
    expect(cancelarInvitacion).not.toHaveBeenCalled();
  });
  it('reports failure and allows retry', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    cancelarInvitacion.mockResolvedValue(false);
    render(<InvitacionesView />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar enlace para old@example.com' }));
    await waitFor(() => expect(screen.getByText('No se pudo eliminar el enlace. Inténtalo de nuevo.')).toBeInTheDocument());
    expect(cancelarInvitacion).toHaveBeenCalledWith('old');
    expect(screen.getByRole('button', { name: 'Eliminar enlace para old@example.com' })).toBeEnabled();
  });
});
