# Design Document — Project Selector & Auth Improvements

## Overview

This design covers four improvements to the DataTech Analytics CRM platform that must be deployed to Vercel (frontend) and Render (backend) without breaking existing functionality:

0. **Deployment fix**: Eliminate hardcoded `localhost` in `invitacionesApi.ts`.
1. **Multi-recipient OTP**: Backend sends OTP to additional emails via `EMAIL_WHITELIST`.
2. **Project selector screen**: Post-login screen where users pick a project.
3. **Unified sidebar modules**: Both roles share Datasets and Comparativa tabs.
4. **Enhanced invitation module**: Permissions per user, "Cuentas en Espera" panel, approval exclusively from InvitacionesView.

---

## Architecture

```
Frontend (Vercel / React + Vite)
├── AuthPage          → Login / Invite register flow
├── ProjectSelector   ← NEW: shown after login, before Dashboard
├── DashboardContent  → Sidebar + content tabs
│   └── Sidebar       ← MODIFIED: admin gets Datasets + Comparativa tabs
│
└── InvitacionesView  ← MODIFIED: Cuentas en Espera panel + Permisos modal

Backend (Render / FastAPI + SQLite or Supabase)
└── email_service.py  ← MODIFIED: EMAIL_WHITELIST support
└── usuario model     ← MODIFIED: permisos_proyectos JSON column
└── invitaciones API  ← MODIFIED: patch permissions endpoint
```

All frontend services use `import.meta.env.VITE_API_URL` with a localhost fallback. This is the only change needed for Vercel + Render compatibility in `invitacionesApi.ts`.

---

## Components and Interfaces

### 0. Deployment fix — `invitacionesApi.ts`

Replace the hardcoded constant:
```ts
// Before (breaks in Vercel)
const API_BASE_URL = 'http://localhost:8000/api/v1/invitaciones';

// After (works everywhere)
const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${BACKEND_BASE_URL}/api/v1/invitaciones`;
```

### 1. Multi-recipient OTP — Backend `email_service.py`

`send_otp_email` reads `EMAIL_WHITELIST` after sending to the primary recipient. Each extra address is sent independently and failures are caught per-address.

```python
def _get_whitelist_emails() -> list[str]:
    raw = os.getenv("EMAIL_WHITELIST", "").strip()
    if not raw:
        return []
    return [e.strip() for e in raw.split(",") if e.strip() and "@" in e]
```

The function iterates the list and calls `_send_message` for each address, catching exceptions independently.

### 2. Project Selector Screen — New React component

New file: `CRM_tecnologia_frontend/src/components/auth/ProjectSelector.tsx`

```
ProjectSelector
├── Three ProjectCard components (centered grid)
├── Each card shows: project name, icon, description
└── On click: calls onSelectProject(projectName)
```

**State flow in `App.tsx`:**
```
isAuthenticated && isEnabled
  ↓
selectedProject === null  →  <ProjectSelector />
  ↓
selectedProject !== null  →  <DashboardContent project={selectedProject} />
```

The `selectedProject` state lives in `MainApp` (not persisted to localStorage — clears on logout).

**Project definitions:**
```ts
const PROJECTS = [
  { id: 'bigdata', name: 'BIG DATA', icon: Database, description: 'Análisis masivo de datos...' },
  { id: 'cloud-aws', name: 'TECNOLOGÍA CLOUD CON AWS', icon: Cloud, description: 'Infraestructura y servicios...' },
  { id: 'azure-ai', name: 'AI-900T00 CONCEPTOS BÁSICOS DE IA EN MICROSOFT AZURE', icon: Brain, description: 'Fundamentos de IA...' },
]
```

**User permissions**: Each user has an array `proyectos_permitidos` (stored in `UsuarioPermissions` localStorage key and synced with backend). The `ProjectSelector` filters `PROJECTS` by this array. If empty/undefined, all three are shown (backward compatible).

### 3. Unified Sidebar — `Sidebar.tsx`

The admin `menuItems` array gains two tabs: `dataset` and `comparativa`.

```ts
// Admin menu (after change)
const menuItems = isAdmin ? [
  { id: 'reports', label: 'Reportes de Comparativas', icon: FileText },
  { id: 'invitaciones', label: 'Gestión de Invitaciones', icon: UserPlus, badge: ... },
  { id: 'dataset', label: 'Datasets de Empresas', icon: Database },
  { id: 'documentos', label: 'Documentos Word y PDF', icon: Files },
  { id: 'comparativa', label: 'Módulo Comparativa', icon: GitCompare },
] : [/* analista: unchanged */]
```

The default tab for admin changes from `'reports'` to `'reports'` (no change needed). The `useEffect` that redirected admin away from `dataset` is removed.

In `DashboardContent`, the `dataset` and `comparativa` tab panels already exist and have no role guard — they render for anyone who selects them.

### 4. Enhanced InvitacionesView

#### 4a. "Cuentas en Espera" panel

Replace the existing floating-toast-driven pending requests section with a permanent panel section that always renders (hidden when empty):

```tsx
<section className="waiting-accounts-panel">
  <h2>Cuentas en Espera ({solicitudesPendientes.length})</h2>
  {solicitudesPendientes.map(sol => (
    <WaitingAccountCard
      key={sol.id}
      solicitud={sol}
      onHabilitar={() => handleToggleStatus(sol.usuario_id, false, sol.nombre)}
    />
  ))}
