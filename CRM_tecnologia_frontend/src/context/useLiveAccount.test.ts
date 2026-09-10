import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useLiveAccount } from './useLiveAccount';
import { actualizarPermisosUsuario, toggleUserStatus } from '../services/invitacionesApi';
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
it('refreshes permissions and disabled state in an open session', async () => {
  vi.useFakeTimers();
  const fetchMock = vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'user1', permisos_proyectos: ['project1'], habilitado: true })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'user1', permisos_proyectos: [], habilitado: false })));
  const update = vi.fn();
  const { unmount } = renderHook(() => useLiveAccount('user1', update));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
  expect(update).toHaveBeenLastCalledWith({ id: 'user1', permisos_proyectos: [], habilitado: false });
  unmount();
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it('clears a session when the account has been deleted', async () => {
  vi.useFakeTimers();
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 404 }));
  const update = vi.fn();
  const { unmount } = renderHook(() => useLiveAccount('deleted', update));
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(update).toHaveBeenCalledWith(null);
  unmount();
});
it('does not claim permissions were saved when the API rejects them', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ detail: 'No autorizado' }), { status: 403 }));
  const dispatch = vi.spyOn(window, 'dispatchEvent');
  await expect(actualizarPermisosUsuario('user1', [])).rejects.toThrow('No autorizado');
  expect(dispatch).not.toHaveBeenCalled();
});
it('does not claim an account was disabled when the network fails', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(toggleUserStatus('user1', false)).rejects.toThrow('Failed to fetch');
});
