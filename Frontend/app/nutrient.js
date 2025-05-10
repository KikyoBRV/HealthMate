import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Picker, ScrollView } from 'react-native';

const activityLevels = [
  { label: 'Sedentary (little/no exercise)', value: 1.2 },
  { label: 'Light (1-3x/week)', value: 1.375 },
  { label: 'Moderate (3-5x/week)', value: 1.55 },
  { label: 'Active (6-7x/week)', value: 1.725 },
  { label: 'Very Active (hard exercise)', value: 1.9 },
];

const goals = [
  { label: 'Lose Fat', value: 'lose' },
  { label: 'Gain Muscle', value: 'gain' },
  { label: 'Maintain', value: 'maintain' },
];

export default function NutrientScreen() {
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState(activityLevels[2].value); // Default: Moderate
  const [goal, setGoal] = useState('maintain');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCalculate = () => {
    setErrorMsg('');
    setResult(null);

    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (!ageNum || !heightNum || !weightNum) {
      setErrorMsg('Please fill in all fields with valid numbers.');
      return;
    }

    // BMR Calculation
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
    } else {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    }

    // TDEE Calculation
    let tdee = bmr * activity;

    // Goal Adjustment
    let totalCalories = tdee;
    if (goal === 'lose') totalCalories -= 500;
    if (goal === 'gain') totalCalories += 300;

    // Macro Split
    const proteinCal = totalCalories * 0.3;
    const carbCal = totalCalories * 0.4;
    const fatCal = totalCalories * 0.3;

    const proteinGram = proteinCal / 4;
    const carbGram = carbCal / 4;
    const fatGram = fatCal / 9;

    setResult({
      bmr: bmr.toFixed(0),
      tdee: tdee.toFixed(0),
      protein: { gram: proteinGram.toFixed(0), cal: proteinCal.toFixed(0), percent: 30 },
      carb: { gram: carbGram.toFixed(0), cal: carbCal.toFixed(0), percent: 40 },
      fat: { gram: fatGram.toFixed(0), cal: fatCal.toFixed(0), percent: 30 },
      totalCalories: totalCalories.toFixed(0),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nutrient Calculation</Text>

      <Text style={styles.label}>Gender</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}
          onPress={() => setGender('male')}
        >
          <Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}
          onPress={() => setGender('female')}
        >
          <Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>Female</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Height (cm.)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter height"
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Weight (kg.)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter weight"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Exercise Level</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={activity}
          onValueChange={setActivity}
          style={styles.picker}
        >
          {activityLevels.map((item, idx) => (
            <Picker.Item key={idx} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Goal</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={goal}
          onValueChange={setGoal}
          style={styles.picker}
        >
          {goals.map((item, idx) => (
            <Picker.Item key={idx} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>

      {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}

      <TouchableOpacity style={styles.submitButton} onPress={handleCalculate}>
        <Text style={styles.submitButtonText}>Calculate</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result</Text>
          <Text style={styles.resultText}>BMR: {result.bmr} kcal</Text>
          <Text style={styles.resultText}>TDEE: {result.tdee} kcal</Text>
          <Text style={styles.resultText}>Total Calories: {result.totalCalories} kcal</Text>
          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>{result.protein.gram}g / {result.protein.cal} kcal / {result.protein.percent}%</Text>
          </View>
          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Carb</Text>
            <Text style={styles.macroValue}>{result.carb.gram}g / {result.carb.cal} kcal / {result.carb.percent}%</Text>
          </View>
          <View style={styles.macroRow}>
            <Text style={styles.macroLabel}>Fat</Text>
            <Text style={styles.macroValue}>{result.fat.gram}g / {result.fat.cal} kcal / {result.fat.percent}%</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexGrow: 1,
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
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#6c5b91',
    borderRadius: 20,
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#6c5b91',
  },
  genderText: {
    color: '#6c5b91',
    fontSize: 16,
    fontWeight: 'bold',
  },
  genderTextSelected: {
    color: '#fff',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    marginBottom: 8,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 40,
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
    width: '100%',
    backgroundColor: '#f3f0fa',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c5b91',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  macroLabel: {
    fontWeight: 'bold',
    color: '#6c5b91',
    fontSize: 16,
    flex: 1,
  },
  macroValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
});