import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import NavBar from '../components/NavBar';
import NativeMap from '../components/NativeMap';

const API_URL = 'https://3b46-2405-9800-b670-aedc-1982-971a-9619-e34d.ngrok-free.app';

export default function WorkoutSpotScreen() {
  const { token } = useAuth();
  const router = useRouter();

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [description, setDescription] = useState('');
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get current location on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission to access location was denied');
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        setLatitude(location.coords.latitude.toString());
        setLongitude(location.coords.longitude.toString());
      }
    })();
    fetchPins();
    // eslint-disable-next-line
  }, []);

  const fetchPins = async () => {
    try {
      const res = await fetch(`${API_URL}/workout-spots`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPins(data);
      }
    } catch (e) {}
  };

  const handlePin = async () => {
    if (!latitude || !longitude || !description) {
      Alert.alert('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/workout-spots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          description,
        }),
      });
      if (res.ok) {
        setLatitude('');
        setLongitude('');
        setDescription('');
        fetchPins();
        Alert.alert('Pinned successfully!');
      } else {
        Alert.alert('Failed to pin location.');
      }
    } catch (e) {
      Alert.alert('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  // Called when user taps on the map (Android/iOS)
  const handleMapPress = (coord) => {
    setLatitude(coord.latitude.toString());
    setLongitude(coord.longitude.toString());
  };

  const handlePinPress = (pin) => {
    router.push({ pathname: '/favorites', params: { pinId: pin.id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Workout Spot</Text>
        <Text style={styles.label}>Latitude</Text>
        <TextInput
          style={styles.input}
          value={latitude}
          onChangeText={setLatitude}
          placeholder="Latitude"
          keyboardType="numeric"
        />
        <Text style={styles.label}>Longitude</Text>
        <TextInput
          style={styles.input}
          value={longitude}
          onChangeText={setLongitude}
          placeholder="Longitude"
          keyboardType="numeric"
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
        />
        <TouchableOpacity style={styles.pinButton} onPress={handlePin} disabled={loading}>
          <Text style={styles.pinButtonText}>{loading ? 'Pinning...' : 'Pin'}</Text>
        </TouchableOpacity>

        <View style={styles.mapContainer}>
          <NativeMap
            pins={pins}
            style={styles.map}
            selectedLat={latitude ? parseFloat(latitude) : null}
            selectedLng={longitude ? parseFloat(longitude) : null}
            onMapPress={handleMapPress}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/my-pins')}>
            <Text style={styles.secondaryButtonText}>My Pin Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/favorites')}>
            <Text style={styles.secondaryButtonText}>Favorites</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'flex-start',
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 24,
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
  pinButton: {
    width: '100%',
    backgroundColor: '#6c5b91',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  pinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#eee',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  secondaryButtonText: {
    color: '#6c5b91',
    fontSize: 16,
    fontWeight: 'bold',
  },
});