/**
 * MobaRosterScreen
 * Updated UI: Detailed Landscape Card (Reference Style)
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, Dimensions, ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

import { theme } from '../../theme/theme';
import { apiClient } from '../../services/ApiClient';
import { useAuth } from '../../contexts/AuthContext';

const DEFAULT_HERO_IMAGE = 'https://via.placeholder.com/300x400/1e293b/ffffff?text=No+Hero';

export default function MobaRosterScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTeamData = async () => {
    try {
      const teamId = user?.team_id || 1;
      const response = await apiClient.get(`/api/players/?team_id=${teamId}`);
      if (response.data && response.data.items) {
        setRoster(response.data.items);
      }
    } catch (error) {
      console.error("Failed to load MOBA roster:", error);
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
        animation="fadeInUp" 
        delay={index * 100} 
        style={styles.cardContainer}
    >
      <View style={styles.card}>
        
        {/* BACKGROUND MAP PATTERN */}
        <Image 
            source={{ uri: 'https://img.freepik.com/free-vector/blue-futuristic-networking-technology_53876-100679.jpg' }} // Mock Map Bg
            style={styles.cardBg}
            resizeMode="cover"
        />
        <LinearGradient
            colors={['rgba(15, 23, 42, 0.9)', 'rgba(15, 23, 42, 0.7)']}
            style={styles.bgOverlay}
        />

        {/* CONTENT ROW */}
        <View style={styles.contentRow}>
            
            {/* LEFT: HERO IMAGE (Portrait) */}
            <TouchableOpacity 
                style={styles.portraitContainer}
                onPress={() => navigation.navigate('PlayerProfile', { player: item })}
            >
                <Image 
                    source={{ uri: item.signature_hero_image || DEFAULT_HERO_IMAGE }} 
                    style={styles.heroImage} 
                    resizeMode="cover"
                />
                {/* Name Badge Overlay */}
                <View style={styles.nameBadge}>
                    <Text style={styles.playerName} numberOfLines={1}>{item.name.toUpperCase()}</Text>
                </View>
            </TouchableOpacity>

            {/* RIGHT: STATS MATRIX */}
            <View style={styles.statsContainer}>
                <View style={styles.headerInfo}>
                    <Text style={styles.roleTitle}>{item.current_role || 'FLEX'}</Text>
                    <View style={styles.ovrBadge}>
                         <Text style={styles.ovrText}>OVR {item.ovr}</Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>LANING</Text>
                        <Text style={styles.statValue}>{item.moba_laning_skill || 50}</Text>
                    </View>
                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>WAR</Text>
                        <Text style={styles.statValue}>{item.moba_teamfight_presence || 50}</Text>
                    </View>
                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>FARM</Text>
                        <Text style={styles.statValue}>{Math.round(item.ovr * 0.9)}</Text>
                    </View>
                    <View style={styles.statCol}>
                        <Text style={styles.statLabel}>IQ</Text>
                        <Text style={styles.statValue}>{Math.round(item.ovr * 1.05)}</Text>
                    </View>
                </View>

                {/* Team Name / Info */}
                <Text style={styles.teamName}>Phantom Gaming</Text>
            </View>
        </View>

        {/* FOOTER BUTTONS */}
        <View style={styles.footerRow}>
            <View style={styles.divisionLabel}>
                <Text style={styles.divisionText}>{item.name} DIVISION</Text>
            </View>
            
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.btnUpgrade}>
                    <Text style={styles.btnText}>UPGRADE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnBench}>
                    <Text style={styles.btnText}>BENCH</Text>
                </TouchableOpacity>
            </View>
        </View>

      </View>
    </Animatable.View>
  );

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary.main} /></View>;

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
    borderRadius: 8,
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
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingVertical: 4, alignItems: 'center',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.primary.main
  },
  playerName: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },

  // Right: Stats
  statsContainer: { flex: 1, padding: 10, justifyContent: 'space-between' },
  headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  roleTitle: { color: theme.colors.primary.main, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  ovrBadge: { backgroundColor: theme.colors.primary.main, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
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
  btnUpgrade: { backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }, // Green
  btnBench: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }, // Red
  btnText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});