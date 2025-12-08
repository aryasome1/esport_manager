/**
 * Team Setup Screen
 * UI Updated: Removes division selection logic, defaults to Universal Team
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Image, Dimensions, Alert, SafeAreaView, KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/ApiClient';

const { width } = Dimensions.get('window');

export default function TeamSetupScreen({ navigation }) {
  const { user, checkAuthStatus } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [teamShort, setTeamShort] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateTeam = async () => {
    if (!teamName || !teamShort) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Team (Tanpa division_type)
      const teamResponse = await apiClient.post('/api/teams/', {
        name: teamName,
        name_short: teamShort.toUpperCase(),
        // division_type: 'moba' <--- HAPUS INI, backend akan auto-handle
      });

      if (teamResponse.data) {
        Alert.alert('Success', `Team ${teamName} established!`, [
          {
            text: 'Enter HQ',
            onPress: async () => {
                // Refresh profile untuk dapetin team_id baru
                await checkAuthStatus(); 
                // Navigasi ke MainHub (Dorm)
                navigation.replace('MainHub');
            }
          }
        ]);
      }
    } catch (error) {
      console.error(error);
      const msg = error.data?.detail || 'Failed to create team.';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e1b4b', '#0f172a']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          
          <Animatable.View animation="fadeInDown" style={styles.header}>
            <Text style={styles.welcomeText}>WELCOME, MANAGER {user?.username?.toUpperCase()}</Text>
            <Text style={styles.subtitle}>Let's register your eSports Organization</Text>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={300} style={styles.formCard}>
            <Text style={styles.label}>TEAM NAME</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Phantom Gaming" 
              placeholderTextColor="#64748b"
              value={teamName}
              onChangeText={setTeamName}
            />

            <Text style={styles.label}>TAG (2-4 CHARS)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. PHNTM" 
              placeholderTextColor="#64748b"
              maxLength={5}
              autoCapitalize="characters"
              value={teamShort}
              onChangeText={setTeamShort}
            />

            <TouchableOpacity 
              style={styles.createBtn}
              onPress={handleCreateTeam}
              disabled={loading}
            >
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>{loading ? 'ESTABLISHING...' : 'ESTABLISH TEAM'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  header: { marginBottom: 40, alignItems: 'center' },
  welcomeText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#94a3b8', fontSize: 14 },
  formCard: { backgroundColor: 'rgba(30, 41, 59, 0.8)', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#334155' },
  label: { color: '#60a5fa', fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginTop: 15 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#334155', fontWeight: 'bold' },
  createBtn: { marginTop: 30, borderRadius: 8, overflow: 'hidden', elevation: 5 },
  btnGradient: { padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});