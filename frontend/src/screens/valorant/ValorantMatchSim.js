/**
 * Valorant Match Simulation Screen
 * Real-time tactical shooter match with animated map view
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
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
import TacticalMapView from '../../components/valorant/TacticalMapView';
import RoundInterface from '../../components/valorant/RoundInterface';
import TimeoutInterface from '../../components/valorant/TimeoutInterface';
import Scoreboard from '../../components/valorant/Scoreboard';
import TeamStats from '../../components/valorant/TeamStats';
import MatchControls from '../../components/valorant/MatchControls';

// Theme
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

export default function ValorantMatchSim({ route, navigation }) {
  // State management
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState({ team1: 0, team2: 0 });
  const [agents, setAgents] = useState({ team1: [], team2: [] });
  const [agentPositions, setAgentPositions] = useState({ team1: [], team2: [] });
  const [roundState, setRoundState] = useState('planning'); // planning, active, ended
  const [timeRemaining, setTimeRemaining] = useState(100); // Round timer
  const [matchData, setMatchData] = useState(null);
  const [isAITurn, setIsAITurn] = useState(false);
  const [roundHistory, setRoundHistory] = useState([]);
  const [timeoutsUsed, setTimeoutsUsed] = useState({ team1: 0, team2: 0 });
  const [maxTimeouts] = useState(2);
  const [economicState, setEconomicState] = useState({ team1: 'full_buy', team2: 'full_buy' });
  const [matchPhase, setMatchPhase] = useState(' pistol'); // pistol, eco, force, full_buy
  const [roundStats, setRoundStats] = useState(null);
  const [matchEnded, setMatchEnded] = useState(false);
  const [showTimeoutInterface, setShowTimeoutInterface] = useState(false);

  // Animations
  const roundTimerAnim = useRef(new Animated.Value(100)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;

  // Context hooks
  const { user } = useAuth();
  const { connectToMatch, disconnectFromMatch, sendMatchMessage } = useWebSocket();
  
  // Service instances
  const valorantService = new ValorantService();
  const aiOpponentService = new AIOpponentService();

  // Get match data from route
  const { matchData: initialMatchData, isAIMatch = false } = route.params;

  useEffect(() => {
    initializeMatch();
  }, []);

  // Initialize match
  const initializeMatch = async () => {
    try {
      setMatchData(initialMatchData);
      
      // Set up initial agent positions
      const initialPositions = initializeAgentPositions(initialMatchData);
      setAgentPositions(initialPositions);

      // Set up agents
      setAgents({
        team1: Object.values(initialMatchData.agents),
        team2: isAIMatch ? await generateAIAgents() : []
      });

      // Connect to WebSocket for real-time updates
      if (isAIMatch) {
        await aiOpponentService.initializeOpponent(initialMatchData.aiOpponent.id);
        connectToMatch(initialMatchData.matchId);
      }

      // Start first round
      await startRound();

    } catch (error) {
      console.error('Failed to initialize match:', error);
      Alert.alert('Match Error', 'Failed to initialize match');
    }
  };

  // Initialize agent positions on map
  const initializeAgentPositions = (matchData) => {
    // Define spawn positions for each team
    const team1Spawns = [
      { x: 100, y: height * 0.8 }, // A Site spawn
      { x: 150, y: height * 0.8 }, // A Site spawn
      { x: 200, y: height * 0.8 }, // Mid spawn
      { x: 250, y: height * 0.8 }, // Mid spawn
      { x: 300, y: height * 0.8 }, // B Site spawn
    ];

    const team2Spawns = [
      { x: width - 100, y: height * 0.2 }, // A Site spawn
      { x: width - 150, y: height * 0.2 }, // A Site spawn
      { x: width - 200, y: height * 0.2 }, // Mid spawn
      { x: width - 250, y: height * 0.2 }, // Mid spawn
      { x: width - 300, y: height * 0.2 }, // B Site spawn
    ];

    return {
      team1: team1Spawns,
      team2: team2Spawns
    };
  };

  // Generate AI team agents
  const generateAIAgents = async () => {
    const aiAgents = await aiOpponentService.selectAgentsAdaptively(
      initialMatchData.map.id,
      { currentRound, score }
    );
    return aiAgents;
  };

  // Start a new round
  const startRound = async () => {
    if (matchEnded) return;

    try {
      setRoundState('planning');
      setTimeRemaining(100);

      // Update economic state
      updateEconomicState();

      // Animate round timer
      Animated.timing(roundTimerAnim, {
        toValue: 0,
        duration: 100000, // 100 seconds
        useNativeDriver: false,
      }).start();

      // Simulate planning phase (5 seconds)
      setTimeout(async () => {
        setRoundState('active');
        
        if (isAIMatch && currentRound % 2 === 0) {
          setIsAITurn(true);
          await simulateAIRound();
        } else {
          setIsAITurn(false);
          await simulatePlayerRound();
        }

      }, 5000);

    } catch (error) {
      console.error('Failed to start round:', error);
    }
  };

  // Simulate player round
  const simulatePlayerRound = async () => {
    try {
      // Simulate round progression
      const roundResult = await simulateRound('team1');
      
      // Update positions based on round outcome
      await updateAgentPositions(roundResult);
      
      // Update score
      if (roundResult.winner === 'team1') {
        setScore(prev => ({ ...prev, team1: prev.team1 + 1 }));
        
        // Animate score change
        Animated.sequence([
          Animated.timing(scoreAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scoreAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setScore(prev => ({ ...prev, team2: prev.team2 + 1 }));
      }

      setRoundStats(roundResult);
      setRoundState('ended');

      // Check for match end
      if (checkMatchEnd()) {
        endMatch();
      } else {
        // Prepare next round
        setTimeout(() => {
          setCurrentRound(prev => prev + 1);
          setRoundState('planning');
          startRound();
        }, 3000);
      }

    } catch (error) {
      console.error('Failed to simulate player round:', error);
    }
  };

  // Simulate AI round
  const simulateAIRound = async () => {
    try {
      // AI makes tactical decisions
      const aiDecisions = await aiOpponentService.makeTacticalDecisions({
        roundNumber: currentRound,
        score,
        economicState: economicState.team2,
        agentPositions
      });

      // Simulate round with AI decisions
      const roundResult = await simulateRound('team2', aiDecisions);
      
      // Update positions
      await updateAgentPositions(roundResult);
      
      // Update score
      if (roundResult.winner === 'team2') {
        setScore(prev => ({ ...prev, team2: prev.team2 + 1 }));
        
        Animated.sequence([
          Animated.timing(scoreAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scoreAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setScore(prev => ({ ...prev, team1: prev.team1 + 1 }));
      }

      setRoundStats(roundResult);
      setRoundState('ended');

      // Update round history
      setRoundHistory(prev => [...prev, roundResult]);

      // Check for match end
      if (checkMatchEnd()) {
        endMatch();
      } else {
        setTimeout(() => {
          setCurrentRound(prev => prev + 1);
          setRoundState('planning');
          startRound();
        }, 3000);
      }

      setIsAITurn(false);

    } catch (error) {
      console.error('Failed to simulate AI round:', error);
      setIsAITurn(false);
    }
  };

  // Simulate round outcome
  const simulateRound = async (actingTeam, decisions = {}) => {
    try {
      let roundResult;

      if (isAIMatch) {
        roundResult = await valorantService.simulateRoundOutcome(
          matchData.matchId,
          agents.team1,
          agents.team2,
          decisions
        );
      } else {
        // Human vs human simulation
        roundResult = await valorantService.simulateRoundOutcome(
          matchData.matchId,
          agents.team1,
          agents.team2
        );
      }

      return roundResult;

    } catch (error) {
      console.error('Failed to simulate round:', error);
      // Return default round result
      return {
        winner: Math.random() > 0.5 ? 'team1' : 'team2',
        roundTime: Math.floor(Math.random() * 60) + 30,
        kills: { team1: Math.floor(Math.random() * 3), team2: Math.floor(Math.random() * 3) },
        economy: 'full_buy'
      };
    }
  };

  // Update agent positions based on round outcome
  const updateAgentPositions = async (roundResult) => {
    // Animate agent movements based on round result
    const newPositions = { ...agentPositions };
    
    if (roundResult.winner === 'team1') {
      // Team 1 advances, Team 2 falls back
      newPositions.team1 = newPositions.team1.map(pos => ({
        x: pos.x + Math.random() * 50,
        y: pos.y - Math.random() * 30
      }));
      
      newPositions.team2 = newPositions.team2.map(pos => ({
        x: pos.x - Math.random() * 30,
        y: pos.y + Math.random() * 20
      }));
    } else {
      // Team 2 advances, Team 1 falls back
      newPositions.team2 = newPositions.team2.map(pos => ({
        x: pos.x - Math.random() * 50,
        y: pos.y + Math.random() * 30
      }));
      
      newPositions.team1 = newPositions.team1.map(pos => ({
        x: pos.x + Math.random() * 30,
        y: pos.y - Math.random() * 20
      }));
    }

    setAgentPositions(newPositions);
  };

  // Update economic state
  const updateEconomicState = () => {
    // Simple economic state progression
    const team1State = getNextEconomicState(economicState.team1, score.team1, score.team2);
    const team2State = getNextEconomicState(economicState.team2, score.team2, score.team1);
    
    setEconomicState({ team1: team1State, team2: team2State });
    setMatchPhase(team1State);
  };

  // Get next economic state
  const getNextEconomicState = (currentState, myScore, enemyScore) => {
    const states = ['pistol', 'eco', 'force', 'full_buy'];
    const currentIndex = states.indexOf(currentState);
    
    // Simple economic progression
    if (myScore > enemyScore + 3) {
      return 'full_buy';
    } else if (enemyScore > myScore + 2) {
      return 'eco';
    } else {
      return states[Math.min(currentIndex + 1, 3)];
    }
  };

  // Use timeout with enhanced options
  const useTimeout = async (timeoutType = 'manual', tacticData = null) => {
    if (timeoutsUsed.team1 >= maxTimeouts) {
      Alert.alert('No Timeouts', 'You have used all available timeouts');
      return;
    }

    try {
      setTimeoutsUsed(prev => ({ ...prev, team1: prev.team1 + 1 }));

      // Handle different timeout types
      switch (timeoutType) {
        case 'continue_same_strategy':
          // Option A: Continue with same strategy
          const timeoutData1 = await valorantService.createTimeoutCall(
            matchData.matchId,
            'team1',
            currentRound,
            'continue same strategy'
          );
          setShowTimeoutInterface(false);
          continueAfterTimeout();
          break;
          
        case 'tactical_change':
          // Option B: Apply new tactic
          const timeoutData2 = await valorantService.createTimeoutCall(
            matchData.matchId,
            'team1',
            currentRound,
            'tactical adjustment',
            tacticData
          );
          setShowTimeoutInterface(false);
          continueAfterTimeout();
          break;
          
        default:
          // Manual timeout call - show enhanced interface
          const timeoutData3 = await valorantService.createTimeoutCall(
            matchData.matchId,
            'team1',
            currentRound,
            'manual timeout'
          );
          setShowTimeoutInterface(true);
          break;
      }

      // AI adapts to timeout with tactic data if provided
      if (isAIMatch) {
        aiOpponentService.adaptToTimeout(tacticData);
      }

      console.log(`Timeout used: ${timeoutType}`, tacticData);

    } catch (error) {
      Alert.alert('Timeout Error', error.message);
      setShowTimeoutInterface(false);
    }
  };

  // Continue after timeout
  const continueAfterTimeout = () => {
    // Resume the match after timeout
    setRoundState('active');
  };

  // Check match end conditions
  const checkMatchEnd = () => {
    const team1Score = score.team1;
    const team2Score = score.team2;
    
    // Best of 13 (first to 7) or overtime rules
    if (team1Score >= 7 || team2Score >= 7) {
      return true;
    }
    
    // Check for early termination (team leads by 5+ after 10 rounds)
    if (currentRound >= 10 && Math.abs(team1Score - team2Score) >= 5) {
      return true;
    }
    
    return false;
  };

  // End match
  const endMatch = () => {
    setMatchEnded(true);
    
    const winner = score.team1 > score.team2 ? 'Your Team' : (isAIMatch ? matchData.aiOpponent.name : 'Opponent Team');
    const finalScore = `${score.team1} - ${score.team2}`;
    
    Alert.alert(
      'Match Complete!',
      `${winner} wins ${finalScore}`,
      [
        {
          text: 'View Match Report',
          onPress: () => navigation.navigate('MatchReport', { 
            matchData: { 
              ...matchData, 
              finalScore: score, 
              roundHistory,
              winner 
            }
          })
        },
        {
          text: 'Back to Menu',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  // Handle match controls
  const handleMatchControl = (action) => {
    switch (action) {
      case 'pause':
        setRoundState(roundState === 'active' ? 'paused' : 'active');
        break;
      case 'timeout':
        // Show enhanced timeout interface
        setShowTimeoutInterface(true);
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
              onPress: () => {
                setScore(prev => ({ ...prev, team2: 13 }));
                endMatch();
              }
            }
          ]
        );
        break;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.accent.purple, theme.colors.primary.dark]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Top HUD */}
      <View style={styles.topHUD}>
        <Scoreboard 
          score={score}
          currentRound={currentRound}
          isAITurn={isAITurn}
          matchPhase={matchPhase}
          economicState={economicState}
        />
      </View>

      {/* Main Tactical Map */}
      <View style={styles.mapContainer}>
        <TacticalMapView
          map={matchData?.map}
          agentPositions={agentPositions}
          agents={agents}
          roundState={roundState}
          timeRemaining={timeRemaining}
          roundStats={roundStats}
        />
      </View>

      {/* Bottom Interface */}
      <View style={styles.bottomInterface}>
        {!matchEnded && (
          <>
            {/* Round Interface */}
            {roundState === 'active' && (
              <RoundInterface
                currentRound={currentRound}
                timeRemaining={timeRemaining}
                roundState={roundState}
                onTimeout={() => handleMatchControl('timeout')}
              />
            )}

            {/* Team Stats */}
            <TeamStats
              agents={agents}
              roundHistory={roundHistory}
              economicState={economicState}
            />
          </>
        )}

        {/* Match Controls */}
        <MatchControls
          roundState={roundState}
          timeoutsUsed={timeoutsUsed.team1}
          maxTimeouts={maxTimeouts}
          matchEnded={matchEnded}
          onControlPress={handleMatchControl}
        />
      </View>

      {/* Enhanced Timeout Interface */}
      {showTimeoutInterface && (
        <TimeoutInterface
          timeoutsUsed={timeoutsUsed.team1}
          maxTimeouts={maxTimeouts}
          onTimeoutSelect={useTimeout}
          onContinue={continueAfterTimeout}
          isVisible={showTimeoutInterface}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHUD: {
    height: 80,
    backgroundColor: theme.colors.background.secondary,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.accent.gold,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  bottomInterface: {
    height: 200,
    backgroundColor: theme.colors.background.secondary,
    borderTopWidth: 2,
    borderTopColor: theme.colors.accent.gold,
  },
});