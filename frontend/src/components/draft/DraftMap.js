/**
 * DraftMap Component - Visual representation of MOBA draft
 * Shows team composition, lanes, and hero assignments in a map-style layout
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

// Theme
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

const ROLE_POSITIONS = {
  goldlane: { x: 150, y: 80 },
  exp_su: { x: 50, y: 200 },
  midlane: { x: 150, y: 200 },
  jungle: { x: 150, y: 150 },
  roam: { x: 250, y: 200 },
};

export default function DraftMap({
  team1Lineup = {},
  team2Lineup = {},
  bannedHeroes = [],
  onRoleSelect,
  selectedRole,
  availableHeroes = [],
}) {
  // Render role slot
  const renderRoleSlot = (role, teamId, position) => {
    const isTeam1 = teamId === 1;
    const lineup = isTeam1 ? team1Lineup : team2Lineup;
    const heroId = lineup[role];
    const hasHero = heroId !== undefined;
    
    const isSelected = selectedRole === role;
    const hero = hasHero ? availableHeroes.find(h => h.id === heroId) : null;
    
    return (
      <Animatable.View
        key={`${teamId}-${role}`}
        animation={isSelected ? "pulse" : "fadeIn"}
        duration={300}
        style={[
          styles.roleSlot,
          {
            left: isTeam1 ? position.x : width - position.x - 80,
            top: position.y,
          },
          isSelected && styles.selectedSlot,
          hasHero && styles.filledSlot,
        ]}
      >
        <TouchableOpacity
          style={styles.roleSlotButton}
          onPress={() => onRoleSelect?.(role)}
          disabled={hasHero}
        >
          {/* Role Icon/Label */}
          <View style={[styles.roleIcon, getRoleStyle(role)]}>
            <Text style={styles.roleIconText}>
              {getRoleIcon(role)}
            </Text>
          </View>
          
          {/* Hero Avatar (if selected) */}
          {hero && (
            <Animatable.View
              animation="bounceIn"
              style={styles.heroAvatar}
            >
              {hero.image_url ? (
                <Image
                  source={{ uri: hero.image_url }}
                  style={styles.heroImage}
                />
              ) : (
                <View style={[styles.heroPlaceholder, { backgroundColor: theme.colors.neutral.gray[300] }]}>
                  <Text style={styles.heroInitial}>
                    {hero.name.charAt(0)}
                  </Text>
                </View>
              )}
              
              {/* Hero Name */}
              <Text style={styles.heroName}>
                {hero.name}
              </Text>
              
              {/* Hero Power Indicator */}
              <View style={styles.heroPowerIndicator}>
                <View style={styles.heroPowerBar}>
                  <View 
                    style={[
                      styles.heroPowerFill,
                      { 
                        width: `${(hero.hero_power || 50)}%`,
                        backgroundColor: getRoleColor(role, 'main')
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.heroPowerText}>
                  {Math.round(hero.hero_power || 50)}
                </Text>
              </View>
            </Animatable.View>
          )}
          
          {/* Role Label */}
          <Text style={styles.roleLabel}>
            {getRoleLabel(role)}
          </Text>
          
          {/* Selection Indicator */}
          {isSelected && (
            <Animatable.View 
              animation="pulse" 
              iterationCount="infinite"
              style={styles.selectionIndicator}
            >
              <View style={[styles.selectionDot, { backgroundColor: theme.colors.accent.gold }]} />
            </Animatable.View>
          )}
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  // Render team composition
  const renderTeamComposition = (teamId) => (
    <View key={teamId} style={[
      styles.teamContainer,
      teamId === 1 ? styles.teamLeft : styles.teamRight
    ]}>
      {/* Team Label */}
      <Text style={[
        styles.teamLabel,
        teamId === 1 ? styles.team1Label : styles.team2Label
      ]}>
        TEAM {teamId}
      </Text>
      
      {/* Role Slots */}
      {Object.entries(ROLE_POSITIONS).map(([role, position]) => 
        renderRoleSlot(role, teamId, position)
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapBackground}>
        <Image
          source={{ uri: 'https://via.placeholder.com/800x600/1a1a2e/ffffff?text=Draft+Map' }}
          style={styles.mapImage}
          resizeMode="cover"
        />
        
        {/* Map Overlay */}
        <View style={styles.mapOverlay} />
      </View>
      
      {/* Teams */}
      {renderTeamComposition(1)}
      {renderTeamComposition(2)}
      
      {/* Map Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Role Legend</Text>
        <View style={styles.legendItems}>
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <View key={role} style={styles.legendItem}>
              <Text style={styles.legendIcon}>
                {getRoleIcon(role)}
              </Text>
              <Text style={styles.legendText}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Ban Indicators */}
      {bannedHeroes.map((heroId, index) => (
        <Animatable.View
          key={heroId}
          animation="slideInDown"
          delay={index * 100}
          style={[
            styles.banIndicator,
            { left: (width / 2) - 20, top: 20 + (index * 30) }
          ]}
        >
          <View style={styles.banX}>
            <Text style={styles.banXText}>✕</Text>
          </View>
        </Animatable.View>
      ))}
    </View>
  );
}

// Helper functions
const ROLE_LABELS = {
  goldlane: 'Gold Lane',
  exp_su: 'Exp Lane',
  midlane: 'Mid Lane',
  jungle: 'Jungle',
  roam: 'Roam',
};

function getRoleIcon(role) {
  const icons = {
    goldlane: '💰',
    exp_su: '⚡',
    midlane: '🎯',
    jungle: '🌲',
    roam: '👥',
  };
  return icons[role] || '❓';
}

function getRoleLabel(role) {
  return ROLE_LABELS[role] || 'Unknown';
}

function getRoleStyle(role) {
  const colors = theme.roleColors;
  return {
    backgroundColor: colors[role]?.main || theme.colors.neutral.gray[400],
  };
}

function getRoleColor(role, variant = 'main') {
  const colors = theme.roleColors;
  return colors[role]?.[variant] || theme.colors.neutral.gray[400];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  mapBackground: {
    ...StyleSheet.absoluteFill,
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  teamContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
  },
  teamLeft: {
    left: 0,
  },
  teamRight: {
    right: 0,
  },
  teamLabel: {
    position: 'absolute',
    top: theme.spacing.md,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  team1Label: {
    left: theme.spacing.md,
    color: theme.colors.primary.main,
  },
  team2Label: {
    right: theme.spacing.md,
    color: theme.colors.accent.red,
  },
  roleSlot: {
    position: 'absolute',
    width: 80,
    height: 100,
  },
  roleSlotButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSlot: {
    borderWidth: 3,
    borderColor: theme.colors.accent.gold,
    borderRadius: theme.borderRadius.lg,
  },
  filledSlot: {
    opacity: 1,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  roleIconText: {
    fontSize: 18,
  },
  heroAvatar: {
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  heroImage: {
    width: 45,
    height: 45,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  heroPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitial: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  heroName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  heroPowerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  heroPowerBar: {
    width: 30,
    height: 4,
    backgroundColor: theme.colors.neutral.gray[300],
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs,
  },
  heroPowerFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  heroPowerText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
  },
  roleLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  selectionIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  selectionDot: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
  },
  legend: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  legendTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIcon: {
    marginRight: theme.spacing.xs,
  },
  legendText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  banIndicator: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banX: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banXText: {
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.status.error,
  },
});