import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

// Import komponen reusable
import AuthInput from '../../components/common/AuthInput';
import AuthButton from '../../components/common/AuthButton';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Panggil fungsi login dari Context
      const result = await login(email, password);
      
      if (result.success) {
        console.log("Login Success! Waiting for App.js to switch navigator...");
        // [FIX] JANGAN NAVIGASI MANUAL DI SINI.
        // Biarkan App.js mendeteksi perubahan user dan mengganti stack secara otomatis.
      } else {
        // Error sudah di-alert di AuthContext, tapi boleh double check
      }
    } catch (error) {
      console.error("Login Screen Error:", error);
      Alert.alert('Error', 'An unexpected error occurred during login.');
    } finally {
      // Kita set loading false hanya jika gagal. 
      // Jika sukses, komponen ini akan unmount, jadi state update tidak masalah (atau bisa dicek mounted).
      setIsLoading(false); 
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Background Premium */}
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
          colors={['rgba(245, 158, 11, 0.1)', 'transparent']}
          style={[StyleSheet.absoluteFillObject, { top: -300, transform: [{ rotate: '-30deg' }] }]}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          
          <View style={styles.headerContainer}>
            <Text style={styles.titleText}>Welcome Back</Text>
            <Text style={styles.subtitleText}>Sign in to manage your team.</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <AuthInput
              icon="mail-outline"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <AuthInput
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <AuthButton 
                title={isLoading ? "SIGNING IN..." : "LOGIN"} 
                onPress={handleLogin} 
                isLoading={isLoading}
            />
          </View>

          {/* Register Link */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
              <Text style={styles.linkText}>Register Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

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
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: 1,
    textShadowColor: 'rgba(245, 158, 11, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  formContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  linkText: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;