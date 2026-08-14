import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { sanitizeText } from './utils/validation';
import { initDatabase } from './db/database';
import { seedSampleData } from './db/seed';
import { registerBackgroundFetchAsync } from './utils/backgroundFetch';
import { categorizeViaProxy } from './api/proxyClient';
import LoginScreen from './screens/Login';
import OAuthLogin from './screens/OAuthLogin';
import { getStoredToken } from './api/authClient';

export default function App(): JSX.Element {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function start() {
      setStatus('loading');
      try {
        let db;
        try {
          db = await initDatabase();
        } catch (e) {
          console.warn('Native DB init failed, falling back to in-memory DB', e);
          // lazy-import to avoid circular issues
          const mod = await import('./db/database');
          db = await mod.initInMemoryDatabase();
        }
        await seedSampleData(db);

        // If a proxy is configured and a dev token is present, attempt a sample categorize
        const proxyBase = process.env.PROXY_BASE_URL;
        const devToken = process.env.DEV_AUTH_TOKEN; // for local development only
        if (proxyBase && devToken) {
          try {
            const txs = await db.collections.get('transactions').query().fetch();
            if (txs.length > 0) {
              const t: any = txs[0];
              const res = await categorizeViaProxy({ id: String(t.id), amount: Number(t.amount), date: Number(t.date), raw_description: String(t.raw_description) }, devToken);
              console.log('Sample categorize result:', res);
            }
          } catch (e) {
            console.warn('Proxy categorize failed (dev):', e);
          }
        }

        if (mounted) setStatus('ready');
        // register background fetch (best-effort)
        try {
          const ok = await registerBackgroundFetchAsync();
          console.log('Background fetch registered:', ok);
        } catch (e) {
          console.warn('Background fetch registration failed', e);
        }
      } catch (err: any) {
        if (mounted) {
          setErrMsg(err.message ?? String(err));
          setStatus('error');
        }
      }
    }
    start();
    return () => { mounted = false; };
  }, []);

  const raw = '<script>alert(1)</script>Compra supermercado';
  const safe = sanitizeText(raw);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Asistente Financiero</Text>
      {status === 'loading' && <ActivityIndicator size="large" color="#00ffcc" />}
      {status === 'ready' && <Text style={styles.text}>Base inicializada y datos sembrados.</Text>}
      {status === 'error' && (
        <Text style={styles.error}>Error al inicializar: {errMsg}</Text>
      )}
      <AuthArea />
      <Text style={styles.text}>Ejemplo sanitizado: {safe}</Text>
    </SafeAreaView>
  );
}

function AuthArea() {
  const [token, setToken] = React.useState<string | null>(null);
  React.useEffect(() => {
    let mounted = true;
    getStoredToken().then(t => { if (mounted) setToken(t); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  if (token) return <Text style={{ color: '#0f0' }}>Autenticado</Text>;
  return (
    <>
      <LoginScreen onSuccess={() => getStoredToken().then(t => { /* trigger re-render */ })} />
      <OAuthLogin />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: 16 },
  title: { color: '#fff', fontSize: 20, marginBottom: 12 },
  text: { color: '#fff', marginTop: 8 },
  error: { color: '#ff6666', marginTop: 8 }
});
