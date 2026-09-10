# Envío en Render con Gmail API

Configura en el backend:
- GMAIL_CLIENT_ID
- GMAIL_CLIENT_SECRET
- GMAIL_REFRESH_TOKEN
- GMAIL_SENDER_EMAIL: el mismo Gmail que autorizaste en Google.
- EMAIL_FROM_NAME: nombre visible (opcional).
- FRONTEND_URL: dirección HTTPS pública del frontend.

Las variables GMAIL_* seleccionan Gmail API para invitaciones y OTP.
Deben estar completas. Si Gmail rechaza el envío, no se intenta otro proveedor para evitar duplicados.
Si no se configura ninguna variable GMAIL_*, se mantiene Resend/SMTP.

## Despliegue y comprobación
1. Sube los cambios del backend al repositorio y rama conectados a Render.
2. En Render, Manual Deploy → Deploy latest commit (o espera el despliegue automático).
3. Espera estado Live. Guardar variables no instala por sí solo este código.
4. Crea una invitación a un correo de prueba que controles.
5. Comprueba la recepción y el enlace. Debe abrir tu frontend público.
6. Revisa los logs [Gmail API] si email_enviado es false.

HTTP 400/401 durante autorización: comprueba cliente, secreto y refresh token.
Si el token expiró o fue revocado, autoriza otra vez y actualízalo en Render.
HTTP 403 durante envío: revisa Gmail API habilitada y permiso gmail.send.
HTTP 429: límite del proveedor; espera antes de volver a intentar.
Una aceptación de Gmail no garantiza llegada a la bandeja de entrada; revisa spam y Enviados.

En estado OAuth Testing el refresh token de Gmail caduca a los siete días.
Para uso continuo, revisa el estado de publicación de tu aplicación y vuelve a autorizar.
No guardes secretos en GitHub ni en variables VITE_*.

Referencias:
https://developers.google.com/workspace/gmail/api/guides/sending
https://developers.google.com/identity/protocols/oauth2/web-server#offline

## Nombres alternativos
También se aceptan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REFRESH_TOKEN.
Para el remitente se acepta GOOGLE_SENDER_EMAIL o EMAIL_USER.
Las variables GMAIL_* tienen prioridad si ambos nombres tienen valores.
EMAIL_USER por sí sola no activa Gmail API.
