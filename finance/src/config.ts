function readExpoValue(name: string, fallback: string): string {
  const env = (globalThis as any)?.process?.env ?? {};
  const expoPublic = env[`EXPO_PUBLIC_${name}`] || env[name] || fallback;
  return typeof expoPublic === 'string' ? expoPublic : fallback;
}

export function getProxyBaseUrl(): string {
  return readExpoValue('PROXY_BASE_URL', 'http://192.168.1.10:3000');
}

export function getClientId(): string {
  return readExpoValue('CLIENT_ID', 'mobile-client');
}

export function getDevAuthToken(): string {
  return readExpoValue('DEV_AUTH_TOKEN', '');
}

export function getGeminiApiUrl(): string {
  return readExpoValue('GEMINI_API_URL', '');
}
