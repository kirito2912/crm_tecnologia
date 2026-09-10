import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InvitacionesView } from './InvitacionesView';
const mock = vi.hoisted(() => ({ remove: vi.fn(), refresh: vi.fn() }));
vi.mock('./AccessRequestsTable', () => ({ AccessRequestsTable: () => null }));
vi.mock('../../services/invitacionesApi', () => ({ eliminarColaborador: mock.remove, actualizarPermisosUsuario: vi.fn(), getPermisosUsuario: vi.fn() }));
vi.mock('../../context/InvitacionesContext', () => ({ useInvitaciones: () => ({
  usuarios: [
    { id: 'disabled', nombre: 'Deshabilitado', email: 'disabled@example.com', rol: 'colaborador', habilitado: false, estado: 'deshabilitado' },
    { id: 'active', nombre: 'Activo', email: 'active@example.com', rol: 'colaborador', habilitado: true, estado: 'activo' },
    { id: 'pending', nombre: 'Pendiente', email: 'pending@example.com', rol: 'colaborador', habilitado: false, estado: 'pendiente_aprobacion' },
    { id: 'admin', nombre: 'Admin', email: 'admin@example.com', rol: 'administrador', habilitado: false, estado: 'deshabilitado' },
  ], invitaciones: [], solicitudesPendientes: [], kpis: {}, isLoading: false,
  refreshDashboard: mock.refresh, generarInvitacion: vi.fn(), alternarEstadoUsuario: vi.fn(), cancelarInvitacion: vi.fn(),
}) }));
beforeEach(() => { vi.clearAllMocks(); vi.spyOn(window, 'confirm').mockReturnValue(true); mock.refresh.mockResolvedValue(undefined); });
it('only offers deletion for a disabled collaborator', () => {
  render(<InvitacionesView />);
  const buttons = screen.getAllByRole('button', { name: /Eliminar colaborador/ });
  expect(buttons).toHaveLength(1);
  expect(buttons[0]).toHaveAccessibleName('Eliminar colaborador Deshabilitado');
});
it('requires confirmation before permanent deletion', () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<InvitacionesView />);
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar colaborador Deshabilitado' }));
  expect(mock.remove).not.toHaveBeenCalled();
});
it('refreshes the directory after a successful deletion', async () => {
  mock.remove.mockResolvedValue(undefined);
  render(<InvitacionesView />);
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar colaborador Deshabilitado' }));
  await waitFor(() => expect(mock.refresh).toHaveBeenCalledOnce());
  expect(mock.remove).toHaveBeenCalledWith('disabled');
  expect(await screen.findByText('Colaborador eliminado correctamente.')).toBeInTheDocument();
});
it('keeps the account visible if deletion fails', async () => {
  mock.remove.mockRejectedValue(new Error('La cuenta fue habilitada de nuevo.'));
  render(<InvitacionesView />);
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar colaborador Deshabilitado' }));
  expect(await screen.findByText('La cuenta fue habilitada de nuevo.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Eliminar colaborador Deshabilitado' })).toBeEnabled();
  expect(mock.refresh).not.toHaveBeenCalled();
});
