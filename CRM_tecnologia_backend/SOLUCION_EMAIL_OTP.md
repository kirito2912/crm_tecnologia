# 🔧 Solución: Código OTP No Llega al Correo

## 📋 Diagnóstico

El sistema tiene **3 métodos** para enviar emails, pero actualmente ninguno funciona:

### 1. ❌ SMTP Gmail
**Error**: `Username and Password not accepted`
- La contraseña de aplicación `vnphxjrkbolctljc` ya no es válida
- Google rechaza la autenticación

### 2. ❌ Resend API  
**Error**: `You can only send testing emails to your own email address`
- Con `onboarding@resend.dev` solo puedes enviar a: `eduardocaballero392@gmail.com`
- Para otros correos necesitas verificar un dominio propio

### 3. ✅ Consola (Fallback automático)
- El código se imprime en los logs del backend
- **Funciona para desarrollo**

---

## ✅ Soluciones

### Opción 1: Usar Resend con Email Correcto (RÁPIDO)

Resend ya está configurado pero solo permite enviar al email del propietario de la cuenta.

**Pasos:**
1. Cuando solicites OTP en el frontend, usa este email:
   ```
   eduardocaballero392@gmail.com
   ```

2. El código llegará a esa bandeja de entrada

3. Para otros emails, ve a [resend.com/domains](https://resend.com/domains) y verifica un dominio

---

### Opción 2: Regenerar Contraseña de Gmail (RECOMENDADO)

**Pasos:**

1. Ve a: https://myaccount.google.com/apppasswords

2. Inicia sesión con `carlosluna.enrique@gmail.com`

3. Genera una nueva contraseña de aplicación:
   - **Nombre**: `CRM Backend OTP`
   - Copia la contraseña generada (16 caracteres)

4. Actualiza el `.env`:
   ```env
   EMAIL_USER=carlosluna.enrique@gmail.com
   EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Nueva contraseña (sin espacios)
   ```

5. Reinicia el servidor backend:
   ```bash
   # Presiona Ctrl+C en la terminal del backend
   # Luego ejecuta de nuevo:
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

---

### Opción 3: Usar Código de Consola (TEMPORAL)

Para desarrollo, el código se imprime automáticamente en los logs.

**Pasos:**

1. Solicita el OTP en el frontend con cualquier email

2. Ve a la terminal del backend y busca:
   ```
   ========================================
   💡 [OTP] USA ESTE CÓDIGO MANUALMENTE: 123456
   ⏱️  [OTP] El código expira en 10 minutos
   ========================================
   ```

3. Copia el código e ingrésalo en el frontend

---

## 🧪 Verificar que Funcione

Ejecuta este script de prueba:

```bash
cd CRM_tecnologia_backend
C:\Users\PC\AppData\Local\Programs\Python\Python313\python.exe scratch/test_otp_email.py
```

**Salida esperada si funciona:**
```
[SMTP 587] ✓ Email enviado a carlosluna.enrique@gmail.com
```

**O si usas Resend:**
```
[Resend] ✓ Email enviado a eduardocaballero392@gmail.com — ID: xxx
```

---

## 📝 Notas Adicionales

- **Resend** funciona en Render (producción) porque usa HTTP, no SMTP
- **SMTP Gmail** solo funciona en desarrollo local (Render bloquea puertos 465/587)
- Si ningún método funciona, el código **siempre se imprime en consola** como respaldo
- El código OTP es válido por **10 minutos**
- Cada código es de **uso único**

---

## 🔗 Enlaces Útiles

- [Resend Dashboard](https://resend.com/domains)
- [Gmail App Passwords](https://myaccount.google.com/apppasswords)
- [Supabase (Base de Datos)](https://supabase.com/dashboard)
