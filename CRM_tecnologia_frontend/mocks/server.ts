import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Base path matches the API_BASE_URL from invitacionesApi.ts
const API_BASE = '/api/v1/invitaciones'

export const handlers = [
  rest.get(`${API_BASE}/dashboard`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        total_usuarios: 2,
        usuarios_habilitados: 2,
        usuarios_pendientes: 0,
        invitaciones_activas: 2,
        usuarios: [],
        invitaciones: [],
        solicitudes_pendientes: [],
      })
    )
  }),

  rest.get(`${API_BASE}/`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([]))
  }),

  rest.patch(`${API_BASE}/usuarios/:userId/permisos`, (req, res, ctx) => {
    // return 200 OK for permissions update
    return res(ctx.status(200))
  }),

  rest.patch(`${API_BASE}/usuarios/:userId/toggle-status`, async (req, res, ctx) => {
    // echo back a sample user
    const { userId } = req.params as any
    return res(
      ctx.status(200),
      ctx.json({ id: userId, habilitado: true, estado: 'activo' })
    )
  }),

  rest.delete(`${API_BASE}/:id`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Invitación eliminada (mock)' }))
  }),

  rest.get(`${API_BASE}/validar/:token`, (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ valido: true, email: 'mock@empresa.com', rol_asignado: 'analista' }))
  }),

  rest.post(`${API_BASE}/completar-registro`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, message: 'Registro mock', user: { id: 'USR-MOCK', nombre: 'Mock User' }, requiere_aprobacion: true })
    )
  }),
]

export const server = setupServer(...handlers)
