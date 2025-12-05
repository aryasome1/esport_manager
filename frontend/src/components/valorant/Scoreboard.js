/**
 * Match Scoreboard Component
 * Shows team scores, round information, and match phase
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

// Theme
import { theme } from '../../theme/theme';

export default function Scoreboard({
  score,
  currentRound,
  isAITurn,
  matchPhase,
  economicState
}) {
  return (
    <View style={styles.container}>
      {/* Team Scores */}
      <View style={styles.scoreContainer}>
        <View style={styles.teamScore}>
          <Text style={styles.teamName}>Your Team</Text>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={2000}
            style={styles.scoreValue}
          >
            <Text style={styles.scoreText}>{score.team1}</Text>
          </Animatable.View>
        </View>

        <View style={styles.centerInfo}>
          <Text style={styles.roundIndicator}>Round {currentRound}</Text>
          <View style={styles.phaseIndicator}>
            <Text style={styles.phaseText}>{matchPhase.toUpperCase()}</Text>
            <Text style={styles.economyText}>{economicState.team1}</Text>
          </View>
        </View>

        <View style={styles.teamScore}>
          <Text style={styles.teamName}>
            {isAITurn ? 'AI Opponent' : 'Opponent'}
          </Text>
          <Text style={styles.scoreText}>{score.team2}</Text>
        </View>
      </View>

      {/* Match Status */}
      <View style={styles.statusBar}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isAITurn ? theme.colors.accent.red : theme.colors.accent.green }
        ]}>
          <Text style={styles.statusText}>
            {isAITurn ? 'AI TURN' : 'YOUR TURN'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamScore: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 5,
  },
  scoreValue: {
    alignSelf: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  centerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  roundIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.accent.gold,
    marginBottom: 5,
  },
  phaseIndicator: {
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  economyText: {
    fontSize: 8,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  statusBar: {
    marginTop: 10,
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
});