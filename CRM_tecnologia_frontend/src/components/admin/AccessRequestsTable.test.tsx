import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AccessRequestsTable } from './AccessRequestsTable';
import { listarSolicitudes, resolverSolicitud, reenviarRespuesta } from '../../services/solicitudesApi';
import type { SolicitudAcceso } from '../../services/solicitudesApi';
vi.mock('../../services/solicitudesApi', () => ({ listarSolicitudes: vi.fn(), resolverSolicitud: vi.fn(), reenviarRespuesta: vi.fn() }));
const row: SolicitudAcceso = { id: '1', nombre: 'Solicitante', email: 'test@example.com', empresa: 'Empresa', motivo: 'Necesito acceso', estado: 'pendiente', created_at: '2026-01-01T12:00:00Z', resuelta_at: null, resuelta_por: null, invitacion_id: null, correo_enviado: null };
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  vi.mocked(listarSolicitudes).mockResolvedValue([row]);
});
it('approves with the selected role and refreshes invitations', async () => {
  const onApproved = vi.fn().mockResolvedValue(undefined);
  vi.mocked(resolverSolicitud).mockResolvedValue({ ...row, estado: 'aprobada', invitacion_id: 'inv1', correo_enviado: true });
  render(<AccessRequestsTable onApproved={onApproved} />);
  fireEvent.change(await screen.findByLabelText('Rol para test@example.com'), { target: { value: 'administrador' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
  await waitFor(() => expect(onApproved).toHaveBeenCalledOnce());
  expect(resolverSolicitud).toHaveBeenCalledWith('1', 'aprobar', 'administrador');
  expect(screen.getByRole('status')).toHaveTextContent('Enlaces de invitación');
});
it('shows the rejected decision and lets the administrator retry failed mail', async () => {
  vi.mocked(resolverSolicitud).mockResolvedValue({ ...row, estado: 'rechazada', correo_enviado: false });
  vi.mocked(reenviarRespuesta).mockResolvedValue({ ...row, estado: 'rechazada', correo_enviado: true });
  const onApproved = vi.fn();
  render(<AccessRequestsTable onApproved={onApproved} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Rechazar' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Reintentar correo' }));
  expect(await screen.findByText('Correo aceptado')).toBeInTheDocument();
  expect(reenviarRespuesta).toHaveBeenCalledWith('1');
  expect(onApproved).not.toHaveBeenCalled();
});
it('does not resolve when confirmation is cancelled', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<AccessRequestsTable onApproved={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Aprobar' }));
  expect(resolverSolicitud).not.toHaveBeenCalled();
});
