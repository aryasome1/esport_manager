/**
 * Hero Card Component
 * Displays hero information in draft
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';

export default function HeroCard({ hero, onPress, selected = false, disabled = false }) {
  if (!hero) return null;

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selectedCard, disabled && styles.disabledCard]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.heroName}>{hero.name || 'Unknown Hero'}</Text>
      {hero.role && <Text style={styles.heroRole}>{hero.role}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  selectedCard: {
    borderColor: theme.colors.primary.main,
    borderWidth: 2,
    backgroundColor: theme.colors.primary.main + '20',
  },
  disabledCard: {
    opacity: 0.5,
  },
  heroName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  heroRole: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});