</section>
```

This section is always visible in the UI (shows "No hay cuentas en espera" when empty).

#### 4b. Permissions button and modal

Each row in the user directory table gains a "Permisos" button:

```tsx
<button onClick={() => openPermisosModal(u)}>
  <Settings size={14} /> Permisos
</button>
```

The modal shows three checkboxes:
```tsx
<PermisosModal
  usuario={selectedUser}
  proyectos={PROJECTS}
  currentPermissions={userPermissions}
  onSave={handleSavePermisos}
  onClose={closeModal}
/>
```

`handleSavePermisos` calls `PATCH /api/v1/invitaciones/usuarios/{id}/permisos` (new endpoint) with `{ proyectos_permitidos: string[] }`. Falls back to localStorage key `hardcrm_user_permissions_v2`.

#### 4c. Backend endpoint for permissions

New endpoint in `invitaciones.py`:
```python
@router.patch("/usuarios/{usuario_id}/permisos")
def actualizar_permisos_usuario(usuario_id: str, body: PermisosRequest, db: Session):
    ...
```

`PermisosRequest` has field `proyectos_permitidos: list[str]`.

The `Usuario` model gets a new `String` column `permisos_proyectos` (JSON-encoded list, nullable, default `null` = all projects allowed).

---

## Data Models

### Frontend — User permissions localStorage

```ts
// Key: 'hardcrm_user_permissions_v2'
// Value: { [userId: string]: string[] }
// Example: { 'USR-001': ['bigdata', 'cloud-aws'] }
```

### Backend — `Usuario` model addition

```python
permisos_proyectos = Column(String(500), nullable=True, default=None)
# Stored as JSON string: '["bigdata","cloud-aws"]'
# null means all projects allowed
```

### New Pydantic schema

```python
class PermisosRequest(BaseModel):
    proyectos_permitidos: list[str]
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: OTP whitelist additive delivery**
*For any* primary recipient email and any list of N valid email addresses in `EMAIL_WHITELIST`, the email service attempts to send the OTP code to exactly N+1 destinations. When N=0 (empty or unset whitelist), exactly 1 send attempt is made — preserving backward-compatible behavior.
**Validates: Requirements 1.1, 1.2**

Reasoning: This generalizes both the "sends to whitelist" and "empty whitelist sends only to primary" requirements into a single parameterized property. The generator can produce whitelist sizes from 0 to N.

**Property 2: Whitelist failure isolation**
*For any* combination of addresses in `EMAIL_WHITELIST` where a random subset fails to send, the email service does not raise an exception and attempts delivery to all addresses regardless of which ones fail.
**Validates: Requirements 1.3**

Reasoning: We simulate failures for a random subset of addresses by mocking `_send_message` to raise for those addresses, then assert the function returns normally and that the non-failing addresses were still attempted.

**Property 3: Project selector gate**
*For any* application state where the user is authenticated and enabled but `selectedProject` is null, the rendered component tree contains `ProjectSelector` and does not contain `DashboardContent`.
**Validates: Requirements 2.1, 2.5**

Reasoning: These two criteria are two sides of the same condition — showing ProjectSelector implies not showing DashboardContent. One property covers both.

**Property 4: Project card click transitions to dashboard**
*For any* valid project ID in the project list, simulating a click on that project card results in `selectedProject` being set to that project's ID and `DashboardContent` being rendered.
**Validates: Requirements 2.3**

Reasoning: The state transition must hold for all three project cards, not just a specific one.

**Property 5: Logout resets project selection**
*For any* previously selected project, after the logout action is invoked, the `selectedProject` value in application state is null — causing the ProjectSelector to be shown again on the next authenticated render.
**Validates: Requirements 2.6**

Reasoning: This is a reset/idempotency property. The selected project must not persist across sessions.

