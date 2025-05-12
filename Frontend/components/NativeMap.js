import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

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

export default function NativeMap({ pins, style, selectedLat, selectedLng, userLocation, onMapPress }) {
  // Center on selected pin, else user location, else first pin, else Bangkok
  const lat =
    selectedLat ??
    (userLocation ? userLocation.latitude : null) ??
    (pins.length > 0 ? pins[0].latitude : 13.7563);
  const lng =
    selectedLng ??
    (userLocation ? userLocation.longitude : null) ??
    (pins.length > 0 ? pins[0].longitude : 100.5018);

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        region={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={e => {
          if (onMapPress) {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            onMapPress({ latitude, longitude });
          }
        }}
      >
        {/* Show all pins */}
        {pins.map((pin, idx) => (
          <Marker
            key={pin.id || `${pin.latitude},${pin.longitude},${idx}`}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            pinColor="red"
          >
            <Callout>
              <View>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {workoutTypeLabels[pin.type] || 'Workout Spot'}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
        {/* Show the selected pin */}
        {selectedLat && selectedLng && (
          <Marker
            coordinate={{ latitude: selectedLat, longitude: selectedLng }}
            pinColor="blue"
            title="Selected Location"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
  },
});