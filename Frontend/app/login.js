import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext'; // <-- Import useAuth

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setToken } = useAuth(); // <-- Get setToken from context

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        setToken(data.token); // <-- Save token globally
        router.push('/profile');
      } else {
        setErrorMsg(data.detail || 'Invalid Email or Password');
      }
    } catch (error) {
      setErrorMsg('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* User Icon */}
      <View style={styles.iconContainer}>
        <Image
          source={{ uri: 'https://img.icons8.com/ios-filled/100/000000/user-male-circle.png' }}
          style={styles.icon}
        />
      </View>
      {/* App Name */}
      <Text style={styles.title}>HealthMate</Text>

      {/* Email Input */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* Password Input */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Error Message */}
      {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}

      {/* Sign up Button */}
      <TouchableOpacity onPress={() => router.push('/signup')}>
        <Text style={styles.signup}>Sign up</Text>
      </TouchableOpacity>

      {/* Log in Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
        <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Log in'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  errorMsg: {
    color: 'red',
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 'bold',
  },
  forgot: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 24,
    fontSize: 13,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#6c5b91',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signup: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    color: '#6c5b91',
    fontWeight: 'bold',
    marginBottom: 24,
    fontSize: 13,
  },
});