import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = express.Router();

// POST /api/auth/token
// Body: { client_id, client_secret }
// Response: { access_token, token_type, expires_in }
router.post('/token', express.json(), (req, res) => {
  const { client_id, client_secret } = req.body || {};
  const cfgId = process.env.CLIENT_ID;
  const cfgSecret = process.env.CLIENT_SECRET;
  if (!cfgId || !cfgSecret) return res.status(500).json({ error: 'Auth not configured' });
  if (typeof client_id !== 'string' || typeof client_secret !== 'string') return res.status(400).json({ error: 'Invalid request' });

  try {
    // Timing-safe comparison using HMAC digests to avoid length mismatch exceptions
    const hmacKey = process.env.JWT_SECRET || 'dev-hmac-key';
    const idDigestA = crypto.createHmac('sha256', hmacKey).update(client_id).digest();
    const idDigestB = crypto.createHmac('sha256', hmacKey).update(cfgId).digest();
    const secretDigestA = crypto.createHmac('sha256', hmacKey).update(client_secret).digest();
    const secretDigestB = crypto.createHmac('sha256', hmacKey).update(cfgSecret).digest();

    const idMatch = crypto.timingSafeEqual(idDigestA, idDigestB);
    const secretMatch = crypto.timingSafeEqual(secretDigestA, secretDigestB);
    if (!idMatch || !secretMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ error: 'JWT not configured' });

    const expiresIn = 15 * 60; // 15 minutes
    const token = jwt.sign({ sub: client_id, scope: 'categorize' }, jwtSecret, { algorithm: 'HS256', expiresIn });

    return res.json({ access_token: token, token_type: 'Bearer', expires_in: expiresIn });
  } catch (err) {
    return res.status(500).json({ error: 'Auth error' });
  }
});

export default router;
