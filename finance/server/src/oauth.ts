import express from 'express';
import crypto from 'crypto';
import querystring from 'querystring';
import jwt from 'jsonwebtoken';

// Minimal OAuth2 Authorization Server with PKCE support (for development).
// IMPORTANT: For production use a real IdP (Auth0, Cognito, Keycloak).

const router = express.Router();

type AuthCode = {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method?: string;
  scope?: string;
  createdAt: number;
};

// In-memory store for auth codes (DEV ONLY)
const codes = new Map<string, AuthCode>();

// GET /oauth/authorize?response_type=code&client_id=...&redirect_uri=...&code_challenge=...&code_challenge_method=S256
router.get('/authorize', (req, res) => {
  const { response_type, client_id, redirect_uri, code_challenge, code_challenge_method, scope, state } = req.query as any;
  if (!response_type || response_type !== 'code' || !client_id || !redirect_uri || !code_challenge) {
    return res.status(400).send('Invalid request');
  }

  // Render a simple login/consent form (POST back to /oauth/authorize)
  const html = `
    <html><body>
      <h2>Login (Dev OAuth)</h2>
      <form method="POST" action="/oauth/authorize">
        <input type="hidden" name="client_id" value="${escape(client_id)}" />
        <input type="hidden" name="redirect_uri" value="${escape(redirect_uri)}" />
        <input type="hidden" name="code_challenge" value="${escape(code_challenge)}" />
        <input type="hidden" name="code_challenge_method" value="${escape(code_challenge_method || 'S256')}" />
        <input type="hidden" name="scope" value="${escape(scope || '')}" />
        <input type="hidden" name="state" value="${escape(state || '')}" />
        <label>Username: <input name="username" /></label><br/>
        <label>Password: <input name="password" type="password"/></label><br/>
        <button type="submit">Authorize</button>
      </form>
    </body></html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// POST /oauth/authorize - accepts login, issues auth code and redirects
router.post('/authorize', express.urlencoded({ extended: false }), (req, res) => {
  const { client_id, redirect_uri, code_challenge, code_challenge_method, scope, state, username, password } = req.body as any;

  // Very basic auth: accept any username/password in dev but validate client
  const cfgId = process.env.CLIENT_ID;
  if (!cfgId || cfgId !== client_id) return res.status(400).send('Unknown client');

  // Generate auth code
  const code = crypto.randomBytes(24).toString('hex');
  codes.set(code, { client_id, redirect_uri, code_challenge, code_challenge_method, scope, createdAt: Date.now() });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.search = querystring.stringify({ code, state });
  res.redirect(redirectUrl.toString());
});

// Token endpoint: exchange code + code_verifier for token
router.post('/token', express.json(), (req, res) => {
  const { grant_type, code, redirect_uri, code_verifier, client_id } = req.body || {};
  if (grant_type !== 'authorization_code') return res.status(400).json({ error: 'unsupported_grant_type' });
  if (!code || !code_verifier) return res.status(400).json({ error: 'invalid_request' });

  const stored = codes.get(code);
  if (!stored) return res.status(400).json({ error: 'invalid_grant' });
  if (stored.client_id !== client_id) return res.status(400).json({ error: 'invalid_client' });
  if (stored.redirect_uri !== redirect_uri) return res.status(400).json({ error: 'invalid_request' });

  // Validate PKCE: code_challenge is base64url(SHA256(code_verifier))
  const hash = crypto.createHash('sha256').update(code_verifier).digest();
  const b64 = hash.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (b64 !== stored.code_challenge) return res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });

  // Issue JWT
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return res.status(500).json({ error: 'server_error' });
  const expiresIn = 15 * 60; // 15 minutes
  const token = jwt.sign({ sub: client_id, scope: stored.scope || 'categorize' }, jwtSecret, { algorithm: 'HS256', expiresIn });

  // remove code to prevent replay
  codes.delete(code);

  return res.json({ access_token: token, token_type: 'Bearer', expires_in: expiresIn });
});

export default router;
