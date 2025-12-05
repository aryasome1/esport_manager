/**
 * Loading Screen Component
 * Unified loading interface
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Theme
import { theme } from '../../theme/theme';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary.main, theme.colors.accent.purple]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.appName}>eSports Manager</Text>
          <ActivityIndicator
            size="large"
            color={theme.colors.text.inverse}
            style={styles.loader}
          />
          <Text style={styles.message}>{message}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginBottom: 30,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});