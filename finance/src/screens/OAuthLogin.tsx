import React from 'react';
import { Button, View, Text } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { generateCodeVerifier, computeCodeChallenge, exchangeCodeForToken } from '../api/authClient';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthLogin() {
  const [message, setMessage] = React.useState<string | null>(null);

  async function startOAuth() {
    setMessage(null);
    const clientId = process.env.CLIENT_ID || 'mobile-client';
    const base = process.env.PROXY_BASE_URL || 'http://localhost:3000';
    const redirectUri = makeRedirectUri({ useProxy: true });

    try {
      const codeVerifier = await generateCodeVerifier();
      const codeChallenge = await computeCodeChallenge(codeVerifier);

      const authUrl = `${base}/oauth/authorize?` +
        new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256'
        }).toString();

      const result: any = await AuthSession.startAsync({ authUrl });
      if (result.type === 'success' && result.params && result.params.code) {
        const code = result.params.code;
        // exchange code for token
        const tokenResp = await exchangeCodeForToken(code, codeVerifier, redirectUri, clientId, base);
        if (tokenResp && tokenResp.access_token) {
          setMessage('Login successful');
        } else {
          setMessage('Token exchange failed');
        }
      } else if (result.type === 'error') {
        setMessage('Auth error');
      } else {
        setMessage('Auth cancelled');
      }
    } catch (err: any) {
      setMessage(err.message ?? 'OAuth error');
    }
  }

  return (
    <View style={{ marginTop: 8 }}>
      <Button title="Login with OAuth (PKCE)" onPress={startOAuth} />
      {message && <Text style={{ color: '#fff', marginTop: 8 }}>{message}</Text>}
    </View>
  );
}
