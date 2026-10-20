# 🚀 Inicio Rápido - Sistema ERP EnterpriseCloud

## ✅ El sistema está LISTO y FUNCIONANDO

Tu sistema ERP completo está operativo en este momento.

---

## 🌐 Acceso Rápido

### 🏠 Página Principal del ERP
```
http://localhost:8000
```
**¡Abre este enlace en tu navegador AHORA!**

Verás una página moderna con:
- 📊 Estadísticas del sistema
- 🎯 8 módulos principales
- 🔗 Botones para documentación y pruebas

### 📚 Documentación API Interactiva
```
http://localhost:8000/docs
```
Prueba todos los 29 endpoints del API

### 📖 ReDoc
```
http://localhost:8000/redoc
```
Documentación técnica completa

---

## 🔐 Credenciales

```
📧 Email:    admin@empresa.com
🔒 Password: Admin123!
```

---

## 📊 Estado del Sistema

```
✅ Servidor:     Corriendo en puerto 8000
✅ Base de datos: SQLite con 37 tablas
✅ API:          29 endpoints operativos
✅ Autenticación: JWT funcionando
✅ Datos:        Seed completo cargado
```

---

## 🎯 Qué Puedes Hacer AHORA

### 1️⃣ Ver la Interfaz Web
- Abre: http://localhost:8000
- Explora las tarjetas de módulos
- Click en "Ver Documentación API"

### 2️⃣ Probar el API
1. Ve a: http://localhost:8000/docs
2. Expande **POST /api/v1/auth/login**
3. Click "Try it out"
4. Pega:
   ```json
   {
     "email": "admin@empresa.com",
     "password": "Admin123!"
   }
   ```
5. Click "Execute"
6. Copia el `access_token`
7. Click el botón "Authorize" (🔒 arriba)
8. Escribe: `Bearer` + espacio + tu token
9. Click "Authorize"
10. ¡Ahora puedes probar TODOS los endpoints!

### 3️⃣ Ver Datos
- **Listar usuarios**: GET /api/v1/usuarios/
- **Ver dashboard**: GET /api/v1/dashboard/resumen
- **Listar productos**: GET /api/v1/productos/
- **Ver estadísticas**: GET /api/v1/productos/estadisticas

---

## 📁 Archivos Importantes

```
📂 erp_enterprisecloud_backend/
   ├── 🌐 public/index.html          ← Página web del ERP
   ├── 🐍 app/main.py                ← Servidor FastAPI
   ├── 💾 erp_enterprisecloud.db     ← Base de datos
   ├── 📖 README.md                  ← Documentación completa
   └── 🚀 INICIO_RAPIDO.md           ← Este archivo
```

---

## 🛑 Detener el Servidor

Si necesitas detener el servidor:
- En la terminal donde corre: **Ctrl + C**
- O cierra la terminal

---

## ▶️ Iniciar el Servidor (si está detenido)

```powershell
cd C:\Users\PC\Pictures\crm_tecnologia\erp_enterprisecloud_backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📞 Necesitas Ayuda?

Lee los archivos:
- `README.md` - Documentación técnica completa
- `ACCESO_SISTEMA_ERP.md` - Guía de acceso detallada

---

## 🎉 ¡Disfruta tu Sistema ERP!

El sistema está 100% funcional y listo para usar.
**Abre http://localhost:8000 y empieza a explorar!**
