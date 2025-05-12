import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, TextInput, Modal, Button } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
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

const workoutTypes = Object.keys(workoutTypeLabels);

export default function MyPinsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPin, setEditingPin] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState('general');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchMyPins();
    // eslint-disable-next-line
  }, []);

  const fetchMyPins = async () => {
    setLoading(true);
    try {
      const profileRes = await fetch(`${API_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profile = await profileRes.json();
      const addedSpots = profile.added_spots || [];

      if (!Array.isArray(addedSpots) || addedSpots.length === 0) {
        setPins([]);
        setLoading(false);
        return;
      }

      const spotsRes = await fetch(`${API_URL}/workout-spots/by-ids`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: addedSpots })
      });
      if (!spotsRes.ok) throw new Error('Failed to fetch spots');
      const spots = await spotsRes.json();
      setPins(spots);
    } catch (e) {
      console.log('Error in fetchMyPins:', e);
      setPins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (pinId) => {
    Alert.alert(
      'Delete Pin',
      'Are you sure you want to delete this pin?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              setLoading(true);
              const res = await fetch(`${API_URL}/workout-spots/${pinId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (!res.ok) throw new Error('Failed to delete');
              await fetchMyPins();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete pin.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const openEditModal = (pin) => {
    setEditingPin(pin);
    setEditDescription(pin.description);
    setEditType(pin.type);
    setModalVisible(true);
  };

  const handleEditSave = async () => {
    if (!editingPin) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/workout-spots/${editingPin._id || editingPin.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: editDescription,
          type: editType
        })
      });
      if (!res.ok) throw new Error('Failed to update');
      setModalVisible(false);
      setEditingPin(null);
      await fetchMyPins();
    } catch (e) {
      Alert.alert('Error', 'Failed to update pin.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinPress = (pin) => {
    router.push(`/spot-detail/${pin._id || pin.id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>My Pin Locations</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#6c5b91" style={{ marginTop: 40 }} />
        ) : pins.length === 0 ? (
          <Text style={styles.emptyText}>No pins yet. Go pin a workout spot!</Text>
        ) : (
          pins.map((pin, idx) => (
            <TouchableOpacity
              key={pin.id || pin._id || idx}
              style={styles.pinCard}
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
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(pin)}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { marginLeft: 16 }]} onPress={() => handleDelete(pin._id || pin.id)}>
                  <Text style={[styles.actionText, { color: '#ff6f61' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
      <NavBar current="my-pins" />

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Pin</Text>
            <TextInput
              style={styles.input}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Description"
            />
            <Text style={{ marginTop: 8, marginBottom: 4 }}>Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {workoutTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeBtn,
                    editType === type && { backgroundColor: workoutTypeColors[type] }
                  ]}
                  onPress={() => setEditType(type)}
                >
                  <Text style={{ color: editType === type ? '#fff' : '#333' }}>
                    {workoutTypeLabels[type]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <View style={{ width: 12 }} />
              <Button title="Save" onPress={handleEditSave} color="#6c5b91" />
            </View>
          </View>
        </View>
      </Modal>
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
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  actionText: {
    color: '#6c5b91',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#6c5b91',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginRight: 8,
  },
});