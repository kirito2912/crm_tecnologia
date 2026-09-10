# Solicitudes de acceso

El modal de inicio registra nombre, correo, empresa opcional y motivo; la contraseña se crea mediante la invitación posterior.

El administrador encuentra la tabla en Gestión de Invitaciones. Aprobar crea un enlace de siete días (o reutiliza uno vigente para el mismo correo, aplicando el rol elegido). Rechazar envía «Lo sentimos, se denegó tu solicitud para ingresar al sistema». Las decisiones permanecen guardadas aunque falle el correo; Reintentar correo permite volver a enviarlo.

## Despliegue
1. Desplegar primero el backend. El arranque con Base.metadata.create_all crea la tabla solicitudes_acceso sin borrar las existentes.
2. Desplegar el frontend con VITE_API_URL apuntando a ese backend.
3. Cerrar sesión y volver a ingresar como administrador: la nueva API exige una sesión firmada; las sesiones demo antiguas no sirven.
4. Mantener FRONTEND_URL con la URL pública del frontend y las credenciales de Gmail/Google en Render.
5. Probar con correos autorizados una aprobación y un rechazo.

Enviar una solicitud no concede acceso ni crea una cuenta. Tras aprobar se conserva el flujo existente de invitación, registro y habilitación del administrador. Solo se permite una solicitud por correo; los duplicados indican contactar al administrador.

## API
POST /api/v1/solicitudes-acceso/ es público.
GET /api/v1/solicitudes-acceso/, POST /{id}/resolver y POST /{id}/reenviar requieren administrador autenticado y habilitado.

Las pruebas usan SQLite temporal y correos simulados. No se ha probado la entrega real en producción. Que el proveedor acepte el mensaje no garantiza llegada a la bandeja principal.

## Avisos al administrador
Al crear una solicitud o completar un registro por invitación, el backend intenta enviar un correo a las cuentas de administrador activas y habilitadas. Usa el correo guardado en cada cuenta, no el remitente de Google como destinatario automático. Las credenciales de envío permanecen en Render.

El registro queda guardado antes de mostrar éxito en el frontend. Si la API falla, se muestra el error y no se crea una cuenta ficticia en localStorage. Los envíos se ejecutan en segundo plano; un fallo no elimina la solicitud del panel. Revisar los logs con el prefijo [ADMIN NOTIFICATION] para errores o ausencia de administradores. Estos avisos no tienen reintento automático ni recuperan registros anteriores al despliegue.

Desplegar backend en Render y frontend en Vercel. Verificar con un registro nuevo y revisar tanto Cuentas en espera como la bandeja del correo asociado al administrador. Las pruebas locales simulan el proveedor; no confirman entrega real.
