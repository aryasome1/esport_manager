/**
 * Match Controls Component
 * Handles match control actions like pause, timeout, surrender
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

// Theme
import { theme } from '../../theme/theme';

export default function MatchControls({
  roundState,
  timeoutsUsed,
  maxTimeouts,
  matchEnded,
  onControlPress
}) {
  const handleControlAction = (action) => {
    if (matchEnded) return;
    
    switch (action) {
      case 'pause':
        if (roundState === 'active') {
          onControlPress('pause');
        } else {
          onControlPress('resume');
        }
        break;
      case 'timeout':
        if (timeoutsUsed >= maxTimeouts) {
          Alert.alert('No Timeouts', 'You have used all available timeouts');
        } else {
          onControlPress('timeout');
        }
        break;
      case 'surrender':
        Alert.alert(
          'Surrender Match',
          'Are you sure you want to surrender?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Surrender', 
              style: 'destructive',
              onPress: () => onControlPress('surrender')
            }
          ]
        );
        break;
    }
  };

  const isPaused = roundState === 'paused';
  const canTimeout = timeoutsUsed < maxTimeouts;

  return (
    <View style={styles.container}>
      <View style={styles.controlsContainer}>
        {/* Pause/Resume Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.pauseButton]}
          onPress={() => handleControlAction('pause')}
          disabled={matchEnded}
        >
          <Text style={styles.controlButtonText}>
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </Text>
        </TouchableOpacity>

        {/* Timeout Button */}
        <TouchableOpacity
          style={[
            styles.controlButton, 
            styles.timeoutButton,
            !canTimeout && styles.disabledButton
          ]}
          onPress={() => handleControlAction('timeout')}
          disabled={!canTimeout || matchEnded}
        >
          <Text style={styles.controlButtonText}>
            ⏱️ Timeout ({maxTimeouts - timeoutsUsed})
          </Text>
        </TouchableOpacity>

        {/* Surrender Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.surrenderButton]}
          onPress={() => handleControlAction('surrender')}
          disabled={matchEnded}
        >
          <Text style={styles.controlButtonText}>
            🚩 Surrender
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Text */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {matchEnded ? 'Match Ended' : 
           isPaused ? 'Game Paused' : 
           `Round: ${roundState.charAt(0).toUpperCase() + roundState.slice(1)}`}
        </Text>
        {timeoutsUsed >= maxTimeouts && (
          <Text style={styles.noTimeoutsText}>No timeouts remaining</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.colors.background.secondary,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: theme.colors.accent.blue,
  },
  timeoutButton: {
    backgroundColor: theme.colors.accent.gold,
  },
  surrenderButton: {
    backgroundColor: theme.colors.accent.red,
  },
  disabledButton: {
    backgroundColor: theme.colors.background.tertiary,
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  noTimeoutsText: {
    fontSize: 10,
    color: theme.colors.accent.red,
    marginTop: 2,
  },
});