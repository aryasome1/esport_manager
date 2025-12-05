/**
 * Valorant Draft Screen - Agent selection and match preparation
 * Tactical shooter division interface
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
import { ValorantService } from '../../services/ValorantService';
import { AIOpponentService } from '../../services/AIOpponentService';

// Components
import TimeoutInterface from '../../components/valorant/TimeoutInterface';
import LoadingScreen from '../../components/common/LoadingScreen';
import ErrorMessage from '../../components/common/ErrorMessage';

// Theme
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

export default function ValorantDraftScreen({ route, navigation }) {
  // State management
  const [agents, setAgents] = useState([]);
  const [maps, setMaps] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState({});
  const [selectedMap, setSelectedMap] = useState(null);
  const [aiOpponents, setAIOpponents] = useState([]);
  const [selectedAIOpponent, setSelectedAIOpponent] = useState(null);
  const [teamComposition, setTeamComposition] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [draftPhase, setDraftPhase] = useState('agent_selection'); // agent_selection, map_selection, ready

  // Context hooks
  const { user } = useAuth();
  const { connectToMatch, disconnectFromMatch, sendMatchMessage } = useWebSocket();
  
  // Service instances
  const valorantService = new ValorantService();
  const aiOpponentService = new AIOpponentService();

  // Get match parameters from route
  const { matchId, isAIMatch = true } = route.params || {};

  useEffect(() => {
    initializeValorantDraft();
  }, [matchId]);

  // Initialize Valorant draft interface
  const initializeValorantDraft = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available agents and maps
      const agentsData = await valorantService.getAvailableAgents();
      const mapsData = await valorantService.getAvailableMaps();
      const aiOpponentsData = isAIMatch ? await aiOpponentService.getAvailableOpponents() : [];

      setAgents(agentsData);
      setMaps(mapsData);
      setAIOpponents(aiOpponentsData);

      // Initialize team composition
      const initialComposition = {
        Duelist: null,
        Controller: null,
        Initiator: null,
        Sentinel: null,
        Flex: null
      };
      setTeamComposition(initialComposition);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle agent selection
  const handleAgentSelect = useCallback((agent) => {
    if (Object.keys(selectedAgents).length >= 5) {
      Alert.alert('Team Full', 'Your team already has 5 agents selected');
      return;
    }

    // Check team composition
    const role = agent.role;
    const currentAgentForRole = Object.entries(selectedAgents).find(([key, selectedAgent]) => 
      selectedAgent?.role === role
    );

    if (currentAgentForRole) {
      Alert.alert(
        'Role Already Filled',
        `You already have a ${role} selected. Do you want to replace it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Replace', 
            onPress: () => {
              // Remove current agent for this role
              const newSelectedAgents = { ...selectedAgents };
              delete newSelectedAgents[currentAgentForRole[0]];
              setSelectedAgents(newSelectedAgents);
              
              // Add new agent
              addAgentToTeam(agent);
            }
          }
        ]
      );
    } else {
      addAgentToTeam(agent);
    }
  }, [selectedAgents]);

  // Add agent to team
  const addAgentToTeam = (agent) => {
    const teamSlot = findAvailableTeamSlot(agent.role);
    if (teamSlot) {
      setSelectedAgents(prev => ({
        ...prev,
        [teamSlot]: agent
      }));
    }
  };

  // Find available team slot for agent role
  const findAvailableTeamSlot = (role) => {
    const roleSlots = {
      Duelist: 'duelist',
      Controller: 'controller',
      Initiator: 'initiator',
      Sentinel: 'sentinel',
      Flex: 'flex'
    };

    const preferredSlot = roleSlots[role];
    if (!selectedAgents[preferredSlot]) {
      return preferredSlot;
    }

    // If preferred slot is taken, look for flex slot
    if (role !== 'Flex' && !selectedAgents['flex']) {
      return 'flex';
    }

    return null;
  };

  // Handle map selection
  const handleMapSelect = useCallback((map) => {
    setSelectedMap(map);
    setDraftPhase('agent_selection'); // Reset to agent selection when map changes
  }, []);

  // Handle AI opponent selection
  const handleAIOpponentSelect = useCallback((aiOpponent) => {
    setSelectedAIOpponent(aiOpponent);
  }, []);

  // Validate team composition
  const validateTeamComposition = useCallback(() => {
    const composition = {
      Duelist: 0,
      Controller: 0,
      Initiator: 0,
      Sentinel: 0
    };

    Object.values(selectedAgents).forEach(agent => {
      if (agent && composition.hasOwnProperty(agent.role)) {
        composition[agent.role] += 1;
      }
    });

    // Check requirements
    const requiredRoles = ['Controller', 'Initiator', 'Sentinel', 'Duelist'];
    const missingRoles = requiredRoles.filter(role => composition[role] === 0);
    const duplicateRoles = Object.entries(composition).filter(([role, count]) => count > 1);

    if (missingRoles.length > 0) {
      Alert.alert(
        'Incomplete Team',
        `Missing required roles: ${missingRoles.join(', ')}`
      );
      return false;
    }

    if (duplicateRoles.length > 0) {
      Alert.alert(
        'Role Duplication',
        `Cannot have multiple agents in same role: ${duplicateRoles.map(([role]) => role).join(', ')}`
      );
      return false;
    }

    return true;
  }, [selectedAgents]);

  // Start match
  const handleStartMatch = async () => {
    if (!selectedMap) {
      Alert.alert('Map Required', 'Please select a map for the match');
      return;
    }

    if (!validateTeamComposition()) {
      return;
    }

    if (isAIMatch && !selectedAIOpponent) {
      Alert.alert('AI Opponent Required', 'Please select an AI opponent for the match');
      return;
    }

    try {
      setIsWaitingForAI(true);

      // Initialize AI opponent
      if (isAIMatch && selectedAIOpponent) {
        await aiOpponentService.initializeOpponent(selectedAIOpponent.id);
      }

      // Start the match
      const matchData = {
        matchId,
        division: 'tactical',
        map: selectedMap,
        agents: selectedAgents,
        teamComposition,
        aiOpponent: selectedAIOpponent,
        isAIMatch
      };

      // Navigate to match simulation
      navigation.navigate('ValorantMatchSim', {
        matchData,
        isAIMatch
      });

    } catch (err) {
      Alert.alert('Match Start Error', err.message);
      setIsWaitingForAI(false);
    }
  };

  // Get agent recommendations for empty slots
  const getAgentRecommendations = useCallback((role, mapId) => {
    return valorantService.getAgentRecommendations(user.id, mapId, teamComposition, role);
  }, [user.id, teamComposition]);

  // Render loading state
  if (loading) {
    return (
      <LoadingScreen 
        message="Loading Valorant draft interface..." 
        backgroundColor={theme.colors.background.primary}
      />
    );
  }

  // Render error state
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={initializeValorantDraft}
        onBack={() => navigation.goBack()}
      />
    );
  }

  // Render AI preparation screen
  if (isWaitingForAI) {
    return (
      <View style={styles.waitingContainer}>
        <LinearGradient
          colors={[theme.colors.accent.purple, theme.colors.primary.dark]}
          style={StyleSheet.absoluteFill}
        />
        
        <Animatable.View 
          animation="pulse" 
          iterationCount="infinite"
          style={styles.aiIcon}
        >
          <Text style={styles.aiIconText}>🤖</Text>
        </Animatable.View>
        
        <Text style={styles.waitingTitle}>
          {selectedAIOpponent ? `${selectedAIOpponent.name} is preparing...` : 'Initializing AI opponent...'}
        </Text>
        
        <Text style={styles.waitingDescription}>
          {selectedAIOpponent 
            ? `${selectedAIOpponent.name} is analyzing your team composition and preparing adaptive strategies.`
            : 'AI opponent is being initialized with adaptive learning capabilities.'
          }
        </Text>
        
        <View style={styles.aiPreview}>
          {selectedAIOpponent && (
            <AIOpponentDisplay 
              aiOpponent={selectedAIOpponent}
              showDetails={true}
            />
          )}
        </View>
      </View>
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
        <Text style={styles.title}>
          Valorant Division - Agent Selection
        </Text>
        
        <View style={styles.progressIndicator}>
          <View style={[
            styles.progressStep, 
            draftPhase === 'agent_selection' && styles.activeStep
          ]}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepLabel}>Agents</Text>
          </View>
          
          <View style={[
            styles.progressStep, 
            draftPhase === 'map_selection' && styles.activeStep
          ]}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepLabel}>Map</Text>
          </View>
          
          <View style={[
            styles.progressStep, 
            draftPhase === 'ready' && styles.activeStep
          ]}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepLabel}>Ready</Text>
          </View>
        </View>
      </View>

      {/* Team Composition */}
      <View style={styles.teamSection}>
        <Text style={styles.sectionTitle}>Your Team Composition</Text>
        <TeamCompositionView
          teamComposition={teamComposition}
          selectedAgents={selectedAgents}
          onAgentRemove={(slot) => {
            const newSelectedAgents = { ...selectedAgents };
            delete newSelectedAgents[slot];
            setSelectedAgents(newSelectedAgents);
          }}
          recommendations={getAgentRecommendations}
        />
      </View>

      {/* Agent Selection */}
      <View style={styles.agentsSection}>
        <Text style={styles.sectionTitle}>Select Agents</Text>
        <AgentSelectionPanel
          agents={agents}
          selectedAgents={selectedAgents}
          onAgentSelect={handleAgentSelect}
          getRecommendations={getAgentRecommendations}
        />
      </View>

      {/* Map Selection */}
      <View style={styles.mapSection}>
        <Text style={styles.sectionTitle}>Choose Map</Text>
        <MapPoolDisplay
          maps={maps}
          selectedMap={selectedMap}
          onMapSelect={handleMapSelect}
        />
      </View>

      {/* AI Opponent Selection (for AI matches) */}
      {isAIMatch && (
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>Choose AI Opponent</Text>
          <AIOpponentDisplay
            aiOpponents={aiOpponents}
            selectedOpponent={selectedAIOpponent}
            onOpponentSelect={handleAIOpponentSelect}
          />
        </View>
      )}

      {/* Start Match Button */}
      <View style={styles.startSection}>
        <TouchableOpacity
          style={[
            styles.startButton,
            (!selectedMap || Object.keys(selectedAgents).length < 4 || 
             (isAIMatch && !selectedAIOpponent)) && styles.disabledButton
          ]}
          onPress={handleStartMatch}
          disabled={!selectedMap || Object.keys(selectedAgents).length < 4 || 
                   (isAIMatch && !selectedAIOpponent)}
        >
          <Text style={styles.startButtonText}>
            {isAIMatch ? 'Start AI Match' : 'Start Match'}
          </Text>
        </TouchableOpacity>
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
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xl,
  },
  progressStep: {
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral.gray[200],
  },
  activeStep: {
    backgroundColor: theme.colors.primary.main,
  },
  stepNumber: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  stepLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  teamSection: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  agentsSection: {
    flex: 1,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  mapSection: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  aiSection: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  startSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
  },
  startButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: theme.colors.neutral.gray[400],
  },
  startButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.contrast,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  aiIcon: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  aiIconText: {
    fontSize: 36,
  },
  waitingTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.contrast,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  waitingDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary.contrast,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  aiPreview: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
});