import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { theme } from '../../theme/theme';
import { apiClient } from '../../services/ApiClient';

const FILTER_TABS = ['PENDING', 'COMPLETED', 'ALL'];

export default function TacticalMatchScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [activeFilter, setActiveFilter] = useState('PENDING');

  const loadMatches = async () => {
    try {
      // Fetch matches (bisa ditambah filter division_type=valorant jika backend support)
      const response = await apiClient.get('/api/matches/?division=tactical');
      if (response.data && response.data.items) {
        setMatches(response.data.items);
      }
    } catch (error) {
      console.error("Failed to load tactical matches:", error);
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

    if (activeFilter === 'PENDING') {
      result = matches.filter(m => m.status === 'scheduled' || m.status === 'drafting');
    } else if (activeFilter === 'COMPLETED') {
      result = matches.filter(m => m.status === 'completed');
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.scheduled_at);
      const dateB = new Date(b.scheduled_at);
      return activeFilter === 'COMPLETED' ? dateB - dateA : dateA - dateB;
    });

    setFilteredMatches(result);
  };

  const renderMatchCard = ({ item }) => {
    const isCompleted = item.status === 'completed';
    const matchDate = new Date(item.scheduled_at);
    const dateString = matchDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
    const timeString = matchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          if (item.status === 'scheduled') {
            // Navigate to Map Draft Screen first for BO3 veto
            navigation.navigate('DraftMapScreen', {
              matchId: item.id,
              matchData: item,
              opponentTeam: item.team2,
              isAIMatch: !!item.ai_opponent_id
            });
          }
        }}
      >
        {/* Left Accent Bar */}
        <View style={[
          styles.accentBar,
          { backgroundColor: isCompleted ? '#10b981' : '#ff4655' }
        ]} />

        <View style={styles.cardContent}>
          {/* Header Info */}
          <View style={styles.matchHeader}>
            <View style={styles.badgeContainer}>
              <Text style={[
                styles.statusText,
                { color: isCompleted ? '#10b981' : '#ff4655' }
              ]}>
                {isCompleted ? 'OPERATION COMPLETE' : 'DEPLOYMENT SCHEDULED'}
              </Text>
            </View>
            <View style={styles.dateTime}>
              <Ionicons name="time-outline" size={12} color="#94a3b8" />
              <Text style={styles.dateText}>{dateString} // {timeString}</Text>
            </View>
          </View>

          {/* VS Section */}
          <View style={styles.matchBody}>
            <View style={styles.teamBox}>
              <Text style={styles.teamName} numberOfLines={1}>{item.team1?.name.toUpperCase()}</Text>
              <Text style={styles.teamTag}>{item.team1?.name_short || 'T1'}</Text>
            </View>

            <View style={styles.vsBox}>
              {isCompleted ? (
                <View style={styles.scoreBox}>
                  <Text style={[styles.score, item.winner_team_id === item.team1_id && styles.winnerScore]}>
                    {item.team1_score}
                  </Text>
                  <Text style={styles.divider}>:</Text>
                  <Text style={[styles.score, item.winner_team_id === item.team2_id && styles.winnerScore]}>
                    {item.team2_score}
                  </Text>
                </View>
              ) : (
                <Text style={styles.vsText}>VS</Text>
              )}
            </View>

            <View style={[styles.teamBox, { alignItems: 'flex-end' }]}>
              <Text style={styles.teamName} numberOfLines={1}>{item.team2?.name.toUpperCase()}</Text>
              <Text style={styles.teamTag}>{item.team2?.name_short || 'T2'}</Text>
            </View>
          </View>

          {/* Footer Action */}
          {!isCompleted && (
            <View style={styles.footer}>
              <Text style={styles.mapText}>MAP: {item.game_mode || 'TBD'}</Text>
              <View style={styles.enterBtn}>
                <Text style={styles.enterText}>INITIATE</Text>
                <MaterialCommunityIcons name="chevron-double-right" size={16} color="#0f172a" />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Title Header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>OPERATIONAL TIMELINE</Text>
        <View style={styles.headerLine} />
      </View>

      {/* Filters */}
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

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#ff4655" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredMatches}
          renderItem={renderMatchCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMatches(); }} tintColor="#ff4655" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="satellite-dish" size={40} color="#334155" />
              <Text style={styles.emptyText}>NO OPERATIONS FOUND</Text>
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
  screenHeader: {
    padding: 20,
    paddingBottom: 0,
  },
  screenTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
    marginBottom: 10,
  },
  headerLine: {
    height: 1,
    backgroundColor: '#334155',
    width: '100%',
  },

  // Filters
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    borderRadius: 2, // Kotak tajam
  },
  activeFilterTab: {
    backgroundColor: '#ff4655',
    borderColor: '#ff4655',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activeFilterText: {
    color: '#fff',
  },

  listContent: {
    padding: 16,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  accentBar: {
    width: 6,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },

  // Match Info
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: 'System', // Monospace feel
  },

  matchBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  teamBox: {
    flex: 1,
  },
  teamName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  teamTag: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },

  vsBox: {
    paddingHorizontal: 10,
  },
  vsText: {
    color: '#475569',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  score: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
  },
  winnerScore: {
    color: '#10b981',
  },
  divider: {
    color: '#64748b',
    marginHorizontal: 4,
  },

  // Footer
  footer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  enterText: {
    color: '#0f172a',
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 2,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 10,
    fontSize: 12,
    letterSpacing: 2,
  },
});