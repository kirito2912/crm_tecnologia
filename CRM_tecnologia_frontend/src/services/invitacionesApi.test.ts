import { afterEach, expect, it, vi } from 'vitest';
import { crearInvitacion } from './invitacionesApi';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); localStorage.clear(); });

it('does not fabricate invitations when production cannot reach the API', async () => {
  vi.stubEnv('PROD', true);
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
  await expect(crearInvitacion({ email: 'test@example.com' })).rejects.toThrow('No se creó la invitación');
  expect(localStorage.getItem('hardcrm_invitaciones_list_v2')).toBeNull();
});

it('preserves the server email delivery result', async () => {
  vi.stubEnv('PROD', true);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'server-id', email_enviado: false }) }));
  await expect(crearInvitacion({ email: 'test@example.com' })).resolves.toEqual({ id: 'server-id', email_enviado: false });
});
