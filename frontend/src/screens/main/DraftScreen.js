/**
 * Draft Screen - Main interface for MOBA draft phase
 * Handles real-time drafting with ban/pick mechanics
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Services and contexts
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { DraftService } from '../../services/DraftService';

// Components
import DraftMap from '../../components/draft/DraftMap';
import HeroCard from '../../components/draft/HeroCard';
import TeamPanel from '../../components/draft/TeamPanel';
import DraftPhaseIndicator from '../../components/draft/DraftPhaseIndicator';
import BanPickPanel from '../../components/draft/BanPickPanel';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorMessage from '../../components/common/ErrorMessage';

// Theme
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

export default function DraftScreen({ route, navigation }) {
  // State management
  const [draftState, setDraftState] = useState(null);
  const [availableHeroes, setAvailableHeroes] = useState([]);
  const [bannedHeroes, setBannedHeroes] = useState([]);
  const [team1Lineup, setTeam1Lineup] = useState({});
  const [team2Lineup, setTeam2Lineup] = useState({});
  const [selectedHero, setSelectedHero] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Context hooks
  const { user } = useAuth();
  const { connect, disconnectFromMatch, sendMessage } = useWebSocket();
  
  // Draft service instance
  const draftService = new DraftService();

  // Get draft session from route params
  const { sessionToken, matchId } = route.params || {};

  useEffect(() => {
    if (sessionToken && matchId) {
      initializeDraft();
      // Connect to draft WebSocket
      connect(`ws://localhost:8000/ws/draft/${sessionToken}`);
      
      return () => {
        disconnectFromMatch();
      };
    }
  }, [sessionToken, matchId]);

  // Initialize draft data
  const initializeDraft = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const state = await DraftService.getDraftState(sessionToken);
      setDraftState(state.session);
      setAvailableHeroes(state.available_heroes);
      setBannedHeroes(state.banned_heroes);
      setTeam1Lineup(state.team1_lineup);
      setTeam2Lineup(state.team2_lineup);
      
      // Check if it's my team's turn
      const currentTeamId = state.session.current_team_id;
      const myTeamId = await getMyTeamId();
      setIsMyTurn(currentTeamId === myTeamId);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get current user's team ID
  const getMyTeamId = async () => {
    // This would typically come from user profile or team assignment
    return user?.team_id || 0;
  };

  // Handle hero selection
  const handleHeroSelect = useCallback((hero) => {
    if (!isMyTurn || selectedRole === null) return;
    
    setSelectedHero(hero);
  }, [isMyTurn, selectedRole]);

  // Handle role selection
  const handleRoleSelect = useCallback((role) => {
    if (!isMyTurn) return;
    
    setSelectedRole(role);
  }, [isMyTurn]);

  // Handle pick action
  const handlePick = async () => {
    if (!selectedHero || !selectedRole) {
      Alert.alert('Error', 'Please select both a hero and a role');
      return;
    }

    try {
      await DraftService.makePick({
        heroId: selectedHero.id,
        roleAssigned: selectedRole,
        isBan: false,
      }, sessionToken);

      // Clear selections
      setSelectedHero(null);
      setSelectedRole(null);
      
      // Send WebSocket message
      sendMessage('draft_pick', {
        heroId: selectedHero.id,
        role: selectedRole,
        isBan: false,
      });
      
      // Refresh draft state
      await refreshDraftState();
      
    } catch (err) {
      Alert.alert('Draft Error', err.message);
    }
  };

  // Handle ban action
  const handleBan = async (hero) => {
    if (!isMyTurn) return;

    try {
      await DraftService.makePick({
        heroId: hero.id,
        isBan: true,
      }, sessionToken);
      
      // Send WebSocket message
      sendMessage('draft_ban', {
        heroId: hero.id,
      });
      
      await refreshDraftState();
      
    } catch (err) {
      Alert.alert('Draft Error', err.message);
    }
  };

  // Refresh draft state from server
  const refreshDraftState = async () => {
    try {
      const state = await DraftService.getDraftState(sessionToken);
      setDraftState(state.session);
      setAvailableHeroes(state.available_heroes);
      setBannedHeroes(state.banned_heroes);
      setTeam1Lineup(state.team1_lineup);
      setTeam2Lineup(state.team2_lineup);
      
      // Update turn status
      const currentTeamId = state.session.current_team_id;
      const myTeamId = await getMyTeamId();
      setIsMyTurn(currentTeamId === myTeamId);
      
    } catch (err) {
      console.error('Failed to refresh draft state:', err);
    }
  };

  // Handle WebSocket updates
  const handleDraftUpdate = useCallback((update) => {
    switch (update.type) {
      case 'pick':
        handlePickUpdate(update.data);
        break;
      case 'ban':
        handleBanUpdate(update.data);
        break;
      case 'phase_change':
        handlePhaseChange(update.data);
        break;
      case 'team_turn':
        handleTeamTurnChange(update.data);
        break;
    }
  }, []);

  const handlePickUpdate = (data) => {
    // Animate the pick update
    const { teamId, heroId, role } = data;
    
    // Update local state
    if (teamId === 1) {
      setTeam1Lineup(prev => ({ ...prev, [role]: heroId }));
    } else {
      setTeam2Lineup(prev => ({ ...prev, [role]: heroId }));
    }
    
    // Remove hero from available heroes
    setAvailableHeroes(prev => prev.filter(hero => hero.id !== heroId));
  };

  const handleBanUpdate = (data) => {
    // Animate the ban update
    const { teamId, heroId } = data;
    
    // Add to banned heroes
    setBannedHeroes(prev => [...prev, heroId]);
    
    // Remove from available heroes
    setAvailableHeroes(prev => prev.filter(hero => hero.id !== heroId));
  };

  const handlePhaseChange = (data) => {
    // Update draft phase
    setDraftState(prev => ({ ...prev, phase: data.new_phase }));
  };

  const handleTeamTurnChange = (data) => {
    // Update turn status
    setDraftState(prev => ({ ...prev, current_team_id: data.team_id }));
    checkIfMyTurn(data.team_id);
  };

  const checkIfMyTurn = async (teamId) => {
    const myTeamId = await getMyTeamId();
    setIsMyTurn(teamId === myTeamId);
  };

  // Render loading state
  if (loading) {
    return (
      <LoadingScreen 
        message="Initializing draft session..."
      />
    );
  }

  // Render error state
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={initializeDraft}
        onBack={() => navigation.goBack()}
      />
    );
  }

  // Render main draft interface
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <DraftPhaseIndicator 
          phase={draftState?.phase}
          currentTeamId={draftState?.current_team_id}
          isMyTurn={isMyTurn}
        />
        
        <Text style={styles.sessionTitle}>
          Draft Session {matchId}
        </Text>
        
        {isMyTurn && (
          <Animatable.View 
            animation="pulse" 
            iterationCount="infinite"
            style={styles.yourTurnIndicator}
          >
            <Text style={styles.yourTurnText}>YOUR TURN</Text>
          </Animatable.View>
        )}
      </View>

      {/* Main Draft Map */}
      <View style={styles.draftMapContainer}>
        <DraftMap
          team1Lineup={team1Lineup}
          team2Lineup={team2Lineup}
          bannedHeroes={bannedHeroes}
          onRoleSelect={handleRoleSelect}
          selectedRole={selectedRole}
          availableHeroes={availableHeroes}
        />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomPanel}>
        {isMyTurn && draftState?.phase !== 'waiting' && (
          <BanPickPanel
            availableHeroes={availableHeroes}
            selectedHero={selectedHero}
            selectedRole={selectedRole}
            onHeroSelect={handleHeroSelect}
            onRoleSelect={handleRoleSelect}
            onPick={handlePick}
            onBan={handleBan}
            phase={draftState?.phase}
            currentTeamId={draftState?.current_team_id}
          />
        )}
      </View>

      {/* Team Panels */}
      <View style={[styles.teamPanels, { pointerEvents: 'none' }]}>
        <TeamPanel
          teamId={1}
          lineup={team1Lineup}
          currentTurn={draftState?.current_team_id === 1}
          isMyTeam={false} // Would be determined based on user
        />
        
        <TeamPanel
          teamId={2}
          lineup={team2Lineup}
          currentTurn={draftState?.current_team_id === 2}
          isMyTeam={false} // Would be determined based on user
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  sessionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  yourTurnIndicator: {
    backgroundColor: theme.colors.accent.gold,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
  },
  yourTurnText: {
    color: theme.colors.primary.contrast,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  draftMapContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  bottomPanel: {
    backgroundColor: theme.colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    padding: theme.spacing.md,
    minHeight: 120,
  },
  teamPanels: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});