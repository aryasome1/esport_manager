/**
 * Round Interface Component
 * Shows round timer, current round, and match controls during active rounds
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';

// Theme
import { theme } from '../../theme/theme';

export default function RoundInterface({
  currentRound,
  timeRemaining,
  roundState,
  onTimeout
}) {
  const progress = (timeRemaining / 100) * 100;
  const isActive = roundState === 'active';
  
  return (
    <View style={styles.container}>
      {/* Round Info */}
      <View style={styles.roundInfo}>
        <Text style={styles.roundText}>Round {currentRound}</Text>
        <Text style={styles.stateText}>
          {isActive ? 'IN PROGRESS' : 'PAUSED'}
        </Text>
      </View>

      {/* Timer Bar */}
      <View style={styles.timerContainer}>
        <View style={styles.timerBar}>
          <Animatable.View
            style={[
              styles.timerProgress,
              { width: `${progress}%` }
            ]}
            animation="pulse"
            iterationCount="infinite"
            duration={1000}
          />
        </View>
        <Text style={styles.timeText}>{timeRemaining}s</Text>
      </View>

      {/* Quick Controls */}
      {isActive && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.timeoutButton}
            onPress={onTimeout}
          >
            <Text style={styles.timeoutButtonText}>⏱️ TIMEOUT</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 10,
    margin: 10,
  },
  roundInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roundText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  stateText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.accent.gold,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timerBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  timerProgress: {
    height: '100%',
    backgroundColor: theme.colors.accent.gold,
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    minWidth: 50,
    textAlign: 'center',
  },
  controls: {
    marginTop: 10,
  },
  timeoutButton: {
    backgroundColor: theme.colors.accent.red,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  timeoutButtonText: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});