import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import NavBar from '../components/NavBar';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

const API_URL = 'https://3b46-2405-9800-b670-aedc-1982-971a-9619-e34d.ngrok-free.app';

export default function ProfileScreen() {
  const { token, setToken } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pwErrorMsg, setPwErrorMsg] = useState('');
  const [pwSuccessMsg, setPwSuccessMsg] = useState('');

  // Fetch user data on mount and when token changes
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setErrorMsg('');
        if (!token) {
          setErrorMsg('Not logged in.');
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          setErrorMsg('Failed to load profile.');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
      } catch (e) {
        setErrorMsg('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [token]);

  // Update name/email only
  const handleApplyChange = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!firstName || !lastName || !email) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      if (!token) {
        setErrorMsg('Not logged in.');
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_URL}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Profile updated successfully! Logging out...');
        setTimeout(() => {
          setToken(null);
          router.replace('/login');
        }, 1200);
      } else {
        setErrorMsg(data.detail || 'Failed to update profile.');
      }
    } catch (e) {
      setErrorMsg('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  // Change password only
  const handleChangePassword = async () => {
    setPwErrorMsg('');
    setPwSuccessMsg('');
    if (!password || !newPassword || !confirmPassword) {
      setPwErrorMsg('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErrorMsg('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      if (!token) {
        setPwErrorMsg('Not logged in.');
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_URL}/profile/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: password,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwSuccessMsg('Password changed! Logging out...');
        setTimeout(() => {
          setToken(null);
          router.replace('/login');
        }, 1200);
      } else {
        setPwErrorMsg(data.detail || 'Failed to change password.');
      }
    } catch (e) {
      setPwErrorMsg('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  // Log out
  const handleLogout = () => {
    setToken(null);
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Profile</Text>

        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
        />

        {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
        {successMsg ? <Text style={styles.successMsg}>{successMsg}</Text> : null}

        <TouchableOpacity style={styles.applyButton} onPress={handleApplyChange} disabled={loading}>
          <Text style={styles.applyButtonText}>{loading ? 'Applying...' : 'Apply Change'}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.title2}>Change Password</Text>
        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter current password"
          secureTextEntry
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
          secureTextEntry
        />

        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          secureTextEntry
        />

        {pwErrorMsg ? <Text style={styles.errorMsg}>{pwErrorMsg}</Text> : null}
        {pwSuccessMsg ? <Text style={styles.successMsg}>{pwSuccessMsg}</Text> : null}

        <TouchableOpacity style={styles.applyButton} onPress={handleChangePassword} disabled={loading}>
          <Text style={styles.applyButtonText}>{loading ? 'Applying...' : 'Change Password'}</Text>
        </TouchableOpacity>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>
      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 24,
  },
  title2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 32,
    marginBottom: 16,
    color: '#6c5b91',
    alignSelf: 'flex-start',
  },
  label: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
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
  successMsg: {
    color: 'green',
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 'bold',
  },
  applyButton: {
    width: '100%',
    backgroundColor: '#6c5b91',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 24,
  },
});