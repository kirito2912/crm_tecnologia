# Requirements Document

## Introduction

This document specifies requirements for four interconnected improvements to the DataTech Analytics CRM platform:

1. **Multi-recipient OTP email support**: Configure multiple destination emails for OTP codes (useful for testing and deployment).
2. **Project selector screen**: After login, users select a project before entering the dashboard.
3. **Unified role modules**: Both `analista` and `administrador` share access to all relevant modules (Datasets, Comparativa, Documentos, Reportes), with Invitaciones exclusive to admin.
4. **Enhanced invitation module**: The invitation management panel includes a permissions management button per user, a dedicated "Cuentas en Espera" panel (not a floating notification), and all account approvals and permission assignments are handled exclusively from this module.

## Glossary

- **OTP (One-Time Password)**: A 6-digit numeric code sent by email for two-factor authentication.
- **SMTP**: Simple Mail Transfer Protocol — the protocol used to send emails.
- **EMAIL_USER**: The Gmail account used as the SMTP sender, defined in the backend `.env`.
- **EMAIL_WHITELIST**: Comma-separated list of additional recipient emails that also receive every OTP code (for testing/deployment).
- **Project Selector Screen**: A full-page UI screen displayed after login that lets users choose one of the available projects.
- **Proyecto / Project**: One of three named learning/business projects on the platform: "BIG DATA", "TECNOLOGÍA CLOUD CON AWS", "AI-900T00 CONCEPTOS BÁSICOS DE IA EN MICROSOFT AZURE".
- **Analista**: User role with access to Reportes, Datasets, Documentos, and Comparativa.
- **Administrador**: User role with access to Reportes, Invitaciones, Datasets, Documentos, and Comparativa.
- **Dashboard**: The main application screen with Sidebar navigation and content panels.
- **InvitacionesView**: The React component rendering the invitation management panel for administrators.
- **Invitation flow**: End-to-end process: admin generates invite link → invitee registers with OTP → account is pending → admin approves and assigns permissions from the Invitaciones module.
- **Cuentas en Espera panel**: A dedicated section within InvitacionesView that lists users who completed registration but whose accounts are pending admin approval.
- **Permisos**: A per-user configuration that specifies which of the three Projects the user is allowed to access.
- **NavTab**: TypeScript union type defining valid sidebar navigation tabs.

---

## Requirements

### Requirement 0 — Deployment compatibility (Vercel + Render)

**User Story:** As a developer, I want all frontend service calls to use the environment variable `VITE_API_URL` instead of hardcoded `localhost` URLs, so that the application works correctly when deployed on Vercel (frontend) and Render (backend) without requiring code changes.

#### Acceptance Criteria

1. THE `invitacionesApi.ts` service file SHALL use `import.meta.env.VITE_API_URL` as the base URL with a `localhost:8000` fallback, the same pattern already used in `authApi.ts`, `documentosApi.ts`, and `reportesApi.ts`.
2. THE `CRM_tecnologia_frontend/.env.example` file SHALL include the `VITE_API_URL` variable with a comment explaining it must point to the Render backend URL in production.
3. WHEN `VITE_API_URL` is set to the Render backend URL, THE frontend SHALL communicate with the backend for all API calls including invitations, authentication, and documents without any hardcoded localhost references.
4. THE changes to URL handling SHALL introduce no breaking changes to the existing fallback-to-localStorage behavior used when the backend is unavailable.

---

### Requirement 1 — Multi-recipient OTP email delivery

**User Story:** As a developer or system administrator, I want OTP codes to be sent to multiple email addresses simultaneously, so that during testing and deployment I can receive verification codes without relying solely on the primary recipient account.

#### Acceptance Criteria

1. WHEN the backend sends an OTP email, THE Email Service SHALL read the `EMAIL_WHITELIST` environment variable and, if it contains one or more comma-separated email addresses, send the OTP code to each address in the list in addition to the primary recipient.
2. WHEN `EMAIL_WHITELIST` is empty or not defined, THE Email Service SHALL send the OTP code only to the primary recipient, preserving existing behavior.
3. WHEN an email address in `EMAIL_WHITELIST` is malformed or delivery fails for that address, THE Email Service SHALL log the failure and continue sending to the remaining addresses without raising an exception.
4. THE `.env.example` file SHALL document the `EMAIL_WHITELIST` variable with a descriptive comment and an example showing multiple addresses.
5. WHEN the backend starts, THE system SHALL log the count of additional whitelist recipients configured, showing zero if the variable is not set.

