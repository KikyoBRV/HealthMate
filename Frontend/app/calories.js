import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import NavBar from '../components/NavBar';

const HEART_RATE_ZONES = [
  { label: 'Zone 1 (Very Light)\n50–60% of max HR (~95-114 bpm)', value: 1, met: 3.0 },
  { label: 'Zone 2 (Light)\n60–70% of max HR (~115-133 bpm)', value: 2, met: 4.0 },
  { label: 'Zone 3 (Moderate)\n70–80% of max HR (~134-152 bpm)', value: 3, met: 5.0 },
  { label: 'Zone 4 (Hard)\n80–90% of max HR (~153-171 bpm)', value: 4, met: 6.0 },
  { label: 'Zone 5 (Maximum Effort)\n90–100% of max HR (~172-190+ bpm)', value: 5, met: 8.0 },
];

const DEFAULT_WEIGHT = 70; // kg

export default function CaloriesScreen() {
  const [duration, setDuration] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [calories, setCalories] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = () => {
    setErrorMsg('');
    setCalories(null);

    const durationNum = parseFloat(duration);
    if (!durationNum || durationNum <= 0) {
      setErrorMsg('Please enter a valid workout duration.');
      return;
    }
    if (!selectedZone) {
      setErrorMsg('Please select a heart rate zone.');
      return;
    }

    const met = HEART_RATE_ZONES.find(z => z.value === selectedZone).met;
    const caloriesBurned = durationNum * met * DEFAULT_WEIGHT * 0.0175;
    setCalories(caloriesBurned.toFixed(2));
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Calories Burned Calculation</Text>

        <Text style={styles.label}>Workout Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter duration"
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Heart Rate Zone</Text>
        <View style={styles.zonesContainer}>
          {HEART_RATE_ZONES.map(zone => (
            <TouchableOpacity
              key={zone.value}
              style={[
                styles.zoneButton,
                selectedZone === zone.value && styles.zoneButtonSelected,
              ]}
              onPress={() => setSelectedZone(zone.value)}
            >
              <Text
                style={[
                  styles.zoneText,
                  selectedZone === zone.value && styles.zoneTextSelected,
                ]}
              >
                {zone.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>

        {calories && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Calories Burned:</Text>
            <Text style={styles.resultValue}>{calories} kcal</Text>
          </View>
        )}
      </ScrollView>
      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 100, // To avoid overlap with NavBar
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
  zonesContainer: {
    width: '100%',
    marginBottom: 16,
  },
  zoneButton: {
    borderWidth: 1,
    borderColor: '#6c5b91',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  zoneButtonSelected: {
    backgroundColor: '#6c5b91',
  },
  zoneText: {
    color: '#6c5b91',
    fontSize: 14,
    textAlign: 'left',
  },
  zoneTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorMsg: {
    color: 'red',
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 'bold',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#6c5b91',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c5b91',
  },
  resultValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6c5b91',
    marginTop: 8,
  },
});