/**
 * TacticalTeamScreen
 * Layout: Matches MobaRosterScreen (Landscape Card)
 * Theme: Valorant Style (Red #ff4655, Sharp Edges, Dark Slate)
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

import { theme } from '../../theme/theme';
import { apiClient } from '../../services/ApiClient';
import { useAuth } from '../../contexts/AuthContext';
import { getPlayerAvatar } from '../../utils/PlayerAvatars';

export default function TacticalTeamScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- LOAD DATA ---
  const loadTeamData = async () => {
    try {
      const teamId = user?.team_id || 5;
      const response = await apiClient.get(`/api/players/?team_id=${teamId}&division=tactical`);

      if (response.data && response.data.items) {
        setRoster(response.data.items);
      } else {
        setRoster([]);
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
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTeamData();
  };

  const renderPlayerCard = ({ item, index }) => {
    // Logic Role & Avatar
    const rawRole = item.role || item.position || item.current_role || 'Unknown';
    const avatarSource = getPlayerAvatar(item.id);

    return (
      <Animatable.View
        animation="fadeInRight" // Animasi dari kanan biar beda dikit sama MOBA
        delay={index * 100}
        style={styles.cardWrapper}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PlayerProfile', { player: item })}
        >
          <LinearGradient
            // Warna Gradient: Slate Gelap ke Sedikit Merah Gelap
            colors={['rgba(30, 41, 59, 0.95)', 'rgba(15, 23, 42, 0.95)']}
            style={styles.cardGradient}
          >
            {/* Aksen Garis Merah di Kiri */}
            <View style={styles.accentBorder} />

            <View style={styles.cardContent}>

              {/* [BAGIAN 1] AVATAR (Kiri) - Style Valorant (Hexagon/Sharp) */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  <Image
                    source={avatarSource}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                  <View style={styles.roleBadgeSmall}>
                    <Text style={styles.roleBadgeText}>
                      {rawRole !== 'Unknown' ? rawRole.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* [BAGIAN 2] INFO UTAMA (Kanan) */}
              <View style={styles.infoSection}>
                {/* Header: Role & OVR */}
                <View style={styles.cardHeader}>
                  <Text style={styles.roleTitle}>{rawRole.toUpperCase()}</Text>
                  <View style={styles.ovrBadge}>
                    <Text style={styles.ovrText}>OVR {item.overall_rating || item.ovr || 50}</Text>
                  </View>
                </View>

                {/* Nama Pemain - Font Italic ala FPS */}
                <Text style={styles.ignText} numberOfLines={1}>
                  {item.ign || item.username || item.name || 'AGENT'}
                </Text>

                <View style={styles.separator} />

                {/* Stats Grid - Mapping Tactical Stats */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>AIM</Text>
                    <Text style={styles.statValue}>{item.tactical_aim || '-'}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>SENSE</Text>
                    <Text style={styles.statValue}>{item.tactical_gamesense || '-'}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>UTIL</Text>
                    <Text style={styles.statValue}>{item.tactical_utility || '-'}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>CLUTCH</Text>
                    <Text style={styles.statValue}>{item.tactical_clutch || '-'}</Text>
                  </View>
                </View>

                <Text style={styles.teamName}>PROTOCOL ID: #{item.id}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4655" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* HEADER TACTICAL STYLE */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TACTICAL ROSTER</Text>
          <Text style={styles.headerSubtitle}>PROTOCOL: ALPHA • SEASON 1</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#ff4655" />
        </View>
      </View>

      <FlatList
        data={roster}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderPlayerCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ff4655"
          />
        }
      />

      {/* FOOTER */}
      <View style={styles.footerRow}>
        <View style={styles.divisionLabel}>
          <Text style={styles.divisionText}>DIV: TACTICAL</Text>
        </View>
        <View style={styles.statusLabel}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>ACTIVE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },

  // Header Style (Tactical: Red Accent)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#ff4655', // Red Border
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900', // Extra Bold
    color: '#ffffff',
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#ff4655', // Red Text
    marginTop: 2,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 4, // Sharp corners
    backgroundColor: 'rgba(255, 70, 85, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4655',
  },

  // List
  listContent: {
    padding: 16,
  },

  // Card Styling (Layout Matches MOBA, Style Matches TACTICAL)
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 4, // Sharp corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    position: 'relative',
  },
  accentBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#ff4655', // Red Sidebar
  },
  cardContent: {
    flexDirection: 'row', // Horizontal Layout (Sama kaya MOBA)
    padding: 16,
    paddingLeft: 20, // Extra padding karena ada accentBorder
  },

  // -- Bagian Kiri: Avatar --
  avatarSection: {
    marginRight: 16,
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35, // Bulat
    borderWidth: 2,
    borderColor: '#ff4655', // Red Border
    backgroundColor: '#0f172a',
  },
  roleBadgeSmall: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ff4655', // Red Background
    width: 24,
    height: 24,
    borderRadius: 4, // Sharp Badge
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // -- Bagian Kanan: Info --
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleTitle: {
    color: '#ff4655', // Red Text
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ovrBadge: {
    backgroundColor: 'rgba(255, 70, 85, 0.2)', // Red Transparent
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2, // Sharp
    borderWidth: 1,
    borderColor: '#ff4655',
  },
  ovrText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ignText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900', // Heavy Bold
    fontStyle: 'italic', // Italic
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 70, 85, 0.3)', // Redish Separator
    marginBottom: 8,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCol: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    alignItems: 'center',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statValue: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  teamName: {
    color: '#64748b',
    fontSize: 9,
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'right',
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  divisionLabel: {
    backgroundColor: 'rgba(255, 70, 85, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 70, 85, 0.3)',
  },
  divisionText: {
    color: '#ff4655',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 0, // Square dot
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});