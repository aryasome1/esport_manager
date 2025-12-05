/**
 * Draft Phase Indicator Component
 * Shows current draft phase
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export default function DraftPhaseIndicator({ phase, currentTeamId, isMyTurn }) {
  const getPhaseLabel = (phase) => {
    switch (phase) {
      case 'ban':
        return 'Ban Phase';
      case 'pick':
        return 'Pick Phase';
      case 'completed':
        return 'Draft Complete';
      default:
        return 'Waiting...';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.phaseLabel}>{getPhaseLabel(phase)}</Text>
      {isMyTurn && (
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>Your Turn</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  phaseLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  turnIndicator: {
    backgroundColor: theme.colors.accent.gold,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  turnText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.contrast,
  },
});

