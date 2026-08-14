**Despliegue y Gestión de Secrets (Resumen)**

Objetivo: desplegar el proxy/authorization server (carpeta `server/`) de forma segura en producción, con secretos gestionados, TLS obligatorio y buenas prácticas de red.

Opciones de despliegue recomendadas
- Serverless (Vercel/Netlify/Cloud Run): fácil de desplegar, escala automáticamente. Recomendado para MVP si no necesitas sockets.
- Contenedor (Docker + Kubernetes/ECS): para control total, mejor para entornos corporativos.

Checklist de seguridad (antes de producción)
- Secrets: almacenar `GEMINI_API_KEY`, `JWT_SECRET`, `CLIENT_SECRET` en un Secret Manager (GCP Secret Manager / AWS Secrets Manager / Azure Key Vault / GitHub Secrets). Nunca en repositorios.
- TLS: usar HTTPS con certificados administrados (Let's Encrypt o proveedor cloud). Forzar HSTS.
- Network: desplegar API detrás de API Gateway o reverse-proxy; permitir IPs conocidas si aplica. Habilitar WAF (Cloudflare, AWS WAF).
- Auth: No exponer endpoints que devuelven secretos; usar Authorization Code + PKCE with a trusted IdP for user flows.
- Rate limiting: mantener `express-rate-limit` y ajustar límites por endpoint.
- Monitoring & Alerting: integrar logs a un servicio centralizado (Datadog, Cloud Logging) y alertas por errores 5xx y exfiltración.
- Dependency scanning: activar Dependabot or Snyk; ejecutar `npm audit` en CI.
- Secrets rotation: plan para rotar claves (GEMINI_API_KEY) con mínima interrupción.
- Least privilege: el servidor debe usar un servicio/role con permisos mínimos (no root, no permisos a recursos no necesarios).

Deploy server (Docker) - pasos rápidos
1. Build production bundle:
   ```bash
   cd server
   npm ci
   npm run build
   ```
2. Build Docker image (local):
   ```bash
   docker build -t finance-proxy:latest -f server/Dockerfile .
   ```
3. Run container (example):
   ```bash
   docker run -e GEMINI_API_URL=... -e GEMINI_API_KEY=... -e JWT_SECRET=... -p 3000:3000 finance-proxy:latest
   ```

Deploy server (Vercel) - pasos rápidos
1. Añadir `server/` como un servicio Serverless en Vercel (o configurar `vercel.json`).
2. Configurar las variables de entorno en el dashboard de Vercel (`GEMINI_API_KEY`, `JWT_SECRET`, `CLIENT_ID`, `CLIENT_SECRET`).
3. Configurar reglas de CORS y orígenes permitidos.

Notas operacionales
- Backup: mantener backups periódicos de la DB cliente si hay sincronización.
- Rollback: usar etiquetas de imagen y estrategias de despliegue (blue/green o canary).
- Cost & Rate: aplicar throttling y circuit breakers para llamadas a Gemini.

Referencias
- WatermelonDB: https://nozbe.github.io/WatermelonDB/
- OAuth2 + PKCE patterns: https://datatracker.ietf.org/doc/html/rfc7636
