# Flujo Completo de Invitación, Configuración de Contraseña, OTP y Permisos de Proyectos - Product Requirements Document

## Overview
- **Summary**: Implementación y consolidación del flujo end-to-end para la activación de cuentas de usuarios invitados: desde la recepción del enlace de invitación URL, la creación de contraseña por parte del trabajador, la verificación OTP posterior, la pantalla de cuenta pendiente de habilitación, y finalmente el filtrado de proyectos visibles según los permisos asignados por el Administrador una vez que la cuenta es habilitada.
- **Purpose**: Garantizar que todo el ciclo de vida de onboarding de un trabajador invitado sea seguro, secuencial, con pasos verificables y que el acceso al contenido de la plataforma esté estrictamente bloqueado hasta la habilitación administrativa y filtrado por permisos de proyecto.
- **Target Users**: 
  - Trabajadores invitados (analistas, programadores, auditores) que reciben el enlace por correo.
  - Administradores que habilitan cuentas y asignan proyectos.

## Goals
- G1: El enlace de invitación (URL con `invite_token`) cargue una vista dedicada que permita únicamente crear la contraseña del trabajador, pre-cargando su correo y rol asignado.
- G2: Inmediatamente después de crear la contraseña correctamente, el sistema envía un código OTP de 6 dígitos al correo registrado en la invitación.
- G3: Al validar el OTP correctamente, el sistema muestra un mensaje explícito de "Usuario y contraseña guardados con éxito" antes de pasar al estado de espera.
- G4: Al intentar iniciar sesión (email + contraseña) y pasar el segundo código OTP de autenticación, si la cuenta no está habilitada aún (`habilitado=false` o `estado=pendiente_aprobacion`), se muestra una pantalla de bloqueo informativa SIN acceso a módulos ni datos del sistema.
- G5: Una vez que el Administrador habilita la cuenta (`habilitado=true`, `estado=activo`) y asigna proyectos mediante `permisos_proyectos`, el trabajador solo visualizará las tarjetas de proyectos a los que tiene acceso explícito.

## Non-Goals
- NG1: No se modifica el módulo de creación de invitaciones (Admin) ni el envío de correos de invitación.
- NG2: No se cambia el algoritmo de generación/expiración de códigos OTP existente.
- NG3: No se implementan roles nuevos ni se cambia el modelo de RBAC existente.
- NG4: No se modifica la pantalla de login estándar para usuarios auto-registrados (sin invitación).

## Background & Context
La base de código ya cuenta con componentes parciales en frontend y backend:
- **Backend**: `app/api/v1/endpoints/invitaciones.py` con `validar_token_invitacion` y `completar_registro_invitado`; `app/api/v1/endpoints/auth.py` con `request-otp` y `verify-otp`; modelos `Invitacion`, `Usuario` (con `permisos_proyectos`, `habilitado`, `estado`), `OTPCode`.
- **Frontend**: `components/auth/AuthPage.tsx` con detección de `invite_token` en URL y modal de invitación; `OtpVerificationStep.tsx`; `PendingApprovalScreen.tsx`; `ProjectSelector.tsx` con filtrado `allowedProjects`; `App.tsx` con orquestación de pantallas.
- El flujo actual existe pero requiere consolidación para cumplir estrictamente con la secuencia: URL Invitación → Crear Contraseña → Enviar OTP → Verificar OTP → Mensaje Éxito → Pantalla Pendiente → (luego de habilitar) Selector Filtrado.