---

### Requirement 2 — Project selector screen after login

**User Story:** As an authenticated user, I want to see a project selection screen after logging in, so that I can choose the relevant project context before entering the main dashboard.

#### Acceptance Criteria

1. WHEN a user completes authentication successfully and their account is enabled, THE system SHALL display the Project Selector Screen before rendering the Dashboard.
2. WHEN the Project Selector Screen is displayed, THE system SHALL render three project cards centered on the page: "BIG DATA", "TECNOLOGÍA CLOUD CON AWS", and "AI-900T00 CONCEPTOS BÁSICOS DE IA EN MICROSOFT AZURE".
3. WHEN a user clicks a project card, THE system SHALL store the selected project name in the application state and immediately navigate to the Dashboard.
4. WHEN the user is on the Dashboard, THE system SHALL display the name of the selected project in the Sidebar or Header.
5. WHILE the user is on the Project Selector Screen, THE system SHALL prevent access to any Dashboard module until a project is selected.
6. IF the user logs out and logs in again, THE system SHALL display the Project Selector Screen so the user reselects the project for the new session.
7. WHEN the project permissions for a user are configured by an administrator, THE Project Selector Screen SHALL display only the projects the user is permitted to access.

---

### Requirement 3 — Unified modules for Analista and Administrador roles

**User Story:** As a platform user with any role, I want access to all relevant modules including Datasets and Comparativa, so that both Analistas and Administradores can work with the complete set of tools.

#### Acceptance Criteria

1. WHEN a user with the `administrador` role logs in, THE Sidebar SHALL display tabs for: Reportes de Comparativas, Gestión de Invitaciones, Datasets de Empresas, Documentos Word y PDF, and Módulo Comparativa.
2. WHEN a user with the `analista` role logs in, THE Sidebar SHALL display tabs for: Reportes de Comparativas, Datasets de Empresas, Documentos Word y PDF, and Módulo Comparativa.
3. WHEN any authenticated user navigates to the Datasets tab, THE DatasetView component SHALL render correctly.
4. WHEN any authenticated user navigates to the Comparativa tab, THE ComparacionView component SHALL render correctly and allow creating comparative analyses.
5. WHEN an `administrador` user navigates to the Invitaciones tab, THE InvitacionesView component SHALL render the full invitation management panel.

---

### Requirement 4 — Enhanced invitation module with permissions and waiting accounts panel

**User Story:** As an administrator, I want the invitation module to be the single place where I manage account approvals and assign project permissions per user, so that I have full control over who accesses the platform and which projects they can enter.

#### Acceptance Criteria

1. WHEN an administrator submits the invitation form with a valid email and role, THE system SHALL generate a unique invitation token, persist the invitation record, and return the full invitation link.
2. WHEN invitation email delivery fails (SMTP not configured), THE InvitacionesView SHALL display a visible inline warning indicating the email was not sent and the admin must share the link manually.
3. WHEN a user opens a valid invitation link, THE AuthPage SHALL detect the `invite_token` query parameter, validate it, and display the registration form pre-filled with the assigned email and role.
4. WHEN an invited user completes registration and OTP verification, THE system SHALL create the account with `estado = "pendiente_aprobacion"` and `habilitado = false`, and display the PendingApprovalScreen to that user.
5. WHEN the InvitacionesView renders, THE system SHALL display a dedicated "Cuentas en Espera" panel section (not a floating toast) that lists every user with `estado = "pendiente_aprobacion"`, showing their name, email, role, and an "Habilitar Acceso" button.
6. WHEN the administrator clicks "Habilitar Acceso" for a pending user from the "Cuentas en Espera" panel, THE system SHALL set `habilitado = true` and `estado = "activo"` for that user exclusively via the Invitaciones module.
7. WHEN the administrator views the user directory in InvitacionesView, THE system SHALL display a "Permisos" button for each user in addition to the existing Habilitar/Deshabilitar button.
8. WHEN the administrator clicks the "Permisos" button for a user, THE system SHALL display a permissions panel or modal that lists the three available projects with checkboxes, showing which projects the user currently has access to.
9. WHEN the administrator saves the permissions configuration for a user, THE system SHALL persist the list of allowed projects for that user and THE Project Selector Screen SHALL reflect those permissions when that user next logs in.
10. WHEN a user attempts to access a project they do not have permission for, THE system SHALL prevent access and display a message indicating they do not have permission for that project.
