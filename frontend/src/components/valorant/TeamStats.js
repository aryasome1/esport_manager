/**
 * Team Stats Component
 * Shows agent performance, round history, and economic information
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

// Theme
import { theme } from '../../theme/theme';

export default function TeamStats({
  agents,
  roundHistory,
  economicState
}) {
  // Calculate team performance
  const getTeamStats = (teamAgents) => {
    if (!teamAgents.length) return { avgKDA: 0, agentsUsed: 0 };
    
    const totalKDA = teamAgents.reduce((sum, agent) => 
      sum + (agent.kda || Math.random() * 2 + 0.5), 0
    );
    
    return {
      avgKDA: (totalKDA / teamAgents.length).toFixed(2),
      agentsUsed: teamAgents.length
    };
  };

  const team1Stats = getTeamStats(agents.team1);
  const team2Stats = getTeamStats(agents.team2);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Team 1 Stats */}
        <View style={styles.teamContainer}>
          <Text style={styles.teamTitle}>Your Team</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Avg KDA:</Text>
            <Text style={styles.statValue}>{team1Stats.avgKDA}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Agents:</Text>
            <Text style={styles.statValue}>{team1Stats.agentsUsed}/5</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Economy:</Text>
            <Text style={[styles.statValue, { color: getEconomyColor(economicState.team1) }]}>
              {economicState.team1}
            </Text>
          </View>
        </View>

        {/* Round History */}
        <View style={styles.historyContainer}>
          <Text style={styles.teamTitle}>Recent Rounds</Text>
          <ScrollView horizontal>
            {roundHistory.slice(-5).map((round, index) => (
              <View key={index} style={styles.roundItem}>
                <Text style={styles.roundNumber}>R{index + 1}</Text>
                <Text style={[
                  styles.roundResult,
                  { color: round.winner === 'team1' ? theme.colors.accent.green : theme.colors.accent.red }
                ]}>
                  {round.winner === 'team1' ? 'W' : 'L'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Team 2 Stats */}
        <View style={styles.teamContainer}>
          <Text style={styles.teamTitle}>Opponent</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Avg KDA:</Text>
            <Text style={styles.statValue}>{team2Stats.avgKDA}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Agents:</Text>
            <Text style={styles.statValue}>{team2Stats.agentsUsed}/5</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Economy:</Text>
            <Text style={[styles.statValue, { color: getEconomyColor(economicState.team2) }]}>
              {economicState.team2}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getEconomyColor = (state) => {
  switch (state) {
    case 'full_buy': return '#4CAF50';
    case 'force': return '#FF9800';
    case 'eco': return '#F44336';
    case 'pistol': return '#2196F3';
    default: return '#9E9E9E';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 8,
    margin: 5,
    padding: 10,
  },
  teamContainer: {
    minWidth: 120,
    paddingHorizontal: 15,
  },
  teamTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  historyContainer: {
    minWidth: 150,
    paddingHorizontal: 15,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border.primary,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.primary,
  },
  roundItem: {
    alignItems: 'center',
    marginHorizontal: 4,
    minWidth: 25,
  },
  roundNumber: {
    fontSize: 8,
    color: theme.colors.text.tertiary,
  },
  roundResult: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});