import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { categorizeWithGemini } from './geminiProxy';
import authRouter from './auth';
import oauthRouter from './oauth';

dotenv.config();

const app = express();
app.use(helmet());
app.use(express.json({ limit: '8kb' }));

const allowedOrigin = process.env.CORS_ORIGIN || '';
app.use(cors({ origin: allowedOrigin || false }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use(limiter);

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (process.env.DISABLE_AUTH === '1') return next();
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice(7);
  const publicKey = process.env.JWT_PUBLIC_KEY;
  const secret = process.env.JWT_SECRET;
  try {
    if (publicKey) {
      jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    } else if (secret) {
      jwt.verify(token, secret);
    } else {
      return res.status(401).json({ error: 'No JWT verification configured' });
    }
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post(
  '/api/categorize',
  requireAuth,
  body('id').isString().notEmpty(),
  body('amount').isFloat(),
  body('date').isInt(),
  body('raw_description').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id, amount, date, raw_description } = req.body;
    try {
      const result = await categorizeWithGemini({ id, amount: Number(amount), date: Number(date), raw_description });
      return res.json({ id, category: result.category, confidence: result.confidence });
    } catch (err: any) {
      console.error('categorize error:', err.message ?? err);
      return res.status(502).json({ error: 'Failed to categorize transaction' });
    }
  }
);

// Auth routes
app.use('/api/auth', authRouter);

// OAuth2 endpoints (dev PKCE)
app.use('/oauth', oauthRouter);

const port = Number(process.env.PORT || 3000);

if (require.main === module) {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Proxy server listening on port ${port}`);
  });
}

export default app;
