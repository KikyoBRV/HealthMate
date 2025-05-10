import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const navItems = [
  { label: 'Home', route: '/calories', icon: 'home-outline' },
  { label: 'Calories', route: '/calories', icon: 'flame-outline' },
  { label: 'Nutrient', route: '/nutrient', icon: 'nutrition-outline' },
  { label: 'Profile', route: '/profile', icon: 'person-outline' },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.navBar}>
      {navItems.map(item => (
        <TouchableOpacity
          key={item.route}
          style={styles.navItem}
          onPress={() => router.push(item.route)}
        >
          <Ionicons
            name={item.icon}
            size={24}
            color={pathname === item.route ? '#6c5b91' : '#aaa'}
          />
          <Text style={[styles.label, pathname === item.route && styles.labelActive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  labelActive: {
    color: '#6c5b91',
    fontWeight: 'bold',
  },
});