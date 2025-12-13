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
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext'; // Import Logic Auth

// Pastikan komponen ini ada (kita sudah buat sebelumnya)
import AuthInput from '../../components/common/AuthInput';
import AuthButton from '../../components/common/AuthButton';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { register } = useAuth(); // Pakai fungsi register dari AuthContext

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // 1. Validasi Input
    if (!username || !email || !password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
    }
    if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
    }
    if (password.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters');
        return;
    }

    setIsLoading(true);

    try {
        // 2. Panggil API Register via Context
        const result = await register({
            username,
            email,
            password
        });

        if (result.success) {
            Alert.alert(
                'Success', 
                'Account created successfully!', 
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } else {
            // Error ditangani di Context, tapi kita alert lagi untuk safety
            // Alert.alert('Registration Failed', result.error); 
        }
    } catch (error) {
        console.error("Register Screen Error:", error);
        Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* --- BACKGROUND PREMIUM --- */}
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
          
          {/* --- HEADER --- */}
          <View style={styles.headerContainer}>
            <Text style={styles.titleText}>Esport Manager</Text>
            <Text style={styles.subtitleText}>Start your journey here.</Text>
          </View>

          {/* --- FORM CONTAINER (GLASSMORPHISM) --- */}
          <View style={styles.formContainer}>
            <AuthInput
              icon="person-outline"
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
            />
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
            <AuthInput
              icon="lock-closed-outline"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <AuthButton 
                title={isLoading ? "CREATING..." : "CREATE ACCOUNT"}
                onPress={handleRegister} 
                isLoading={isLoading}
            />
          </View>

          {/* --- FOOTER LINK --- */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.linkText}>Login Here</Text>
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
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 30,
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
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // Efek kaca gelap
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
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
    color: '#facc15', // Warna Emas
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;