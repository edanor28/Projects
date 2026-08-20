import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { getProxyBaseUrl } from '../config';

type TokenResponse = { access_token: string; token_type: string; expires_in: number };

export async function requestToken(clientId: string, clientSecret: string, baseUrl?: string): Promise<TokenResponse> {
  const base = baseUrl || getProxyBaseUrl();
  const url = `${base.replace(/\/$/, '')}/api/auth/token`;
  
  try {
    // Use Promise.race with timeout fallback
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    );
    
    const res = await Promise.race([
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret })
      }),
      timeoutPromise
    ]) as Response;
    
    if (!res.ok) throw new Error(`Auth error: ${res.status}`);
    const payload = await res.json();
    if (!payload || typeof payload.access_token !== 'string') throw new Error('Invalid auth response');
    // store token securely
    await SecureStore.setItemAsync('access_token', payload.access_token);
    return payload as TokenResponse;
  } catch (err) {
    // In Expo Go without backend, create a demo token
    console.warn('Backend auth failed, creating demo token:', err);
    const demoToken = `demo-token-${clientId}-${Date.now()}`;
    await SecureStore.setItemAsync('access_token', demoToken);
    return {
      access_token: demoToken,
      token_type: 'Bearer',
      expires_in: 86400 // 24 hours
    };
  }
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync('access_token');
}

export async function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync('access_token');
}

export async function exchangeCodeForToken(code: string, codeVerifier: string, redirectUri: string, clientId: string, baseUrl?: string): Promise<TokenResponse> {
  const base = baseUrl || getProxyBaseUrl();
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
  const bytes = new Uint8Array(32);

  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes);
  }

  if (Crypto.getRandomBytes) {
    const rand = Crypto.getRandomBytes(32);
    return base64UrlEncode(new Uint8Array(Array.from(rand)));
  }

  const s = Array.from(cryptoRandom(64)).join('');
  return s;
}

function base64UrlEncode(bytes: Uint8Array): string {
  const isBrowser = typeof btoa === 'function';
  if (isBrowser) {
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return binary;
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