**Property 6: Permissions filter shown projects**
*For any* user with a non-empty `proyectos_permitidos` list that is a strict subset of all available projects, the ProjectSelector renders exactly the cards corresponding to those permitted projects and no others.
**Validates: Requirements 2.7, 4.9, 4.10**

Reasoning: The filtering logic must be exact — no extra cards, no missing cards. Generating random subsets covers all combinations.

**Property 7: Sidebar tabs by role**
*For any* user with role `administrador`, the Sidebar renders exactly 5 tabs (reports, invitaciones, dataset, documentos, comparativa). *For any* user with role `analista`, the Sidebar renders exactly 4 tabs (reports, dataset, documentos, comparativa).
**Validates: Requirements 3.1, 3.2**

Reasoning: Combined into one property since both roles are parameterizable. The expected tab set is a pure function of the role.

**Property 8: Pending accounts panel count**
*For any* list of users where exactly K users have `estado = "pendiente_aprobacion"`, the "Cuentas en Espera" panel renders exactly K account cards — no more, no fewer.
**Validates: Requirements 4.5**

Reasoning: The panel count must match the data exactly for any K ≥ 0, including K=0 (shows empty state).

**Property 9: Habilitar user state transition**
*For any* user currently with `habilitado = false` and `estado = "pendiente_aprobacion"`, calling the enable action results in that user having `habilitado = true` and `estado = "activo"`.
**Validates: Requirements 4.6**

Reasoning: The state transition must hold for any pending user, not just specific test fixtures.

**Property 10: Permissions save round trip**
*For any* user ID and any non-empty subset of project IDs, saving that subset via the permissions handler and then reading back the stored permissions for that user ID returns the identical subset.
**Validates: Requirements 4.9**

Reasoning: This is a classic round-trip property that validates the persistence layer (localStorage fallback and/or backend) correctly stores and retrieves permissions without data loss or mutation.

---

## Error Handling

- **SMTP failures per whitelist address**: caught individually, logged to stdout, processing continues.
- **Invalid `invite_token` in URL**: `validarTokenInvitacion` returns `{ valido: false }`, AuthPage shows an error card.
- **Backend unavailable**: all API calls have a `localStorage` fallback — no behavior change for Vercel deployment.
- **User with no project permissions**: ProjectSelector shows an empty state with a message "No tienes proyectos asignados aún. Contacta al Administrador."
- **Permission PATCH backend error**: falls back to updating `hardcrm_user_permissions_v2` in localStorage.

---

## Testing Strategy

### Unit tests

- `getWhitelistEmails()` utility: empty string → [], single address → [addr], multiple → [addr1, addr2], malformed → filtered out.
- `ProjectSelector` renders: 3 cards when no restrictions, filtered cards when permissions set, empty state when empty permissions.
- `Sidebar` renders correct tabs per role.
- `PermisosModal` checkboxes reflect current permissions and call `onSave` with correct payload.

### Property-based testing

Using **Hypothesis** (Python) for backend properties and **fast-check** (TypeScript/Vitest) for frontend properties.

Each property-based test runs a minimum of 100 iterations.

**Backend (Hypothesis):**
- **Feature: project-selector-and-auth-improvements, Property 1: OTP whitelist additive delivery** — Generate random valid email lists (size 0 to 10), assert send is attempted N+1 times.
- **Feature: project-selector-and-auth-improvements, Property 2: Whitelist failure isolation** — Inject failures for random subset, assert function does not raise and remaining addresses are attempted.

**Frontend (fast-check + Vitest):**
- **Feature: project-selector-and-auth-improvements, Property 3: Project selector gate** — Generate random auth states, assert correct component renders.
- **Feature: project-selector-and-auth-improvements, Property 4: Project card click transitions to dashboard** — For each of the 3 project IDs, simulate click, assert state transition.
- **Feature: project-selector-and-auth-improvements, Property 5: Logout resets project selection** — Generate random selected project, call logout, assert selectedProject is null.
- **Feature: project-selector-and-auth-improvements, Property 6: Permissions filter shown projects** — Generate random subsets of project IDs, assert ProjectSelector renders only those cards.
- **Feature: project-selector-and-auth-improvements, Property 7: Sidebar tabs by role** — For both roles, assert exact tab set rendered.
- **Feature: project-selector-and-auth-improvements, Property 8: Pending accounts panel count** — Generate user lists with random K pending, assert panel shows K cards.
- **Feature: project-selector-and-auth-improvements, Property 9: Habilitar user state transition** — Generate pending users, apply enable action, assert state.
- **Feature: project-selector-and-auth-improvements, Property 10: Permissions save round trip** — Generate random userId+projectSubset pairs, save and read back, assert equality.
