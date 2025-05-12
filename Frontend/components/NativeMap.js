import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function NativeMap({ pins, style, selectedLat, selectedLng, onMapPress }) {
  // Center on selected pin or Bangkok
  const lat = selectedLat ?? (pins.length > 0 ? pins[0].latitude : 13.7563);
  const lng = selectedLng ?? (pins.length > 0 ? pins[0].longitude : 100.5018);

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
            key={idx}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            title={pin.description}
          />
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