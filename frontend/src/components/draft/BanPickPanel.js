/**
 * Ban Pick Panel Component
 * Controls for ban/pick actions
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { theme } from '../../theme/theme';
import HeroCard from './HeroCard';

export default function BanPickPanel({
  availableHeroes = [],
  selectedHero,
  selectedRole,
  onHeroSelect,
  onRoleSelect,
  onPick,
  onBan,
  phase,
  currentTeamId,
}) {
  const roles = ['goldlane', 'exp_su', 'midlane', 'jungle', 'roam'];

  return (
    <View style={styles.container}>
      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.roleButton, selectedRole === role && styles.selectedRoleButton]}
            onPress={() => onRoleSelect(role)}
          >
            <Text style={styles.roleButtonText}>{role}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        horizontal
        data={availableHeroes}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <HeroCard
            hero={item}
            onPress={() => onHeroSelect(item)}
            selected={selectedHero?.id === item.id}
          />
        )}
        style={styles.heroesList}
      />

      <View style={styles.actionsContainer}>
        {phase === 'ban' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.banButton]}
            onPress={() => selectedHero && onBan(selectedHero)}
            disabled={!selectedHero}
          >
            <Text style={styles.actionButtonText}>Ban</Text>
          </TouchableOpacity>
        )}
        {phase === 'pick' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.pickButton]}
            onPress={onPick}
            disabled={!selectedHero || !selectedRole}
          >
            <Text style={styles.actionButtonText}>Pick</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  rolesContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  roleButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  selectedRoleButton: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  roleButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  heroesList: {
    maxHeight: 100,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    minWidth: 100,
    alignItems: 'center',
  },
  banButton: {
    backgroundColor: theme.colors.status.error,
  },
  pickButton: {
    backgroundColor: theme.colors.primary.main,
  },
  actionButtonText: {
    color: theme.colors.primary.contrast,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
  },
});

