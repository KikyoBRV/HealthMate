import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const API_URL = 'https://3b46-2405-9800-b670-aedc-1982-971a-9619-e34d.ngrok-free.app';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Account created! Please log in.');
        router.replace('/login');
      } else {
        setErrorMsg(data.detail || 'Registration failed');
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
      <Text style={styles.title}>Sign Up</Text>

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

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.signupButton} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.signupButtonText}>{loading ? 'Signing up...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      {/* Back to Login */}
      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={styles.backToLogin}>Back to Login</Text>
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
  signupButton: {
    width: '100%',
    backgroundColor: '#6c5b91',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToLogin: {
    color: '#6c5b91',
    fontWeight: 'bold',
    marginTop: 16,
    fontSize: 13,
  },
});