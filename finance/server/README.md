# Finance Proxy (Gemini) - Local Server

This small Express service provides a secure proxy to call Gemini for transaction categorization.

Environment variables (recommended to set via secret manager or CI):
- `GEMINI_API_URL` - Gemini endpoint URL
- `GEMINI_API_KEY` - Gemini API key (sensitive)
- `JWT_PUBLIC_KEY` or `JWT_SECRET` - Used to validate JWT tokens presented by clients
- `CORS_ORIGIN` - Allowed origin for the mobile app
- `PORT` - Server port (default 3000)
- `DISABLE_AUTH=1` - (dev only) disables JWT check

Run locally:
```powershell
cd server
npm install
npm run dev
```

Deployment:
- Deploy to a serverless platform (Vercel, Netlify Functions) or container (Docker) behind HTTPS.
- Ensure `GEMINI_API_KEY` is stored securely (do not expose to the client).
- Restrict inbound traffic to known IPs or use authentication.
