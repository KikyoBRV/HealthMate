import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'https://5337-2405-9800-b670-aedc-2c93-adb3-3b53-5d61.ngrok-free.app';

function haversine(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

export default function NearbySpotsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { lat, lng } = useLocalSearchParams();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingFavorite, setAddingFavorite] = useState({});
  const [favoriteIds, setFavoriteIds] = useState([]);

  // Fetch spots and favorites
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all spots
        const res = await fetch(`${API_URL}/workout-spots`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch spots');
        const allSpots = await res.json();
        // Filter spots within 10km
        const filtered = allSpots.filter(spot => {
          const d = haversine(
            parseFloat(lat),
            parseFloat(lng),
            spot.latitude,
            spot.longitude
          );
          return d <= 10;
        });
        setSpots(filtered);

        // Fetch favorites
        const favRes = await fetch(`${API_URL}/favorites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (favRes.ok) {
          const favData = await favRes.json();
          setFavoriteIds(favData.map(fav => fav._id || fav.id));
        } else {
          setFavoriteIds([]);
        }
      } catch (e) {
        setSpots([]);
        setFavoriteIds([]);
      } finally {
        setLoading(false);
      }
    };
    if (lat && lng) fetchData();
  }, [lat, lng, token]);

  const handlePinPress = (pin) => {
    router.push(`/spot-detail/${pin._id || pin.id}`);
  };

  const handleAddFavorite = async (pin) => {
    const spotId = pin._id || pin.id;
    setAddingFavorite(prev => ({ ...prev, [spotId]: true }));
    try {
      const res = await fetch(`${API_URL}/favorites/${spotId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFavoriteIds(prev => [...prev, spotId]);
        Alert.alert('Added to Favorites', 'This spot has been added to your favorites.');
      } else {
        Alert.alert('Error', 'Failed to add to favorites.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to add to favorites.');
    } finally {
      setAddingFavorite(prev => ({ ...prev, [spotId]: false }));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Workout Spots Near Me (10 km)</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#6c5b91" style={{ marginTop: 40 }} />
        ) : spots.length === 0 ? (
          <Text style={styles.emptyText}>No spots found within 10 km.</Text>
        ) : (
          spots.map((pin, idx) => {
            const spotId = pin._id || pin.id || idx;
            const isFavorite = favoriteIds.includes(spotId);
            return (
              <View key={spotId} style={styles.pinCard}>
                <TouchableOpacity
                  style={styles.heartButton}
                  onPress={() => {
                    if (!isFavorite) handleAddFavorite(pin);
                  }}
                  disabled={addingFavorite[spotId] || isFavorite}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={28}
                    color="#ff6f61"
                  />
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
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
      <NavBar current="workout-spot" />
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
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    backgroundColor: 'transparent',
    padding: 4,
  },
});