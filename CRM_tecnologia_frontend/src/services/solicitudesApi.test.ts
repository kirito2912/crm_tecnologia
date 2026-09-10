import { afterEach, expect, it, vi } from 'vitest';
import { listarSolicitudes } from './solicitudesApi';
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
it('sends the current bearer token', async () => {
  localStorage.setItem('hardcrm_access_token', 'current-token');
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]'));
  await listarSolicitudes();
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer current-token');
});
it('invalidates a rejected session and asks for a new login', async () => {
  localStorage.setItem('hardcrm_access_token', 'expired-token');
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
  const event = vi.spyOn(window, 'dispatchEvent');
  await expect(listarSolicitudes()).rejects.toMatchObject({ status: 401 });
  expect(localStorage.getItem('hardcrm_access_token')).toBeNull();
  expect(event).toHaveBeenCalledWith(expect.objectContaining({ type: 'hardcrm:session-expired' }));
});
it('does not send anonymous requests when the token is missing', async () => {
  localStorage.removeItem('hardcrm_access_token');
  const fetchMock = vi.spyOn(globalThis, 'fetch');
  await expect(listarSolicitudes()).rejects.toMatchObject({ status: 401 });
  expect(fetchMock).not.toHaveBeenCalled();
});
