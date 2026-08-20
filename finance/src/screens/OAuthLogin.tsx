import React from 'react';
import { Button, View, Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { generateCodeVerifier, computeCodeChallenge, exchangeCodeForToken } from '../api/authClient';
import { getClientId, getProxyBaseUrl } from '../config';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthLogin() {
  const [message, setMessage] = React.useState<string | null>(null);

  async function startOAuth() {
    setMessage(null);
    const clientId = getClientId();
    const base = getProxyBaseUrl();
    const redirectUri = makeRedirectUri({
      scheme: 'asistente-financiero',
      path: 'oauth/callback'
    });

    try {
      const codeVerifier = await generateCodeVerifier();
      const codeChallenge = await computeCodeChallenge(codeVerifier);

      const authUrl = `${base.replace(/\/$/, '')}/oauth/authorize?` +
        new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256'
        }).toString();

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      const params = (result as any)?.params ?? {};

      if (result.type === 'success' && params.code) {
        const code = params.code;
        const tokenResp = await exchangeCodeForToken(code, codeVerifier, redirectUri, clientId, base);
        if (tokenResp && tokenResp.access_token) {
          setMessage('Login successful');
        } else {
          setMessage('Token exchange failed');
        }
      } else if (result.type === 'cancel') {
        setMessage('Auth cancelled');
      } else {
        setMessage('Auth error');
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
