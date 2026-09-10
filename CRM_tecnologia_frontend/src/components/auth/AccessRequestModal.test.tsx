import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AccessRequestModal } from './AccessRequestModal';
import { solicitarAcceso } from '../../services/solicitudesApi';
vi.mock('../../services/solicitudesApi', () => ({ solicitarAcceso: vi.fn() }));
beforeEach(() => {
  vi.mocked(solicitarAcceso).mockReset();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
function fill() {
  fireEvent.change(screen.getByLabelText('Nombre completo *'), { target: { value: ' Test User ' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico *'), { target: { value: 'TEST@example.com' } });
  fireEvent.change(screen.getByLabelText('Motivo de la solicitud *'), { target: { value: 'Necesito reportes' } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
}
it('submits the request without creating credentials', async () => {
  vi.mocked(solicitarAcceso).mockResolvedValue({ message: 'Solicitud enviada al administrador.' });
  render(<AccessRequestModal onClose={vi.fn()} />);
  fill();
  expect(await screen.findByRole('status')).toHaveTextContent('Solicitud enviada');
  expect(solicitarAcceso).toHaveBeenCalledWith({ nombre: 'Test User', email: 'test@example.com', empresa: '', motivo: 'Necesito reportes' });
});
it('keeps the form available if the server rejects the request', async () => {
  vi.mocked(solicitarAcceso).mockRejectedValue(new Error('Ya enviaste una solicitud.'));
  render(<AccessRequestModal onClose={vi.fn()} />);
  fill();
  expect(await screen.findByRole('alert')).toHaveTextContent('Ya enviaste una solicitud.');
  expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeEnabled();
  expect(screen.getByLabelText('Correo electrónico *')).toHaveValue('TEST@example.com');
});
