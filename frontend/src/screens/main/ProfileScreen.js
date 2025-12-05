/**
 * Profile Screen
 * User profile and settings
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Theme
import { theme } from '../../theme/theme';

export default function ProfileScreen({ navigation }) {
  const handleLogout = () => {
    // TODO: Implement logout
    navigation.navigate('Welcome');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary.dark, theme.colors.accent.purple]}
        style={styles.header}
      >
        <Text style={styles.avatar}>👤</Text>
        <Text style={styles.name}>Player Name</Text>
        <Text style={styles.email}>player@example.com</Text>
        <Text style={styles.level}>Level 25</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>Edit Profile</Text>
          </View>
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>Change Password</Text>
          </View>
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>Notifications</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Settings</Text>
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>Division Selection</Text>
          </View>
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>Audio Settings</Text>
          </View>
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>Graphics Settings</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatar: {
    fontSize: 64,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 5,
  },
  level: {
    fontSize: 14,
    color: theme.colors.accent.gold,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 15,
  },
  menuItem: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  menuText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  logoutButton: {
    backgroundColor: theme.colors.status.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
  },
});