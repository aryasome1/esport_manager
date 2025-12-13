/**
 * TacticalTeamScreen
 * Updated UI: Detailed Landscape Card (Reference Style)
 * Theme: Valorant Red/Black
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

import { theme } from '../../theme/theme';
import { apiClient } from '../../services/ApiClient';
import { useAuth } from '../../contexts/AuthContext';

const AGENT_IMAGES = {
    'duelist': 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt213441880cf2cdf9/5f8d6d6f9243ae0f35334c9c/VALORANT_Jett_Red_Crop.jpg',
    'initiator': 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt72491e480629734e/5f8d6d69578430292796e626/VALORANT_Sova_Red_Crop.jpg',
    'controller': 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt12c5b7d602330e70/5f8d6d764726b20f1882ff02/VALORANT_Omen_Red_Crop.jpg',
    'sentinel': 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt6d5598683515865a/5f8d6d62578430292796e622/VALORANT_Cypher_Red_Crop.jpg',
    'default': 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltceaa6cf20d328bd5/5eb7ed0547887958ec95c92d/valorant-wallpaper-22.jpg'
};

export default function TacticalTeamScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTeamData = async () => {
    try {
      const teamId = user?.team_id || 1;
      const response = await apiClient.get(`/api/players/?team_id=${teamId}`);
      if (response.data && response.data.items) {
        const formatted = response.data.items.map(p => ({
            ...p,
            agentImage: AGENT_IMAGES[p.current_role?.toLowerCase()] || AGENT_IMAGES.default,
        }));
        setRoster(formatted);
      }
    } catch (error) {
      console.error("Failed to load tactical roster:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTeamData();
    }, [])
  );

  const renderPlayerCard = ({ item, index }) => (
    <Animatable.View 
        animation="fadeInRight" 
        delay={index * 100} 
        style={styles.cardContainer}
    >
      <View style={styles.card}>
        
        {/* BACKGROUND MAP PATTERN */}
        <Image 
            source={{ uri: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt12563456345/valorant-map-ascent.jpg' }} 
            style={styles.cardBg}
            resizeMode="cover"
        />
        <LinearGradient
            colors={['rgba(15, 23, 42, 0.95)', 'rgba(15, 23, 42, 0.8)']}
            style={styles.bgOverlay}
        />

        {/* CONTENT ROW */}
        <View style={styles.contentRow}>
            
            {/* LEFT: AGENT IMAGE */}
            <TouchableOpacity 
                style={styles.portraitContainer}
                onPress={() => navigation.navigate('PlayerProfile', { player: item })}
            >
                <Image 
                    source={{ uri: item.agentImage }} 
                    style={styles.heroImage} 
                    resizeMode="cover"
                />
                <View style={styles.nameBadge}>
                    <Text style={styles.playerName} numberOfLines={1}>{item.name.toUpperCase()}</Text>
                </View>
            </TouchableOpacity>

            {/* RIGHT: STATS MATRIX */}
            <View style={styles.statsContainer}>
                <View style={styles.headerInfo}>
                    <Text style={styles.roleTitle}>{item.current_role || 'OPERATOR'}</Text>
                    <View style={styles.ovrBadge}>
                         <Text style={styles.ovrText}>{item.ovr}</Text>
                    </View>
                </View>

                {/* Stats Grid - FPS Terms */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>AIM</Text>
                        <Text style={styles.statValue}>{item.tactical_aim || 50}</Text>
                    </View>
                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>SENSE</Text>
                        <Text style={styles.statValue}>{item.tactical_gamesense || 50}</Text>
                    </View>
                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>UTIL</Text>
                        <Text style={styles.statValue}>{Math.round(item.ovr * 0.95)}</Text>
                    </View>
                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>CLUTCH</Text>
                        <Text style={styles.statValue}>{Math.round(item.ovr * 0.85)}</Text>
                    </View>
                </View>

                <Text style={styles.teamName}>PROTOCOL ID: #{item.id}</Text>
            </View>
        </View>

        {/* FOOTER BUTTONS */}
        <View style={styles.footerRow}>
            <View style={styles.divisionLabel}>
                <Text style={styles.divisionText}>{item.name} UNIT</Text>
            </View>
            
            <View style={styles.actionButtons}>
                {/* Button colors matched */}
                <TouchableOpacity style={styles.btnUpgrade}>
                    <Text style={styles.btnText}>TRAIN</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnBench}>
                    <Text style={styles.btnText}>RESERVE</Text>
                </TouchableOpacity>
            </View>
        </View>

      </View>
    </Animatable.View>
  );

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#ff4655" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={roster}
        renderItem={renderPlayerCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); loadTeamData(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  listContent: { padding: 16 },

  // Card Structure
  cardContainer: { marginBottom: 16 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 2, // Sharp corners for FPS
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 5,
  },
  cardBg: { position: 'absolute', width: '100%', height: '100%', opacity: 0.3 },
  bgOverlay: { position: 'absolute', width: '100%', height: '100%' },

  // Content Layout
  contentRow: { flexDirection: 'row', height: 130 },
  
  // Left: Portrait
  portraitContainer: { width: '35%', position: 'relative', borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroImage: { width: '100%', height: '100%' },
  nameBadge: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    backgroundColor: 'rgba(255, 70, 85, 0.9)', // Red background
    paddingVertical: 4, alignItems: 'center',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#fff'
  },
  playerName: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1, fontStyle: 'italic' },

  // Right: Stats
  statsContainer: { flex: 1, padding: 10, justifyContent: 'space-between' },
  headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  roleTitle: { color: '#ff4655', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  ovrBadge: { backgroundColor: '#ff4655', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  ovrText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCol: { width: '48%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' },
  statLabel: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold' },
  statValue: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  teamName: { color: '#64748b', fontSize: 9, fontStyle: 'italic', marginTop: 4, textAlign: 'right' },

  // Footer Buttons
  footerRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: 8, borderTopWidth: 1, borderColor: '#334155' 
  },
  divisionLabel: { flex: 1 },
  divisionText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  actionButtons: { flexDirection: 'row', gap: 8 },
  btnUpgrade: { backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 2 },
  btnBench: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 2 },
  btnText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});