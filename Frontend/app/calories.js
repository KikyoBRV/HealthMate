import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CaloriesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calories Burned Calculation</Text>
      {/* Add your calculation UI here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});