## Functional Requirements
- **FR-1**: Detección automática del parámetro `invite_token` en la URL de la aplicación y validación asincrónica contra el endpoint `/invitaciones/validar/{token}`.
- **FR-2**: Si el token es válido, presentar un formulario cerrado donde el correo electrónico aparezca pre-cargado y bloqueado, y el trabajador ingrese únicamente: nombre completo, contraseña y confirmación de contraseña (mínimo 6 caracteres, ambas coincidentes).
- **FR-3**: Al confirmar el formulario de creación de contraseña con datos válidos, el sistema debe solicitar y generar un código OTP de 6 dígitos para el correo del invitado (endpoint `/auth/request-otp` en modo `invite`) y pasar inmediatamente a la pantalla de ingreso de OTP.
- **FR-4**: El backend, al procesar el OTP de modo `invite`, debe asegurar que el usuario en tabla `User` quede con `is_active=False` y `is_verified=True` post-verificación.
- **FR-5**: Una vez que el OTP de invitación es verificado correctamente en frontend, antes de completar el registro en tabla `Usuario`, se debe mostrar un mensaje/modal explícito confirmando "Tu usuario y contraseña han sido guardados con éxito".
- **FR-6**: Después del mensaje de éxito, se invoca `completar-registro-invitado` y la cuenta queda creada con `habilitado=false` y `estado=pendiente_aprobacion`, presentándose la `PendingApprovalScreen`.
- **FR-7**: En un inicio de sesión estándar (email + contraseña + OTP de login), inmediatamente después del OTP exitoso, se evalúan los campos `habilitado` y `estado` del usuario; si no está activo, se muestra `PendingApprovalScreen` sin cargar módulos, datos ni navegación del dashboard.
- **FR-8**: El endpoint `PATCH /invitaciones/usuarios/{usuario_id}/permisos` del Administrador debe persistir correctamente los IDs de proyectos en `Usuario.permisos_proyectos` (formato JSON array de strings).
- **FR-9**: Al ingresar un usuario ya habilitado, el `ProjectSelector` filtra los proyectos disponibles contra el array `permisos_proyectos` del usuario, mostrando únicamente las coincidencias; si la lista está vacía, mostrar estado vacío "No tienes proyectos asignados aún. Contacta al Administrador."

## Non-Functional Requirements
- **NFR-1**: Seguridad: Todas las contraseñas deben persistirse únicamente como hash bcrypt (`hash_password` de `core/security.py`), nunca en texto plano.
- **NFR-2**: Respuesta UI: Cada transición de paso debe tener un estado de carga (spinner) con timeout mínimo de 6s para requests al backend.
- **NFR-3**: Fallback Offline: Si el backend no está disponible, el frontend debe mantener un fallback local para pruebas (desarrollo) que simule el flujo completo.
- **NFR-4**: Validez OTP: Códigos expiran a los 10 minutos y solo pueden usarse una vez; códigos previos activos son invalidados al generar uno nuevo.

## Constraints
- **Technical**: 
  - Backend: FastAPI, SQLAlchemy, PostgreSQL. No introducir nuevas dependencias.
  - Frontend: React + TypeScript + Vite, Context API para estado. No integrar nuevas librerías.
  - Los proyectos visibles vienen del array `PROJECTS` en `ProjectSelector.tsx` (IDs: `bigdata`, `cloud-aws`, `azure-ai`).
- **Business**: 
  - Ningún trabajador invitado podrá ver contenido de la plataforma hasta que el Administrador cambie `habilitado=true` y `estado=activo`.
  - Si `permisos_proyectos` es `null` o vacío, se interpreta como "sin proyectos asignados" (no todos los proyectos).
- **Dependencies**: 
  - Servicio de emails (`email_service.py`) disponible para envío de OTPs; en desarrollo se acepta impresión del código en logs.

## Assumptions
- A1: La URL de invitación se envía por correo desde el módulo de administración existente (formato: `{FRONTEND_URL}/?invite_token={token}`).
- A2: El Administrador utiliza la pantalla `InvitacionesView` para habilitar cuentas y asignar proyectos.
- A3: Los IDs de proyectos coinciden entre el array `PROJECTS` del frontend y los que almacena el backend en `permisos_proyectos`.

## Acceptance Criteria

### AC-1: Detección y validación de token de invitación en URL
- **Type**: `rule`
- **Given**: Un usuario accede a la aplicación con una URL que contiene `?invite_token=inv_tok_XXX` válido y pendiente
- **When**: La página carga completamente
- **Then**: Se muestra automáticamente la vista/formulario de creación de contraseña con el correo pre-cargado y bloqueado, y el rol asignado visible
- **Pass Condition**: El campo email no es editable y coincide con `inv.email` devuelto por la validación; no se muestra el formulario de login estándar
- **Evidence**: Screenshot o prueba E2E mostrando modal de invitación abierto con email bloqueado

### AC-2: Envío de OTP inmediato después de crear contraseña
- **Type**: `rule`
- **Given**: El trabajador completa nombre + contraseña + confirmación correctamente en el flujo de invitación
- **When**: Hace clic en "Confirmar y Enviar OTP"
- **Then**: Se genera un nuevo registro `OTPCode` en BD para ese correo con `is_used=false`, se envía (o loguea en dev) el código de 6 dígitos, y la vista cambia al paso de ingreso de OTP
- **Pass Condition**: Query a BD muestra un nuevo OTPCode activo para el correo; UI muestra paso de OTP con email visible
- **Evidence**: Registro en tabla `otp_codes` + captura de pantalla del paso OTP

