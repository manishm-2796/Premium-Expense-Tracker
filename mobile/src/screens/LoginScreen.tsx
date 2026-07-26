import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(email, password);
      await login(response.data.access_token, response.data.user);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.detail || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const mockEmail = `user.${provider}@example.com`;
      const response = await authService.signup(mockEmail, 'social_pass_123'); // Or social auth endpoint
      await login(response.data.access_token, response.data.user);
    } catch (err: any) {
      setErrorMsg(`Failed to connect with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expense Tracker</Text>
      <Text style={styles.subtitle}>Welcome back!</Text>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.socialGrid}>
        <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#ea4335' }]} onPress={() => handleSocialLogin('Google')}>
          <Text style={styles.socialBtnText}>Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1877f2' }]} onPress={() => handleSocialLogin('Facebook')}>
          <Text style={styles.socialBtnText}>Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#e1306c' }]} onPress={() => handleSocialLogin('Instagram')}>
          <Text style={styles.socialBtnText}>Instagram</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#000000' }]} onPress={() => handleSocialLogin('X')}>
          <Text style={styles.socialBtnText}>X</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.linkContainer}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4f46e5',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    gap: 12,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    paddingHorizontal: 8,
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  socialBtn: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  socialBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#4f46e5',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  }
});
