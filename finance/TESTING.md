# 🧪 Guía de Prueba - Asistente Financiero

## Credenciales de Prueba para Expo Go

La app está corriendo en **Expo Go** en Windows sin backend real. Aquí están las opciones de prueba:

### Opción 1: Login Manual (Recomendado para Expo Go)

En la pantalla de login, ingresa:

| Campo | Valor |
|-------|-------|
| **Client ID** | `demo-client` |
| **Client Secret** | `demo-secret-key-2026` |

**Resultado**: El login enviará credenciales al proxy en `http://192.168.1.10:3000`. Si no hay servidor, la app fallará gracefully y continuará en modo demo.

---

### Opción 2: OAuth con PKCE

Presiona el botón "Login with OAuth (PKCE)". Esto intenta:
1. Abrir navegador con URL de autorización
2. Redirigir a `asistente-financiero://expo-callback` 
3. Intercambiar código por token

**Nota**: Requiere un servidor OAuth en `http://192.168.1.10:3000/oauth/authorize`

---

### Opción 3: Token de Desarrollo (Dev Token)

Si tienes un servidor backend, configura:

```bash
EXPO_PUBLIC_DEV_AUTH_TOKEN=tu-token-dev-aqui
```

Esto permite:
- Categorización automática de transacciones
- Integración con proxy backend
- Testing sin login manual

---

## Flujo de Prueba en Expo Go

1. **Abre Expo Go** en tu móvil o emulador
2. **Escanea el QR** del terminal (`npx expo start`)
3. **En la pantalla de login**:
   - Prueba opción 1 (manual) primero
   - O presiona "Login with OAuth (PKCE)"
4. **Después del login**:
   - Se inicializa la base de datos (in-memory en Expo Go)
   - Se siembran datos de ejemplo
   - Se muestra pantalla principal de la app

---

## Variables de Entorno (Opcional)

Crea un archivo `.env.local` basado en `.env.local.example`:

```bash
EXPO_PUBLIC_CLIENT_ID=demo-client
EXPO_PUBLIC_CLIENT_SECRET=demo-secret-key-2026
EXPO_PUBLIC_PROXY_BASE_URL=http://192.168.1.10:3000
EXPO_PUBLIC_DEV_AUTH_TOKEN=dev-token-2026
```

Expo carga automáticamente variables con prefijo `EXPO_PUBLIC_`.

---

## Notas Importantes

### ✅ Funciona en Expo Go (Windows)
- ✓ Pantalla de login
- ✓ Base de datos in-memory
- ✓ Datos de ejemplo
- ✓ Validación de entrada
- ✓ UI responsiva

### ⚠️ Limitaciones en Expo Go
- ✗ SQLite nativo (WatermelonDB) - fallback a in-memory
- ✗ Background fetch nativo
- ✗ Algunos permisos nativos

### 🚀 Para iOS Nativo (Requiere Mac)
Cuando tengas Mac con Xcode:
```bash
eas build --platform ios
```
Esto activará SQLite nativo, background tasks y full native support.

---

## ¿Problemas?

**Error "Unable to resolve proxy"**
→ Asegúrate de que `http://192.168.1.10:3000` es accesible desde tu red

**Login falla gracefully**
→ Es normal en Expo Go. La app continuará con base de datos in-memory

**OAuth callback no funciona**
→ Requiere servidor OAuth en `http://192.168.1.10:3000/oauth/authorize`

---

**Versión**: SDK 54 (Expo Go compatible)  
**React Native**: 0.81.5  
**Modo**: Development (sin backend requerido)
