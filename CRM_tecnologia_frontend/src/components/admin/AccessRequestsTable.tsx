import { useCallback, useEffect, useState } from 'react';
import { listarSolicitudes, reenviarRespuesta, resolverSolicitud } from '../../services/solicitudesApi';
import type { SolicitudAcceso } from '../../services/solicitudesApi';
import '../auth/AccessRequest.css';

export function AccessRequestsTable({ onApproved }: { onApproved: () => Promise<void> }) {
  const [rows, setRows] = useState<SolicitudAcceso[]>([]);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [roles, setRoles] = useState<Record<string, 'administrador' | 'colaborador'>>({});
  const reload = useCallback(async () => {
    try { setRows(await listarSolicitudes()); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar las solicitudes.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); const timer = setInterval(() => { void reload(); }, 15000); return () => clearInterval(timer); }, [reload]);

  const decide = async (row: SolicitudAcceso, action: 'aprobar' | 'rechazar' | 'reenviar') => {
    if (busy) return;
    const description = action === 'aprobar' ? 'Aprobar y generar una invitación para' : action === 'rechazar' ? 'Rechazar la solicitud y enviar el correo de denegación a' : 'Reintentar el correo para';
    if (!window.confirm(`${description} ${row.email}?`)) return;
    setBusy(row.id); setError(''); setFeedback('');
    try {
      const result = action === 'reenviar' ? await reenviarRespuesta(row.id) : await resolverSolicitud(row.id, action, roles[row.id] || 'colaborador');
      setRows(current => current.map(item => item.id === result.id ? result : item));
      setFeedback(`${result.estado === 'aprobada' ? 'Solicitud aprobada; la invitación está en Enlaces de invitación.' : 'Solicitud rechazada.'} ${result.correo_enviado ? 'Correo aceptado por el proveedor.' : 'No se pudo enviar el correo. Puedes reintentarlo.'}`);
      if (result.estado === 'aprobada') await onApproved();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo procesar la solicitud.'); }
    finally { setBusy(null); }
  };

  const ordered = [...rows].sort((a, b) => Number(b.estado === 'pendiente') - Number(a.estado === 'pendiente') || Date.parse(b.created_at) - Date.parse(a.created_at));
  return <section className="inv-section-card" aria-labelledby="access-requests-title" style={{ marginBottom: 20 }}>
    <div className="inv-section-card-header">
      <h2 id="access-requests-title">Solicitudes de acceso ({rows.filter(row => row.estado === 'pendiente').length} pendientes)</h2>
      <p>Aprueba para generar una invitación o rechaza para comunicar la denegación por correo.</p>
      <button type="button" className="inv-btn-secondary" onClick={() => void reload()} disabled={!!busy}>Actualizar solicitudes</button>
    </div>
    {error && <p role="alert">{error}</p>}
    {feedback && <p role="status">{feedback}</p>}
    {loading ? <p>Cargando solicitudes...</p> : rows.length === 0 ? <p>No hay solicitudes de acceso.</p> : <div className="inv-table-wrapper">
      <table className="access-requests-table">
        <thead><tr><th>Solicitante</th><th>Empresa y motivo</th><th>Fecha</th><th>Estado y correo</th><th>Acciones</th></tr></thead>
        <tbody>{ordered.map(row => <tr key={row.id}>
          <td><strong>{row.nombre}</strong><small>{row.email}</small></td>
          <td>{row.empresa || 'Sin empresa'}<small>{row.motivo}</small></td>
          <td>{new Date(row.created_at).toLocaleString('es-PE')}</td>
          <td>{row.estado === 'pendiente' ? 'Pendiente' : row.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
            {row.estado !== 'pendiente' && <small>{row.correo_enviado ? 'Correo aceptado' : 'Correo pendiente de envío'}</small>}
          </td>
          <td><div className="access-request-actions">{row.estado === 'pendiente' ? <>
            <select aria-label={`Rol para ${row.email}`} disabled={!!busy} value={roles[row.id] || 'colaborador'} onChange={event => setRoles(current => ({ ...current, [row.id]: event.target.value as 'administrador' | 'colaborador' }))}>
              <option value="colaborador">Colaborador</option><option value="administrador">Administrador</option>
            </select>
            <button type="button" className="inv-btn-primary" disabled={!!busy} onClick={() => void decide(row, 'aprobar')}>Aprobar</button>
            <button type="button" className="inv-btn-secondary" disabled={!!busy} onClick={() => void decide(row, 'rechazar')}>Rechazar</button>
          </> : !row.correo_enviado ? <button type="button" className="inv-btn-secondary" disabled={!!busy} onClick={() => void decide(row, 'reenviar')}>Reintentar correo</button> : <span>Resuelta</span>}
          {busy === row.id && <span role="status">Procesando...</span>}</div></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
