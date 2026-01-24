import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, ActivityIndicator, ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../theme/theme';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/ApiClient';

const { width } = Dimensions.get('window');

export default function FpsHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState({
    wins: 0,
    matches: 0,
    winRate: 0,
    bestMap: 'Ascent',
    nextMatch: null
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const teamId = user?.team_id || 1;
      const response = await apiClient.get(`/api/teams/${teamId}`);

      if (response.data) {
        const t = response.data;
        const wr = t.total_matches > 0
          ? ((t.wins / t.total_matches) * 100).toFixed(1)
          : 0;

        setTeamStats(prev => ({
          ...prev,
          wins: t.wins,
          matches: t.total_matches,
          winRate: wr,
          nextMatch: {
            opponent: 'Sentinels',
            time: '20:00',
            date: 'Tonight'
          }
        }));
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const MenuCard = ({ title, subtitle, icon, color, onPress, fullWidth }) => (
    <TouchableOpacity
      style={[styles.menuCard, fullWidth ? styles.fullWidthCard : styles.halfWidthCard]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.menuGradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon} size={28} color={color} />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#475569" style={styles.arrowIcon} />
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4655" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 20 }]}>

        {/* [NEW] Header Row with Exit Button */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>OPERATOR</Text>
            <Text style={styles.username}>{user?.username?.toUpperCase()}</Text>
          </View>

          <TouchableOpacity
            style={styles.exitButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()} // Kembali ke Division Select
          >
            <Text style={styles.exitText}>LEAVE PROTOCOL</Text>
            <MaterialCommunityIcons name="logout-variant" size={16} color="#ff4655" />
          </TouchableOpacity>
        </View>

        {/* Team Performance Card */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={['#ff4655', '#bd3944']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsGradient}
          >
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>WIN RATE</Text>
                <Text style={styles.statValue}>{teamStats.winRate}%</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>MATCHES</Text>
                <Text style={styles.statValue}>{teamStats.matches}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>BEST MAP</Text>
                <Text style={styles.statValue}>{teamStats.bestMap}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>OPERATIONS</Text>
        <View style={styles.gridContainer}>
          <MenuCard
            title="Active Roster"
            subtitle="Manage Agents & Roles"
            icon="account-group"
            color="#38bdf8"
            onPress={() => navigation.navigate('Team')}
          />
          <MenuCard
            title="Agent Pool"
            subtitle="Analyze Meta Picks"
            icon="incognito"
            color="#a855f7"
            onPress={() => navigation.navigate('AgentList')}
          />
          <MenuCard
            title="Map Strategies"
            subtitle="Lineups & Setups"
            icon="map-legend"
            color="#22c55e"
            onPress={() => navigation.navigate('MapPool')}
          />
          <MenuCard
            title="Match Schedule"
            subtitle="Upcoming Scrims"
            icon="calendar-clock"
            color="#f59e0b"
            onPress={() => navigation.navigate('TacticalMatches')}
          />
        </View>

        {/* Next Match Teaser */}
        <Text style={styles.sectionTitle}>NEXT ASSIGNMENT</Text>
        <TouchableOpacity
          style={styles.matchCard}
          onPress={() => navigation.navigate('DraftMapScreen', {
            matchData: { opponent: teamStats.nextMatch?.opponent || 'Sentinels' },
            opponentTeam: { name: teamStats.nextMatch?.opponent || 'Sentinels' }
          })}
        >
          <ImageBackground
            source={{ uri: 'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt99661f49646b9552/5f80a069578430292796e624/VALORANT_Jett_Red_Crop.jpg' }}
            style={styles.matchBg}
            imageStyle={{ borderRadius: 12, opacity: 0.4 }}
          >
            <LinearGradient
              colors={['transparent', 'rgba(15, 23, 42, 0.9)']}
              style={styles.matchContent}
            >
              <View style={styles.matchInfo}>
                <Text style={styles.matchLabel}>UPCOMING SCRIM</Text>
                <Text style={styles.opponentName}>VS {teamStats.nextMatch?.opponent}</Text>
                <View style={styles.timeTag}>
                  <Ionicons name="time-outline" size={14} color="#fff" />
                  <Text style={styles.timeText}>
                    {teamStats.nextMatch?.date} @ {teamStats.nextMatch?.time}
                  </Text>
                </View>
              </View>
              <View style={styles.playButton}>
                <Ionicons name="play" size={24} color="#fff" />
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Header Row Custom
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 70, 85, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 70, 85, 0.3)',
  },
  exitText: {
    color: '#ff4655',
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 6,
    letterSpacing: 1,
  },

  // Stats Card
  statsCard: {
    borderRadius: 4, // Kotak tajam FPS
    marginBottom: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#ff4655',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  statsGradient: {
    padding: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Menu Grid
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4655',
    paddingLeft: 12,
    fontStyle: 'italic',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  menuCard: {
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  fullWidthCard: {
    width: '100%',
  },
  halfWidthCard: {
    width: (width - 50) / 2, // 2 column with gap
  },
  menuGradient: {
    padding: 16,
    height: 110,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuSubtitle: {
    color: '#64748b',
    fontSize: 10,
  },
  arrowIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Match Card
  matchCard: {
    height: 140,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  matchBg: {
    width: '100%',
    height: '100%',
  },
  matchContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
  },
  matchLabel: {
    color: '#ff4655',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  opponentName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  timeText: {
    color: '#e2e8f0',
    fontSize: 12,
    marginLeft: 6,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff4655',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});