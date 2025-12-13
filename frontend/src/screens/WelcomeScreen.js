/**
 * Welcome Screen
 * App entry point and initial welcome interface
 * REDESIGNED: Premium Dark Mode with Glassmorphism
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  // Komponen Kartu Fitur Kecil
  const FeatureCard = ({ icon, title, delay }) => (
    <View style={styles.featureCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.featureGradient}
      >
        <MaterialCommunityIcons name={icon} size={28} color="#facc15" style={{ marginBottom: 8 }} />
        <Text style={styles.featureText}>{title}</Text>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Utama (Dark Navy) */}
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Aksen Cahaya Emas di Pojok Kiri Atas */}
      <LinearGradient
          colors={['rgba(245, 158, 11, 0.15)', 'transparent']}
          style={[StyleSheet.absoluteFillObject, { height: '60%', transform: [{ skewY: '-15deg' }] }]}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          
          {/* --- HERO SECTION --- */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.logoCircle}
              >
                <MaterialCommunityIcons name="trophy-variant" size={48} color="white" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Esport Manager</Text>
            <Text style={styles.subtitle}>
              Dominate the Arena. Manage the Glory.
            </Text>
            <Text style={styles.description}>
              The ultimate multi-division management simulation. Draft heroes, plan tactics, and defeat AI opponents.
            </Text>
          </View>

          {/* --- FEATURES GRID --- */}
          <View style={styles.featuresGrid}>
            <View style={styles.row}>
              <FeatureCard icon="sword-cross" title="MOBA Division" />
              <FeatureCard icon="crosshairs-gps" title="Tactical FPS" />
            </View>
            <View style={styles.row}>
              <FeatureCard icon="robot" title="AI Opponents" />
              <FeatureCard icon="chart-box-outline" title="Pro Analytics" />
            </View>
          </View>

          {/* --- ACTION BUTTONS --- */}
          <View style={styles.actions}>
            {/* Login Button (Solid Gold) */}
            <TouchableOpacity
              style={styles.loginButtonWrapper}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>SIGN IN</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Register Button (Outline/Glass) */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              activeOpacity={0.7}
            >
              <Text style={styles.registerText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.versionText}>v1.0.0 Alpha</Text>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  
  // Header Styles
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#facc15', // Gold accent
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: '#94a3b8', // Slate grey
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  // Feature Grid Styles
  featuresGrid: {
    marginVertical: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  featureCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureGradient: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Actions Styles
  actions: {
    marginBottom: 10,
  },
  loginButtonWrapper: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  loginButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  registerButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  registerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  versionText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 10,
  }
});