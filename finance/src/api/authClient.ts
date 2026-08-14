import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

type TokenResponse = { access_token: string; token_type: string; expires_in: number };

export async function requestToken(clientId: string, clientSecret: string, baseUrl?: string): Promise<TokenResponse> {
  const base = baseUrl || process.env.PROXY_BASE_URL || 'http://localhost:3000';
  const url = `${base.replace(/\/$/, '')}/api/auth/token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
  });
  if (!res.ok) throw new Error(`Auth error: ${res.status}`);
  const payload = await res.json();
  if (!payload || typeof payload.access_token !== 'string') throw new Error('Invalid auth response');
  // store token securely
  await SecureStore.setItemAsync('access_token', payload.access_token);
  return payload as TokenResponse;
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync('access_token');
}

export async function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync('access_token');
}

export async function exchangeCodeForToken(code: string, codeVerifier: string, redirectUri: string, clientId: string, baseUrl?: string): Promise<TokenResponse> {
  const base = baseUrl || process.env.PROXY_BASE_URL || 'http://localhost:3000';
  const url = `${base.replace(/\/$/, '')}/oauth/token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, code_verifier: codeVerifier, client_id: clientId })
  });
  if (!res.ok) throw new Error(`Token exchange error: ${res.status}`);
  const payload = await res.json();
  if (!payload || typeof payload.access_token !== 'string') throw new Error('Invalid token response');
  await SecureStore.setItemAsync('access_token', payload.access_token);
  return payload as TokenResponse;
}

export async function generateCodeVerifier(): Promise<string> {
  // generate a random 64-char base64url string
  const rand = Crypto.getRandomBytes ? Crypto.getRandomBytes(32) : null;
  if (rand) {
    // expo-crypto doesn't expose getRandomBytes in all runtimes; fallback below
    const arr = Array.from(rand);
    return Buffer.from(arr).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  // fallback: random string
  const s = Array.from(cryptoRandom(64)).join('');
  return s;
}

function cryptoRandom(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]);
}

export async function computeCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 });
  // convert base64 to base64url
  return digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
