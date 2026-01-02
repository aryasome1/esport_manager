/**
 * MobaRosterScreen
 * Updated UI: Detailed Landscape Card with Dynamic Avatars & Navigation
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity // Pastikan ini terimport
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

import { theme } from '../../theme/theme';
import { apiClient } from '../../services/ApiClient';
import { useAuth } from '../../contexts/AuthContext';
import { getPlayerAvatar } from '../../utils/PlayerAvatars';

export default function MobaRosterScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // --- LOAD DATA ---
  const loadTeamData = async () => {
    try {
      const teamId = user?.team_id || 5;

      const response = await apiClient.get(`/api/players/?team_id=${teamId}&division=moba`);

      if (response.data && response.data.items) {
        setRoster(response.data.items);
      } else {
        setRoster([]);
      }
    } catch (error) {
      console.error('Error loading roster:', error);
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
    // [FIX] Cek berbagai kemungkinan nama field role untuk mengatasi "UNKNOWN"
    const rawRole = item.role || item.position || item.current_role || 'Unknown';

    // Ambil gambar avatar based on ID now
    const avatarSource = getPlayerAvatar(item.id);

    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 100}
        style={styles.cardWrapper}
      >
        {/* [FIX] Bungkus dengan TouchableOpacity agar bisa diklik */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PlayerProfile', { player: item })}
        >
          <LinearGradient
            colors={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>

              {/* [BAGIAN 1] AVATAR */}
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

              {/* [BAGIAN 2] INFO UTAMA */}
              <View style={styles.infoSection}>
                <View style={styles.cardHeader}>
                  <Text style={styles.roleTitle}>{rawRole.toUpperCase()}</Text>
                  <View style={styles.ovrBadge}>
                    <Text style={styles.ovrText}>OVR {item.overall_rating || item.ovr || 50}</Text>
                  </View>
                </View>

                <Text style={styles.ignText} numberOfLines={1}>
                  {item.ign || item.username || item.name || 'Player'}
                </Text>

                <View style={styles.separator} />

                <View style={styles.statsGrid}>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>MECHANIC</Text>
                    <Text style={styles.statValue}>{item.mechanics || '-'}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>MACRO</Text>
                    <Text style={styles.statValue}>{item.macro || '-'}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>KDA AVG</Text>
                    <Text style={styles.statValue}>{item.kda_avg || '0.0'}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>MATCHES</Text>
                    <Text style={styles.statValue}>{item.matches_played || '0'}</Text>
                  </View>
                </View>

                <Text style={styles.teamName}>Phantom Gaming</Text>
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
        <ActivityIndicator size="large" color={theme.colors.accent.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Active Roster</Text>
          <Text style={styles.headerSubtitle}>MOBA Division • Season 1</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="account-group" size={28} color={theme.colors.accent.gold} />
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
            tintColor={theme.colors.accent.gold}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-search" size={48} color="#64748b" />
            <Text style={styles.emptyText}>No players found in roster.</Text>
          </View>
        }
      />

      <View style={styles.footerRow}>
        <View style={styles.divisionLabel}>
          <Text style={styles.divisionText}>DIV: MOBA</Text>
        </View>
        <View style={styles.statusLabel}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>ONLINE</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  listContent: {
    padding: 16,
  },
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
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
    borderRadius: 35,
    borderWidth: 2,
    borderColor: theme.colors.accent.gold,
    backgroundColor: '#1e293b',
  },
  roleBadgeSmall: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0f172a',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.text.secondary,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
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
    color: theme.colors.accent.gold,
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
  },
  ovrBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  ovrText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ignText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
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
    fontWeight: '600',
  },
  statValue: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  teamName: {
    color: '#475569',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'right',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  divisionLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  divisionText: {
    color: '#94a3b8',
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
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
    marginTop: 10,
    fontSize: 14,
  },
});