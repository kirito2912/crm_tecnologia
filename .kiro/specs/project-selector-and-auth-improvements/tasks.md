# Implementation Plan

- [x] 1. Fix deployment compatibility — `invitacionesApi.ts` URL





  - Replace hardcoded `'http://localhost:8000/api/v1/invitaciones'` with `(import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1/invitaciones'`
  - Update `CRM_tecnologia_frontend/.env.example` to include `VITE_API_URL=https://your-render-backend.onrender.com`
  - _Requirements: 0.1, 0.2, 0.3, 0.4_

- [x] 2. Backend — Multi-recipient OTP email (`EMAIL_WHITELIST`)





- [x] 2.1 Add `_get_whitelist_emails()` utility and update `send_otp_email`


  - Add `_get_whitelist_emails()` function that reads `EMAIL_WHITELIST` env var, splits by comma, filters valid addresses
  - Update `send_otp_email` to iterate the whitelist and call `_send_message` per address, catching exceptions individually
  - Log the whitelist recipient count at startup in `app/main.py`
  - Update `CRM_tecnologia_backend/.env.example` to document `EMAIL_WHITELIST` with example value
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.2 Write property tests for OTP whitelist (Hypothesis)


  - **Property 1: OTP whitelist additive delivery**
  - **Validates: Requirements 1.1, 1.2**
  - **Property 2: Whitelist failure isolation**
  - **Validates: Requirements 1.3**

- [x] 3. Backend — `Usuario` model permissions column and endpoint





- [x] 3.1 Add `permisos_proyectos` column to `Usuario` model


  - Add `permisos_proyectos = Column(String(500), nullable=True, default=None)` to `app/models/usuario.py`
  - Add `permisos_proyectos: Optional[str] = None` to `UsuarioResponse` schema
  - _Requirements: 4.9_


- [x] 3.2 Add `PermisosRequest` schema and `PATCH /usuarios/{id}/permisos` endpoint

  - Add `PermisosRequest(BaseModel)` with `proyectos_permitidos: list[str]` to `app/schemas/invitacion.py`
  - Add `actualizar_permisos_usuario` endpoint to `app/api/v1/endpoints/invitaciones.py` that updates `permisos_proyectos` as JSON string
  - _Requirements: 4.8, 4.9_

- [x] 4. Frontend — Sidebar unification (add Datasets + Comparativa to admin)





  - In `Sidebar.tsx`, add `{ id: 'dataset', label: 'Datasets de Empresas', icon: Database }` and `{ id: 'comparativa', label: 'Módulo Comparativa', icon: GitCompare }` to the admin `menuItems` array
  - Remove the `useEffect` in `DashboardContent` that redirected admin away from `dataset` tab
  - Change admin default tab from `'reports'` to `'reports'` (no change needed, verify it works with new tabs)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4.1 Write property test for Sidebar tabs by role (fast-check + Vitest)


  - **Property 7: Sidebar tabs by role**
  - **Validates: Requirements 3.1, 3.2**

- [x] 5. Frontend — Project Selector Screen







- [x] 5.1 Create `ProjectSelector.tsx` component


  - Create `CRM_tecnologia_frontend/src/components/auth/ProjectSelector.tsx`
  - Define `PROJECTS` array with 3 entries: BIG DATA, TECNOLOGÍA CLOUD CON AWS, AI-900T00 CONCEPTOS BÁSICOS DE IA EN MICROSOFT AZURE
  - Render project cards centered on the page using CSS grid/flexbox
  - Accept `allowedProjects: string[] | null` prop — when non-null, filter cards to only show allowed projects
  - Show empty state message "No tienes proyectos asignados aún. Contacta al Administrador." when allowed list is empty
  - Call `onSelectProject(projectId)` callback on card click
  - _Requirements: 2.1, 2.2, 2.7_

- [x] 5.2 Wire `ProjectSelector` into `App.tsx` state flow


  - Add `selectedProject: string | null` state to `MainApp`
  - Add `allowedProjects: string[] | null` computed from `hardcrm_user_permissions_v2` localStorage for the current user
  - Modify render logic: `isAuthenticated && isEnabled && !selectedProject → <ProjectSelector />`, `selectedProject → <DashboardContent project={selectedProject} />`
  - Pass `selectedProject` to `DashboardContent` and display it in `Sidebar` brand subtitle or `Header`
  - On `logout`, reset `selectedProject` to null
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6_

- [x] 5.3 Write property tests for Project Selector (fast-check + Vitest)









  - **Property 3: Project selector gate**
  - **Validates: Requirements 2.1, 2.5**
  - **Property 4: Project card click transitions to dashboard**
  - **Validates: Requirements 2.3**
  - **Property 5: Logout resets project selection**
  - **Validates: Requirements 2.6**
  - **Property 6: Permissions filter shown projects**
  - **Validates: Requirements 2.7, 4.9, 4.10**

- [x] 6. Frontend — Enhanced `InvitacionesView`









- [x] 6.1 Replace pending requests notification with "Cuentas en Espera" panel


  - Remove the existing `inv-pending-requests-section` div that acts as a floating-style notification
  - Add a permanent `waiting-accounts-panel` section below the KPI cards, always visible
  - Show "No hay cuentas en espera" text when `solicitudesPendientes.length === 0`
  - Show user cards with name, email, role badge, and "Habilitar Acceso" button when count > 0
  - The "Habilitar Acceso" button calls `handleToggleStatus(sol.usuario_id, false, sol.nombre)` (same as existing logic)
  - _Requirements: 4.4, 4.5, 4.6_

- [x] 6.2 Add "Permisos" button and `PermisosModal` component


  - Add a "Permisos" button to each row in the user directory table in `InvitacionesView`
  - Create inline `PermisosModal` component (can be inside the same file) that:
    - Accepts `usuario`, `currentPermissions: string[]`, `onSave(projectIds: string[])`, `onClose` props
    - Renders 3 checkboxes for the available projects
    - Initializes checkboxes from `currentPermissions`
    - Calls `onSave` with the new array on confirm
  - Handle save: call `PATCH /api/v1/invitaciones/usuarios/{id}/permisos` with `{ proyectos_permitidos }`, fallback to `localStorage` key `hardcrm_user_permissions_v2`
  - _Requirements: 4.7, 4.8, 4.9_

- [x] 6.3 Write property tests for InvitacionesView panels (fast-check + Vitest)


  - **Property 8: Pending accounts panel count**
  - **Validates: Requirements 4.5**
  - **Property 9: Habilitar user state transition**
  - **Validates: Requirements 4.6**
  - **Property 10: Permissions save round trip**
  - **Validates: Requirements 4.9**

- [x] 7. Checkpoint — Ensure all tests pass, ask the user if questions arise.






- [x] 8. Verify invitation module end-to-end





  - Test that `crearInvitacion` returns `email_enviado` field and `InvitacionesView` shows the inline warning when `email_enviado === false`
  - Verify `AuthPage` correctly detects `invite_token` URL param and shows the registration form
  - Verify completing registration sets `habilitado = false` and `estado = "pendiente_aprobacion"` and shows `PendingApprovalScreen`
  - Verify the "Cuentas en Espera" panel in `InvitacionesView` reflects newly registered pending users
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 9. Final Checkpoint — Ensure all tests pass, ask the user if questions arise.





