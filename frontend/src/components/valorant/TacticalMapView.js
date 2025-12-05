/**
 * TacticalMapView - Animated map interface for Valorant matches
 * Shows agent movements, combat, and tactical elements in real-time
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  PanResponder,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

// Theme
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

// Map zones for tactical positioning
const MAP_ZONES = {
  A_SITE: { x: 100, y: height * 0.3, width: 80, height: 60 },
  B_SITE: { x: width - 180, y: height * 0.3, width: 80, height: 60 },
  MID: { x: width * 0.45, y: height * 0.5, width: 60, height: 100 },
  A_RAMP: { x: 120, y: height * 0.4, width: 40, height: 40 },
  B_RAMP: { x: width - 160, y: height * 0.4, width: 40, height: 40 },
  SPLIT: { x: width * 0.45, y: height * 0.35, width: 50, height: 30 },
};

export default function TacticalMapView({
  map,
  agentPositions,
  agents,
  roundState,
  timeRemaining,
  roundStats,
}) {
  // Animation values
  const [agentAnimations, setAgentAnimations] = useState({});
  const [combatIndicators, setCombatIndicators] = useState([]);
  const [utilityEffects, setUtilityEffects] = useState([]);
  const [tacticalMarkers, setTacticalMarkers] = useState([]);
  const mapAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pan responder for map interaction
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      // Map interaction start
    },
    onPanResponderMove: (evt, gestureState) => {
      // Map panning
    },
    onPanResponderRelease: (evt) => {
      // Map interaction end
    },
  });

  useEffect(() => {
    // Animate map elements based on round state
    if (roundState === 'active') {
      Animated.sequence([
        Animated.timing(mapAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(mapAnim, {
          toValue: 1.0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [roundState]);

  useEffect(() => {
    // Pulse animation for active round elements
    if (roundState === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [roundState]);

  // Render agent on map
  const renderAgent = useCallback((agent, position, team, index) => {
    const isDefending = team === 'team1'; // Team1 defending
    const agentColor = isDefending ? theme.colors.accent.blue : theme.colors.accent.red;
    const agentRole = agent?.role || 'Unknown';
    
    // Determine agent icon based on role
    const getAgentIcon = (role) => {
      const icons = {
        Duelist: '⚔️',
        Controller: '🛡️',
        Initiator: '🚀',
        Sentinel: '👁️'
      };
      return icons[role] || '🎯';
    };

    return (
      <Animatable.View
        key={`agent-${team}-${index}`}
        animation={agentAnimations[`${team}-${index}`] || 'fadeIn'}
        duration={500}
        style={[
          styles.agentContainer,
          {
            left: position.x,
            top: position.y,
            borderColor: agentColor,
          },
        ]}
      >
        {/* Agent Avatar */}
        <View style={[
          styles.agentAvatar,
          { backgroundColor: agentColor + '20', borderColor: agentColor }
        ]}>
          <Text style={styles.agentIcon}>
            {getAgentIcon(agentRole)}
          </Text>
        </View>

        {/* Agent Name */}
        <Text style={[
          styles.agentName,
          { color: agentColor }
        ]}>
          {agent?.name || 'Agent'}
        </Text>

        {/* Health/Shield Indicators */}
        <View style={styles.agentStats}>
          <View style={[styles.statBar, { backgroundColor: '#4ade80', width: '100%' }]} />
          <View style={[styles.statBar, { backgroundColor: '#60a5fa', width: '80%' }]} />
        </View>

        {/* Role Indicator */}
        <View style={[
          styles.roleIndicator,
          { backgroundColor: agentColor }
        ]}>
          <Text style={styles.roleText}>
            {agentRole.charAt(0)}
          </Text>
        </View>

        {/* Combat State Indicator */}
        {roundState === 'active' && (
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            style={styles.combatIndicator}
          >
            <View style={[styles.pulseRing, { borderColor: agentColor }]} />
          </Animatable.View>
        )}
      </Animatable.View>
    );
  }, [agentAnimations, roundState, agents]);

  // Render map zones
  const renderMapZone = (zoneName, zone) => {
    const getZoneColor = (zoneName) => {
      const colors = {
        A_SITE: theme.colors.status.success,
        B_SITE: theme.colors.status.success,
        MID: theme.colors.status.info,
        A_RAMP: theme.colors.status.warning,
        B_RAMP: theme.colors.status.warning,
        SPLIT: theme.colors.accent.purple,
      };
      return colors[zoneName] || theme.colors.neutral.gray[400];
    };

    const getZoneLabel = (zoneName) => {
      const labels = {
        A_SITE: 'A Site',
        B_SITE: 'B Site',
        MID: 'Mid',
        A_RAMP: 'A Ramp',
        B_RAMP: 'B Ramp',
        SPLIT: 'Split',
      };
      return labels[zoneName] || zoneName;
    };

    return (
      <View
        key={zoneName}
        style={[
          styles.mapZone,
          {
            left: zone.x,
            top: zone.y,
            width: zone.width,
            height: zone.height,
            borderColor: getZoneColor(zoneName),
          },
        ]}
      >
        <Text style={[
          styles.zoneLabel,
          { color: getZoneColor(zoneName) }
        ]}>
          {getZoneLabel(zoneName)}
        </Text>
        
        {/* Zone activity indicator */}
        <View style={[
          styles.zoneActivity,
          { backgroundColor: getZoneColor(zoneName) }
        ]} />
      </View>
    );
  };

  // Render tactical markers
  const renderTacticalMarkers = () => {
    if (roundState !== 'active') return null;

    return tacticalMarkers.map((marker, index) => (
      <Animatable.View
        key={index}
        animation="bounceIn"
        style={[
          styles.tacticalMarker,
          {
            left: marker.x,
            top: marker.y,
            backgroundColor: marker.color || theme.colors.accent.orange,
          },
        ]}
      >
        <Text style={styles.markerText}>{marker.symbol}</Text>
      </Animatable.View>
    ));
  };

  // Render utility effects
  const renderUtilityEffects = () => {
    return utilityEffects.map((effect, index) => (
      <Animatable.View
        key={index}
        animation="zoomIn"
        style={[
          styles.utilityEffect,
          {
            left: effect.x,
            top: effect.y,
            backgroundColor: effect.color || theme.colors.accent.purple,
          },
        ]}
      >
        <Text style={styles.utilityText}>{effect.symbol}</Text>
      </Animatable.View>
    ));
  };

  // Render combat indicators
  const renderCombatIndicators = () => {
    return combatIndicators.map((indicator, index) => (
      <Animatable.View
        key={index}
        animation="pulse"
        iterationCount={3}
        style={[
          styles.combatIndicator,
          {
            left: indicator.x,
            top: indicator.y,
          },
        ]}
      >
        <Text style={styles.combatText}>
          {indicator.type === 'kill' ? '💥' : '⚡'}
        </Text>
      </Animatable.View>
    ));
  };

  // Render round timer
  const renderRoundTimer = () => {
    const getTimerColor = () => {
      if (timeRemaining > 60) return theme.colors.status.success;
      if (timeRemaining > 30) return theme.colors.status.warning;
      return theme.colors.status.error;
    };

    return (
      <View style={styles.roundTimer}>
        <Animatable.Text
          animation={timeRemaining < 10 ? "pulse" : undefined}
          iterationCount={timeRemaining < 10 ? "infinite" : undefined}
          style={[
            styles.timerText,
            { color: getTimerColor() }
          ]}
        >
          {Math.ceil(timeRemaining)}
        </Animatable.Text>
        <Text style={styles.timerLabel}>sec</Text>
      </View>
    );
  };

  // Render round stats overlay
  const renderRoundStats = () => {
    if (!roundStats || roundState !== 'ended') return null;

    return (
      <Animatable.View
        animation="slideInDown"
        style={styles.roundStatsOverlay}
      >
        <View style={styles.roundStatsCard}>
          <Text style={styles.roundStatsTitle}>
            Round {roundStats.roundNumber} Complete
          </Text>
          
          <View style={styles.roundStatsContent}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Winner:</Text>
              <Text style={[
                styles.statValue,
                { color: roundStats.winner === 'team1' ? theme.colors.accent.blue : theme.colors.accent.red }
              ]}>
                {roundStats.winner === 'team1' ? 'Defenders' : 'Attackers'}
              </Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Kills:</Text>
              <Text style={styles.statValue}>
                {roundStats.kills?.team1 || 0} - {roundStats.kills?.team2 || 0}
              </Text>
            </View>
            
            {roundStats.economy && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Economy:</Text>
                <Text style={styles.statValue}>
                  {roundStats.economy.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <Animated.View
        style={[
          styles.mapBackground,
          {
            transform: [{ scale: mapAnim }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Map Image/Background */}
        <Image
          source={map?.image_url ? { uri: map.image_url } : { uri: 'https://via.placeholder.com/800x600/1a1a2e/ffffff?text=Valorant+Map' }}
          style={styles.mapImage}
          resizeMode="cover"
        />
        
        {/* Map Overlay */}
        <View style={styles.mapOverlay} />
      </Animated.View>

      {/* Map Zones */}
      <View style={styles.zonesContainer}>
        {Object.entries(MAP_ZONES).map(([zoneName, zone]) => 
          renderMapZone(zoneName, zone)
        )}
      </View>

      {/* Tactical Markers */}
      <View style={styles.markersContainer}>
        {renderTacticalMarkers()}
      </View>

      {/* Agents */}
      <View style={styles.agentsContainer}>
        {/* Team 1 Agents (Defenders) */}
        {agentPositions.team1?.map((position, index) => 
          renderAgent(
            agents.team1?.[index],
            position,
            'team1',
            index
          )
        )}
        
        {/* Team 2 Agents (Attackers) */}
        {agentPositions.team2?.map((position, index) => 
          renderAgent(
            agents.team2?.[index],
            position,
            'team2',
            index
          )
        )}
      </View>

      {/* Utility Effects */}
      <View style={styles.utilityContainer}>
        {renderUtilityEffects()}
      </View>

      {/* Combat Indicators */}
      <View style={styles.combatContainer}>
        {renderCombatIndicators()}
      </View>

      {/* Round Timer */}
      {roundState === 'active' && renderRoundTimer()}

      {/* Round Statistics Overlay */}
      {renderRoundStats()}

      {/* Map Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Map Legend</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.colors.accent.blue }]} />
            <Text style={styles.legendText}>Defenders</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.colors.accent.red }]} />
            <Text style={styles.legendText}>Attackers</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: theme.colors.status.success }]} />
            <Text style={styles.legendText}>Sites</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    position: 'relative',
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
  zonesContainer: {
    ...StyleSheet.absoluteFill,
  },
  mapZone: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: theme.borderRadius.base,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  zoneActivity: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    opacity: 0.6,
  },
  agentsContainer: {
    ...StyleSheet.absoluteFill,
  },
  agentContainer: {
    position: 'absolute',
    width: 40,
    height: 50,
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.background.secondary,
  },
  agentAvatar: {
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  agentIcon: {
    fontSize: 16,
  },
  agentName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: 2,
  },
  agentStats: {
    flexDirection: 'column',
    width: '90%',
    marginTop: 2,
  },
  statBar: {
    height: 2,
    borderRadius: theme.borderRadius.full,
    marginVertical: 1,
  },
  roleIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.contrast,
  },
  combatIndicator: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    opacity: 0.5,
  },
  tacticalMarkersContainer: {
    ...StyleSheet.absoluteFill,
  },
  tacticalMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    fontSize: 12,
    color: theme.colors.primary.contrast,
  },
  utilityContainer: {
    ...StyleSheet.absoluteFill,
  },
  utilityEffect: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  utilityText: {
    fontSize: 16,
    color: theme.colors.primary.contrast,
  },
  combatContainer: {
    ...StyleSheet.absoluteFill,
  },
  combatIndicator: {
    position: 'absolute',
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  combatText: {
    fontSize: 18,
  },
  roundTimer: {
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'center',
  },
  timerText: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
  },
  timerLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  roundStatsOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  roundStatsCard: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.focus,
  },
  roundStatsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  roundStatsContent: {
    gap: theme.spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  statValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  legendTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  legendItems: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.xs,
  },
  legendText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
});