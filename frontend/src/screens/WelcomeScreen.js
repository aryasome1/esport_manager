/**
 * Welcome Screen
 * App entry point and initial welcome interface
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Theme
import { theme } from '../theme/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary.main, theme.colors.accent.purple]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>eSports Manager</Text>
          <Text style={styles.subtitle}>
            Multi-Division Gaming Platform
          </Text>
          <Text style={styles.description}>
            Manage your MOBA and Tactical Shooter teams with advanced draft systems,
            strategic planning, and AI-powered opponents.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚔️</Text>
            <Text style={styles.featureText}>MOBA Division</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Tactical Shooter Division</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🤖</Text>
            <Text style={styles.featureText}>AI Opponents</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>Advanced Analytics</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.registerButton]}
            onPress={handleRegister}
          >
            <Text style={[styles.buttonText, styles.registerText]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: height * 0.1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    marginVertical: 15,
    minWidth: 80,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: theme.colors.text.inverse,
    textAlign: 'center',
    fontWeight: '600',
  },
  actions: {
    paddingBottom: 50,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: theme.colors.accent.gold,
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.text.inverse,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
  },
  registerText: {
    color: theme.colors.text.inverse,
  },
});