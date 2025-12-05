/**
 * Team Panel Component
 * Displays team lineup in draft
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export default function TeamPanel({ teamId, lineup = {}, currentTurn = false, isMyTeam = false }) {
  return (
    <View style={[styles.panel, currentTurn && styles.currentTurnPanel]}>
      <Text style={styles.teamLabel}>Team {teamId}</Text>
      <View style={styles.lineup}>
        {Object.entries(lineup).map(([role, heroId]) => (
          <View key={role} style={styles.lineupItem}>
            <Text style={styles.roleText}>{role}</Text>
            <Text style={styles.heroText}>{heroId || 'Empty'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    width: 150,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  currentTurnPanel: {
    borderColor: theme.colors.accent.gold,
    borderWidth: 2,
  },
  teamLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  lineup: {
    gap: theme.spacing.xs,
  },
  lineupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  heroText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

