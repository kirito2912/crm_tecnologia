import { useEffect, useRef, useState } from 'react';
import { solicitarAcceso } from '../../services/solicitudesApi';
import './AccessRequest.css';

export function AccessRequestModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return <dialog ref={dialog} className="access-request-dialog" aria-labelledby="access-request-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <h2 id="access-request-title">Solicitar permiso para ingresar al sistema</h2>
    {success ? <>
      <p role="status">{success}</p>
      <button type="button" className="inv-btn-primary" onClick={onClose}>Volver al inicio de sesión</button>
    </> : <form onSubmit={async event => {
      event.preventDefault();
      if (busy) return;
      const data = new FormData(event.currentTarget);
      setBusy(true); setError('');
      try {
        const result = await solicitarAcceso({ nombre: String(data.get('nombre')).trim(), email: String(data.get('email')).trim().toLowerCase(), empresa: String(data.get('empresa')).trim(), motivo: String(data.get('motivo')).trim() });
        setSuccess(result.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
      } finally { setBusy(false); }
    }}>
      <p>Registra tus datos para que el administrador evalúe tu acceso. Si aprueba tu solicitud, recibirás un enlace para crear tu cuenta.</p>
      {error && <p role="alert" className="auth-error-banner">{error}</p>}
      <label htmlFor="request-name">Nombre completo *</label>
      <input id="request-name" name="nombre" required minLength={2} maxLength={150} autoComplete="name" autoFocus disabled={busy} />
      <label htmlFor="request-email">Correo electrónico *</label>
      <input id="request-email" name="email" type="email" required maxLength={150} autoComplete="email" disabled={busy} />
      <label htmlFor="request-company">Empresa (opcional)</label>
      <input id="request-company" name="empresa" maxLength={150} autoComplete="organization" disabled={busy} />
      <label htmlFor="request-reason">Motivo de la solicitud *</label>
      <textarea id="request-reason" name="motivo" required minLength={5} maxLength={1000} rows={3} disabled={busy} />
      <div className="inv-modal-actions">
        <button type="button" className="inv-btn-secondary" disabled={busy} onClick={onClose}>Cancelar</button>
        <button type="submit" className="inv-btn-primary" disabled={busy}>{busy ? 'Enviando...' : 'Enviar solicitud'}</button>
      </div>
    </form>}
  </dialog>;
}
