import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { requestToken } from '../api/authClient';
import OAuthLogin from './OAuthLogin';

export default function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login() {
    setError(null);
    setLoading(true);
    try {
      await requestToken(clientId, clientSecret);
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <TextInput placeholder="Client ID" style={styles.input} value={clientId} onChangeText={setClientId} autoCapitalize="none" />
      <TextInput placeholder="Client Secret" style={styles.input} value={clientSecret} onChangeText={setClientSecret} secureTextEntry />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={loading ? 'Logging in...' : 'Login'} onPress={login} disabled={loading} />
      <OAuthLogin />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', marginBottom: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  title: { fontSize: 22, marginBottom: 12, color: '#9be5a8', fontWeight: '600' },
  error: { color: '#ff6666', marginBottom: 8 }
});
