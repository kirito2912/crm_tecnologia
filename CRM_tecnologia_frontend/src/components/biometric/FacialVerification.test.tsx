import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FacialVerification } from './FacialVerification';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function setupCamera() {
  const stop = vi.fn();
  const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
  });
  const view = render(<FacialVerification onVerified={vi.fn()} onCancel={vi.fn()}
    projectName="Proyecto" userEmail="test@example.com" />);
  return { ...view, stream, stop };
}

it('conecta y reproduce el video al activar la cámara por primera vez', async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  const { container, stream, stop, unmount } = setupCamera();
  fireEvent.click(screen.getByRole('button', { name: /Activar Cámara/ }));
  await waitFor(() => expect(play).toHaveBeenCalledOnce());
  const video = container.querySelector('video')!;
  expect(video.srcObject).toBe(stream);
  await waitFor(() => expect(video.hidden).toBe(false));
  unmount();
  expect(stop).toHaveBeenCalledOnce();
});

it('libera la cámara y permite reintentar si falla la reproducción', async () => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('Playback failed'));
  const { container, stop } = setupCamera();
  fireEvent.click(screen.getByRole('button', { name: /Activar Cámara/ }));
  await screen.findByText(/No se pudo mostrar la cámara/);
  expect(stop).toHaveBeenCalledOnce();
  expect(container.querySelector('video')!.srcObject).toBeNull();
  expect(screen.getByRole('button', { name: /Activar Cámara/ })).toBeTruthy();
});
