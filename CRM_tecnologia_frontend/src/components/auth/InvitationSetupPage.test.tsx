import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { InvitationSetupPage } from './InvitationSetupPage';
import { completarRegistroInvitado, validarTokenInvitacion } from '../../services/invitacionesApi';
vi.mock('../../services/invitacionesApi', () => ({ completarRegistroInvitado: vi.fn(), validarTokenInvitacion: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ requestOtp: vi.fn().mockResolvedValue({ success: true }), completeOtpAuth: vi.fn() }) }));
vi.mock('./OtpVerificationStep', () => ({ OtpVerificationStep: ({ onSuccess }: { onSuccess: () => void }) => <button onClick={onSuccess}>Confirmar OTP simulado</button> }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(validarTokenInvitacion).mockResolvedValue({ valido: true, email: 'new@example.com', nombre_referencial: 'New User', rol_asignado: 'colaborador', mensaje: '' });
});
async function start() {
  render(<InvitationSetupPage inviteToken="test-token" onGotoLogin={vi.fn()} onRegistrationComplete={vi.fn()} />);
  await screen.findByLabelText(/Crear Contraseña/i);
  fireEvent.change(document.getElementById('inv-setup-pwd')!, { target: { value: 'secret123' } });
  fireEvent.change(document.getElementById('inv-setup-pwd-2')!, { target: { value: 'secret123' } });
  fireEvent.submit(document.querySelector('form')!);
  fireEvent.click(await screen.findByText('Confirmar OTP simulado'));
}
it('persists the account after OTP before showing Continue', async () => {
  let finish!: (value: any) => void;
  vi.mocked(completarRegistroInvitado).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  await start();
  await waitFor(() => expect(completarRegistroInvitado).toHaveBeenCalledOnce());
  expect(screen.queryByText('Continuar')).toBeNull();
  finish({ success: true, user: { id: 'saved-id' }, message: '', requiere_aprobacion: true });
  await screen.findByText('Continuar');
  expect(completarRegistroInvitado).toHaveBeenCalledWith({ token: 'test-token', full_name: 'New User', password: 'secret123' });
});
it('shows a server error instead of claiming registration succeeded', async () => {
  vi.mocked(completarRegistroInvitado).mockRejectedValue(new Error('No se pudo guardar'));
  await start();
  await screen.findByText('No se pudo guardar');
  expect(screen.queryByText('Continuar')).toBeNull();
});
