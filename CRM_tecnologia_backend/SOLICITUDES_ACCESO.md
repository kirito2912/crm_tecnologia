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
