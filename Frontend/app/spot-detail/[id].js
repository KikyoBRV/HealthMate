import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = 'https://5337-2405-9800-b670-aedc-2c93-adb3-3b53-5d61.ngrok-free.app';

const workoutTypeLabels = {
  general: 'General Fitness',
  running: 'Running',
  cycling: 'Cycling',
  swimming: 'Swimming',
  yoga: 'Yoga',
  team_sports: 'Team Sports',
  strength: 'Strength Training',
  other: 'Other',
};

export default function SpotDetailPage() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpot = async () => {
      try {
        const res = await fetch(`${API_URL}/workout-spots/by-ids`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ids: [id] })
        });
        if (!res.ok) throw new Error('Failed to fetch spot');
        const data = await res.json();
        setSpot(data[0]);
      } catch (e) {
        setSpot(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSpot();
  }, [id, token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6c5b91" />
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#888' }}>Spot not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{workoutTypeLabels[spot.type] || 'Workout Spot'}</Text>
      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{spot.description}</Text>
      <Text style={styles.label}>Latitude:</Text>
      <Text style={styles.value}>{spot.latitude}</Text>
      <Text style={styles.label}>Longitude:</Text>
      <Text style={styles.value}>{spot.longitude}</Text>
      <Text style={styles.label}>Type:</Text>
      <Text style={styles.value}>{workoutTypeLabels[spot.type] || spot.type}</Text>
      <Text style={styles.label}>Added by:</Text>
      <Text style={styles.value}>{spot.user_email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#6c5b91',
    marginBottom: 18,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 12,
    color: '#6c5b91',
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
});