import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../theme/theme';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/ApiClient';

const { width } = Dimensions.get('window');

export default function MobaHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState({
    wins: 0,
    matches: 0,
    winRate: 0,
    avgGold: '0k'
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
        
        setTeamStats({
          wins: t.wins,
          matches: t.total_matches,
          winRate: wr,
          avgGold: '52.4k' // Mock data MOBA specific
        });
      }
    } catch (error) {
      console.error("Failed to load MOBA dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const MenuCard = ({ title, subtitle, icon, color, onPress }) => (
    <TouchableOpacity 
      style={styles.menuCard} 
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
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 20 }]}>
        
        {/* Header Row */}
        <View style={styles.headerRow}>
            <View>
                <Text style={styles.greeting}>MANAGER</Text>
                <Text style={styles.username}>{user?.username?.toUpperCase()}</Text>
            </View>

            <TouchableOpacity 
                style={styles.exitButton}
                activeOpacity={0.7}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.exitText}>LEAVE LOBBY</Text>
                <MaterialCommunityIcons name="logout" size={16} color={theme.colors.primary.main} />
            </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <LinearGradient
            colors={[theme.colors.primary.main, theme.colors.primary.dark]}
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
                <Text style={styles.statLabel}>AVG GOLD</Text>
                <Text style={styles.statValue}>{teamStats.avgGold}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Menu Grid */}
        <Text style={styles.sectionTitle}>MANAGEMENT</Text>
        <View style={styles.gridContainer}>
          <MenuCard 
            title="Active Roster" 
            subtitle="Lineup & Synergy"
            icon="account-group"
            color="#60a5fa"
            onPress={() => navigation.navigate('MobaRoster')}
          />
          <MenuCard 
            title="Hero Database" 
            subtitle="Meta Analysis"
            icon="book-open-variant"
            color="#fbbf24"
            onPress={() => navigation.navigate('Heroes')} // Tab Heroes
          />
          <MenuCard 
            title="Match Schedule" 
            subtitle="Upcoming Games"
            icon="calendar-clock"
            color="#34d399"
            onPress={() => navigation.navigate('Matches')} // Tab Matches
          />
          <MenuCard 
            title="Draft Simulator" 
            subtitle="Practice Picks"
            icon="chess-queen"
            color="#f472b6"
            onPress={() => navigation.navigate('MobaDraft')}
          />
        </View>

        {/* Next Match Teaser */}
        <Text style={styles.sectionTitle}>NEXT MATCH</Text>
        <TouchableOpacity 
            style={styles.matchCard}
            onPress={() => navigation.navigate('MobaMatch')}
        >
            <ImageBackground 
                source={{ uri: 'https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt12563456345/league-map.jpg' }} // Mock bg
                style={styles.matchBg}
                imageStyle={{ borderRadius: 12, opacity: 0.5 }}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(15, 23, 42, 0.9)']}
                    style={styles.matchContent}
                >
                    <View style={styles.matchInfo}>
                        <Text style={styles.matchLabel}>REGULAR SEASON</Text>
                        <Text style={styles.opponentName}>VS RRQ HOSHI</Text>
                        <View style={styles.timeTag}>
                            <Ionicons name="time-outline" size={14} color="#fff" />
                            <Text style={styles.timeText}>TOMORROW @ 19:00</Text>
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
  container: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  username: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  exitButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' },
  exitText: { color: theme.colors.primary.main, fontSize: 10, fontWeight: 'bold', marginRight: 6, letterSpacing: 1 },

  statsCard: { borderRadius: 16, marginBottom: 30, overflow: 'hidden', elevation: 8 },
  statsGradient: { padding: 20 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  verticalDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  menuCard: { width: (width - 50) / 2, borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  menuGradient: { padding: 16, height: 110, justifyContent: 'space-between' },
  iconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  menuSubtitle: { color: '#64748b', fontSize: 10 },
  arrowIcon: { position: 'absolute', top: 12, right: 12 },

  matchCard: { height: 140, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  matchBg: { width: '100%', height: '100%' },
  matchContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 20 },
  matchLabel: { color: theme.colors.primary.main, fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  opponentName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  timeTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  timeText: { color: '#e2e8f0', fontSize: 12, marginLeft: 6 },
  playButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary.main, justifyContent: 'center', alignItems: 'center', elevation: 5 },
});