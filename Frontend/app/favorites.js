import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';

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

const workoutTypeColors = {
  general: '#6c5b91',
  running: '#ff6f61',
  cycling: '#4fc3f7',
  swimming: '#00bfae',
  yoga: '#a3d9a5',
  team_sports: '#ffd54f',
  strength: '#b388ff',
  other: '#bdbdbd',
};

export default function FavoritesScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState({}); // { [spotId]: true/false }

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const data = await res.json();
      setFavorites(data);
    } catch (e) {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [token]);

  const handlePinPress = (pin) => {
    router.push(`/spot-detail/${pin._id || pin.id}`);
  };

  const handleDeleteFavorite = async (pin) => {
    const spotId = pin._id || pin.id;
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this spot from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setDeleting(prev => ({ ...prev, [spotId]: true }));
            try {
              const res = await fetch(`${API_URL}/favorites/${spotId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                fetchFavorites();
              } else {
                Alert.alert('Error', 'Failed to remove from favorites.');
              }
            } catch (e) {
              Alert.alert('Error', 'Failed to remove from favorites.');
            } finally {
              setDeleting(prev => ({ ...prev, [spotId]: false }));
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>My Favorite Spots</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#6c5b91" style={{ marginTop: 40 }} />
        ) : favorites.length === 0 ? (
          <Text style={styles.emptyText}>No favorite spots yet.</Text>
        ) : (
          favorites.map((pin, idx) => (
            <View key={pin.id || pin._id || idx} style={styles.pinCard}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteFavorite(pin)}
                disabled={deleting[pin._id || pin.id]}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handlePinPress(pin)}
                activeOpacity={0.8}
              >
                <View style={[styles.badge, { backgroundColor: workoutTypeColors[pin.type] || '#bdbdbd' }]}>
                  <Text style={styles.badgeText}>{workoutTypeLabels[pin.type] || 'Workout Spot'}</Text>
                </View>
                <Text style={styles.description}>{pin.description || '-'}</Text>
                <Text style={styles.coords}>
                  Lat: {pin.latitude.toFixed(6)}, Lng: {pin.longitude.toFixed(6)}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
      <NavBar current="favorites" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 24,
    color: '#6c5b91',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 40,
  },
  pinCard: {
    width: '100%',
    backgroundColor: '#f8f8fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
  },
  coords: {
    fontSize: 13,
    color: '#888',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    backgroundColor: '#ff6f61',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});