# ✅ SOLUCIÓN: Código OTP Visible en Desarrollo

## 🎯 Problema Resuelto

Tu amigo trabaja desde su PC pero **no recibe los códigos OTP** porque:
- El backend corre en **TU PC** (localhost:8000)
- Los emails solo se envían a `eduardocaballero392@gmail.com` (cuenta de Resend)
- SMTP Gmail tiene la contraseña expirada

## ✨ Cambios Implementados

### 1. Backend devuelve el código OTP en desarrollo

**Archivo**: `app/api/v1/endpoints/auth.py`

Ahora cuando el `FRONTEND_URL` es `localhost`, el endpoint `/auth/request-otp` devuelve:

```json
{
  "message": "Codigo OTP generado: 123456 — Revisa tu email o usa este codigo"
}
```

### 2. Frontend extrae y muestra el código

**Archivos modificados**:
- `src/services/authApi.ts` - Extrae el código del mensaje
- `src/components/auth/OtpVerificationStep.tsx` - Muestra el código en pantalla
- `src/components/auth/InvitationSetupPage.tsx` - Pasa el código al componente

### 3. Logs más visibles en consola

**Archivo**: `app/services/auth_service.py`

Cuando falla el envío del email, se muestra:

```
========================================
💡 [OTP] USA ESTE CÓDIGO MANUALMENTE: 123456
⏱️  [OTP] El código expira en 10 minutos
========================================
```

### 4. Email Whitelist configurado

**Archivo**: `.env`

Agregado:
```env
EMAIL_WHITELIST=eduardocaballero392@gmail.com
```

Todos los códigos también se envían a este email.

---

## 🚀 Cómo Usar

### Para tu Amigo (desde su PC)

1. **Abre el frontend** (http://localhost:5173)
2. **Solicita el código OTP** con cualquier email
3. **Mira la pantalla** - El código aparecerá en un recuadro morado:

```
🔓 MODO DESARROLLO
    123456
Tu código OTP (Cópialo o ingrésalo manualmente)
```

4. **Copia el código** e ingrésalo manualmente

### Para ti (Backend en tu PC)

1. También puedes ver el código en la **terminal del backend**
2. Compártelo con tu amigo por WhatsApp/Discord/etc.
3. O revisa el email `eduardocaballero392@gmail.com`

---

## 🧪 Probar que Funciona

### 1. Reinicia el backend

```powershell
# Presiona Ctrl+C en la terminal del backend
# Luego ejecuta de nuevo:
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Reinicia el frontend

```powershell
# Presiona Ctrl+C en la terminal del frontend
# Luego ejecuta de nuevo:
npm run dev
```

### 3. Prueba el flujo

1. Ve a: http://localhost:5173
2. Haz clic en "Registro" o usa un link de invitación
3. Completa el formulario
4. Haz clic en "Enviar código OTP"
5. **VERÁS EL CÓDIGO EN PANTALLA** en un recuadro morado

---

## 📝 Notas Importantes

### Modo Desarrollo vs Producción

- **Desarrollo** (`localhost`): El código se muestra en pantalla
- **Producción** (Render/Vercel): El código NO se muestra (solo se envía por email)

### Seguridad

- Esta funcionalidad SOLO funciona cuando `FRONTEND_URL` contiene `localhost`
- En producción, el código nunca se devuelve en la respuesta

### Alternativas

Si no ves el código en pantalla:

1. **Revisa la consola del navegador** (F12)
   - Busca: `🔑 [DEV] Código OTP recibido: 123456`

2. **Revisa los logs del backend**
   - Busca el recuadro con el código

3. **Revisa el email** `eduardocaballero392@gmail.com`

---

## 🔧 Si Sigue Sin Funcionar

### Problema: No aparece el recuadro morado

**Causa**: El backend no está devolviendo el código

**Solución**:
```bash
# Verifica que el backend esté corriendo con:
curl http://localhost:8000/api/v1/auth/request-otp
```

### Problema: Sale error 500

**Causa**: El backend no puede conectarse a la base de datos

**Solución**:
1. Verifica que `DATABASE_URL` esté correcto en `.env`
2. Revisa los logs del backend

### Problema: El código no es válido

**Causa**: El código expiró (10 minutos)

**Solución**:
1. Solicita un nuevo código
2. El código anterior se invalida automáticamente

---

## ✅ Ventajas de Esta Solución

- ✨ **No necesitas email funcionando** para desarrollo
- 🚀 **Tu amigo ve el código inmediatamente**
- 🔒 **Seguro** - Solo funciona en localhost
- 📱 **Fácil de copiar** - Click para copiar el código
- 🎨 **Visual** - Recuadro morado llamativo

---

## 📚 Archivos Modificados

```
Backend:
- app/api/v1/endpoints/auth.py
- app/services/auth_service.py
- .env

Frontend:
- src/services/authApi.ts
- src/components/auth/OtpVerificationStep.tsx
- src/components/auth/InvitationSetupPage.tsx

Documentación:
- CODIGO_OTP_VISIBLE.md (este archivo)
- SOLUCION_EMAIL_OTP.md
```

---

¡Ahora tu amigo puede trabajar sin problemas! 🎉
