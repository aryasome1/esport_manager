/**
 * MobaScheduleScreen
 * Displays match schedule with consistent dark styling
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, RefreshControl, ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
// import { format } from 'date-fns'; // Opsional: kalau mau format tanggal cantik

import { theme } from '../../theme/theme';
import { apiClient } from '../../services/ApiClient';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const FILTER_TABS = ['Upcoming', 'Completed', 'All'];

export default function MobaScheduleScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [activeFilter, setActiveFilter] = useState('Upcoming');

  const loadMatches = async () => {
    try {
      // Fetch matches (sesuaikan endpoint jika perlu filtering by division)
      // Kita ambil semua dulu lalu filter di client atau tambah param ?status=...
      const response = await apiClient.get('/api/matches/?division=moba');
      if (response.data && response.data.items) {
        setMatches(response.data.items);
      }
    } catch (error) {
      console.error("Failed to load matches:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [])
  );

  useEffect(() => {
    filterData();
  }, [activeFilter, matches]);

  const filterData = () => {
    let result = matches;
    const now = new Date();

    if (activeFilter === 'Upcoming') {
      result = matches.filter(m => m.status === 'scheduled' || m.status === 'drafting');
    } else if (activeFilter === 'Completed') {
      result = matches.filter(m => m.status === 'completed');
    }
    
    // Sort: Upcoming (Ascending Date), Completed (Descending Date)
    result.sort((a, b) => {
        const dateA = new Date(a.scheduled_at);
        const dateB = new Date(b.scheduled_at);
        return activeFilter === 'Completed' ? dateB - dateA : dateA - dateB;
    });

    setFilteredMatches(result);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const getStatusColor = (status) => {
    switch(status) {
        case 'scheduled': return '#3b82f6'; // Blue
        case 'drafting': return '#eab308'; // Yellow
        case 'in_progress': return '#ef4444'; // Red (Live)
        case 'completed': return '#22c55e'; // Green
        default: return '#64748b';
    }
  };

  const renderMatchCard = ({ item }) => {
    const isCompleted = item.status === 'completed';
    const matchDate = new Date(item.scheduled_at);
    const dateString = matchDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    const timeString = matchDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
            // Navigasi ke detail match atau simulasi
            if (item.status === 'scheduled') {
                navigation.navigate('MobaDraft', { matchId: item.id });
            }
        }}
      >
        {/* Status Header */}
        <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.replace('_', ' ').toUpperCase()}
                </Text>
            </View>
            <Text style={styles.dateText}>{dateString} • {timeString}</Text>
        </View>

        {/* Teams VS */}
        <View style={styles.matchBody}>
            {/* Team 1 */}
            <View style={styles.teamContainer}>
                <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoText}>{item.team1?.name_short?.substring(0,2) || 'T1'}</Text>
                </View>
                <Text style={styles.teamName} numberOfLines={1}>{item.team1?.name || 'Team 1'}</Text>
            </View>

            {/* Score / VS */}
            <View style={styles.vsContainer}>
                {isCompleted ? (
                    <View style={styles.scoreBoard}>
                        <Text style={[styles.scoreText, item.winner_team_id === item.team1_id && styles.winnerScore]}>
                            {item.team1_score}
                        </Text>
                        <Text style={styles.vsText}>-</Text>
                        <Text style={[styles.scoreText, item.winner_team_id === item.team2_id && styles.winnerScore]}>
                            {item.team2_score}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.vsTextPlaceholder}>VS</Text>
                )}
            </View>

            {/* Team 2 */}
            <View style={styles.teamContainer}>
                <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoText}>{item.team2?.name_short?.substring(0,2) || 'T2'}</Text>
                </View>
                <Text style={styles.teamName} numberOfLines={1}>{item.team2?.name || 'Team 2'}</Text>
            </View>
        </View>

        {/* Action Footer */}
        {!isCompleted && (
             <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('MobaDraft', { matchId: item.id })}
             >
                <Text style={styles.actionText}>ENTER LOBBY</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
             </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.activeFilterTab]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.filterText, activeFilter === tab && styles.activeFilterText]}>
                {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary.main} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredMatches}
          renderItem={renderMatchCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="calendar-remove" size={48} color="#334155" />
                <Text style={styles.emptyText}>No matches found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeFilterTab: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  
  // Card Styles
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#0f172a',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
  },

  matchBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  teamName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  vsTextPlaceholder: {
    color: '#475569',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scoreText: {
    color: '#94a3b8',
    fontSize: 20,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  winnerScore: {
    color: theme.colors.primary.main, // Highlight winner
  },
  vsText: {
    color: '#475569',
    fontSize: 14,
    marginHorizontal: 4,
  },

  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    padding: 10,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 6,
    letterSpacing: 1,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 10,
    fontSize: 14,
  },
});