### AC-3: Verificación de OTP y mensaje de éxito de credenciales guardadas
- **Type**: `rule`
- **Given**: El trabajador recibe el OTP y está en la pantalla de ingreso de código
- **When**: Ingresa los 6 dígitos correctos y confirma
- **Then**: 1) Se marca el OTP como usado, 2) Se muestra un mensaje explícito "Tu usuario y contraseña han sido guardados con éxito" con ícono de check, 3) Después del mensaje se completa el registro con estado pendiente
- **Pass Condition**: Después del OTP correcto aparece el mensaje de éxito antes de navegar a la pantalla pendiente; BD muestra `invitaciones.estado = 'registrado'`
- **Evidence**: Screenshot del mensaje de éxito + actualización en BD de la invitación

### AC-4: Pantalla de bloqueo al iniciar sesión sin cuenta habilitada
- **Type**: `rule`
- **Given**: Un trabajador tiene credenciales correctas pero su registro tiene `habilitado=false` o `estado=pendiente_aprobacion`
- **When**: Completa login (email+password) + OTP de login exitosamente
- **Then**: Se muestra `PendingApprovalScreen` con mensaje de espera; NO se renderiza `Sidebar`, `Header`, ni ningún módulo de datos
- **Pass Condition**: Inspección del DOM confirma que solo está montado `PendingApprovalScreen`; no hay elementos de navegación del dashboard
- **Evidence**: Screenshot de la pantalla pendiente sin barra lateral ni tabs

### AC-5: Filtrado de proyectos por permisos asignados tras habilitación
- **Type**: `rule`
- **Given**: El Administrador habilita la cuenta y asigna `permisos_proyectos = ["cloud-aws", "bigdata"]` a un usuario
- **When**: El usuario inicia sesión, pasa login+OTP y está habilitado
- **Then**: El `ProjectSelector` muestra únicamente 2 tarjetas ("TECNOLOGÍA CLOUD CON AWS" y "BIG DATA") y oculta "AI-900T00 CONCEPTOS BÁSICOS DE IA EN MICROSOFT AZURE"
- **Pass Condition**: Conteo de tarjetas renderizadas = 2; no existe en DOM un botón con `data-project-id="azure-ai"`
- **Evidence**: Screenshot del selector con solo 2 proyectos + valor en BD `permisos_proyectos`

### AC-6: Estado vacío cuando no hay proyectos asignados
- **Type**: `rule`
- **Given**: Usuario habilitado con `permisos_proyectos = []` o `null`
- **When**: Ingresa al selector de proyectos
- **Then**: Se muestra el mensaje "No tienes proyectos asignados aún. Contacta al Administrador." y ninguna tarjeta
- **Pass Condition**: No hay elementos `.project-card` en DOM y sí aparece el texto de estado vacío
- **Evidence**: Screenshot del estado vacío

### AC-7: Coherencia UX del flujo completo
- **Type**: `rubric`
- **Dimension**: Fluidez y claridad del flujo end-to-end desde la URL de invitación hasta el selector filtrado
- **Scale**: 1-5
- **Anchors**: 1 = Pasos confusos, pantallas en blanco o transiciones abruptas; 3 = Flujo funcional con pequeños saltos o indicadores inconsistentes; 5 = Secuencia impecable, cada paso tiene título claro, estado de carga, mensaje de éxito y botón de acción inmediato
- **Pass Threshold**: >= 4
- **Evidence**: Revisión manual de pantallazos por paso y checklist de elementos (título, loader, mensaje error/exito, acción siguiente)

### AC-8: Seguridad y persistencia de hashes de contraseña
- **Type**: `rule`
- **Given**: Cualquier registro exitoso de contraseña en el flujo de invitación
- **When**: Se inspecciona la tabla `usuarios.password_hash` y `users.password_hash`
- **Then**: El valor almacenado empieza por `$2b$` o prefijo bcrypt válido; nunca coincide con el texto plano introducido por el usuario
- **Pass Condition**: Hash en BD pasa `verify_password(plaintext, hash)` = True y longitud > 40 chars
- **Evidence**: Consulta SELECT + ejecución de `verify_password` con contraseña original
