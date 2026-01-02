/**
 * Valorant Match Simulation Screen
 * Esports broadcast-style UI with team panels and tactical map
 * REDESIGNED: Professional match viewer layout
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  ImageBackground,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Services
import { ValorantService } from '../../services/ValorantService';
import { AIOpponentService } from '../../services/AIOpponentService';

// Theme
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

// Simulation Config
const SIM_TICK_RATE = 100;
const AGENT_SPEED = 3;
const COMBAT_RANGE = 40;
const BASE_ACCURACY = 0.15;
const MAX_ROUNDS = 13;

// Team Colors
const TEAM_COLORS = {
  team1: {
    primary: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.5)',
  },
  team2: {
    primary: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.5)',
  },
};

// Agent Role Icons
const ROLE_ICONS = {
  Duelist: '⚔️',
  Controller: '🌀',
  Initiator: '🎯',
  Sentinel: '🛡️',
  Flex: '✦',
};

export default function ValorantMatchSim({ route, navigation }) {
  // State
  const [currentRound, setCurrentRound] = useState(1);
  const [score, setScore] = useState({ team1: 0, team2: 0 });
  const [roundState, setRoundState] = useState('planning');
  const [timeRemaining, setTimeRemaining] = useState(100);
  const [matchData, setMatchData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matchEnded, setMatchEnded] = useState(false);

  // Map data from Valorant API
  const [mapData, setMapData] = useState(null);

  // Agent States - includes HP, position, status
  const [team1Agents, setTeam1Agents] = useState([]);
  const [team2Agents, setTeam2Agents] = useState([]);

  // Simulation positions for map
  const [simPositions, setSimPositions] = useState({ team1: [], team2: [] });

  // Services
  const valorantService = new ValorantService();
  const aiOpponentService = new AIOpponentService();

  // Route params - now includes selectedAgents from AgentPickScreen
  const { matchId, matchData: paramMatchData, isAIMatch = false, selectedAgents = [], teamSide = 'team1' } = route.params || {};

  // Refs
  const timerRef = useRef(null);
  const simIntervalRef = useRef(null);

  // Initialize
  useEffect(() => {
    initializeMatch();
    return () => stopSimulation();
  }, []);

  const stopSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
  };

  const initializeMatch = async () => {
    try {
      let data = null;

      // Always fetch from API to get full match data (team names, player info)
      if (matchId) {
        try {
          data = await valorantService.getMatch(matchId);
        } catch (err) {
          console.error("Fetch Error", err);
          // Fallback to paramMatchData if API fails
          data = paramMatchData;
        }
      } else {
        data = paramMatchData;
      }

      if (!data) {
        Alert.alert("Error", "No match data available.");
        navigation.goBack();
        return;
      }

      setMatchData(data);

      // Get player data from backend API
      const agentsDict = data.agents || {};
      const agentsList = Object.values(agentsDict);
      const t1FromApi = agentsList.filter(a => a.teamId === data.team1_id);
      const t2FromApi = agentsList.filter(a => a.teamId === data.team2_id);

      // Process agents - prioritize selectedAgents from AgentPickScreen
      let team1AgentsData = [];
      let team2AgentsData = [];

      if (selectedAgents && selectedAgents.length >= 5) {
        // Use agents selected in AgentPickScreen, but get player names from API
        team1AgentsData = selectedAgents.map((agent, idx) => {
          // Try to match with API player data
          const playerFromApi = t1FromApi[idx];
          return {
            id: `t1_${idx}`,
            name: agent.name,
            role: agent.role,
            icon: agent.icon,
            hp: 100,
            isDead: false,
            // Use player name from API if available
            player_name: playerFromApi?.player_name || `Player ${idx + 1}`,
            player_id: playerFromApi?.player_id,
          };
        });
      } else if (t1FromApi.length >= 5) {
        // Use API data directly (includes player_name from backend)
        team1AgentsData = t1FromApi.map(a => ({ ...a, hp: 100, isDead: false }));
      } else {
        // Fallback defaults
        team1AgentsData = [
          { id: 't1_1', name: 'Jett', role: 'Duelist', hp: 100, isDead: false, player_name: 'Player 1' },
          { id: 't1_2', name: 'Sage', role: 'Sentinel', hp: 100, isDead: false, player_name: 'Player 2' },
          { id: 't1_3', name: 'Sova', role: 'Initiator', hp: 100, isDead: false, player_name: 'Player 3' },
          { id: 't1_4', name: 'Omen', role: 'Controller', hp: 100, isDead: false, player_name: 'Player 4' },
          { id: 't1_5', name: 'Cypher', role: 'Sentinel', hp: 100, isDead: false, player_name: 'Player 5' },
        ];
      }

      // Enemy team (team2) - use API data directly (includes player_name)
      if (t2FromApi.length >= 5) {
        team2AgentsData = t2FromApi.map(a => ({ ...a, hp: 100, isDead: false }));
      } else {
        // Fallback defaults for enemy
        team2AgentsData = [
          { id: 't2_1', name: 'Reyna', role: 'Duelist', hp: 100, isDead: false, player_name: 'Enemy 1' },
          { id: 't2_2', name: 'Brimstone', role: 'Controller', hp: 100, isDead: false, player_name: 'Enemy 2' },
          { id: 't2_3', name: 'Breach', role: 'Initiator', hp: 100, isDead: false, player_name: 'Enemy 3' },
          { id: 't2_4', name: 'Killjoy', role: 'Sentinel', hp: 100, isDead: false, player_name: 'Enemy 4' },
          { id: 't2_5', name: 'Raze', role: 'Duelist', hp: 100, isDead: false, player_name: 'Enemy 5' },
        ];
      }

      // Fetch agent icons from Valorant API for both teams
      try {
        const agentsResponse = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
        const agentsJson = await agentsResponse.json();
        if (agentsJson.status === 200) {
          const agentIcons = {};
          agentsJson.data.forEach(agent => {
            agentIcons[agent.displayName.toLowerCase()] = agent.displayIcon;
          });

          // Assign icons to team1 agents (if they don't already have one from AgentPickScreen)
          team1AgentsData = team1AgentsData.map(a => ({
            ...a,
            icon: a.icon || agentIcons[a.name?.toLowerCase()] || null,
          }));

          // Assign icons to team2 agents
          team2AgentsData = team2AgentsData.map(a => ({
            ...a,
            icon: a.icon || agentIcons[a.name?.toLowerCase()] || null,
          }));
        }
      } catch (iconErr) {
        console.warn('Failed to fetch agent icons:', iconErr);
      }

      console.log('Team 1 Agents:', team1AgentsData);
      console.log('Team 2 Agents:', team2AgentsData);

      setTeam1Agents(team1AgentsData);
      setTeam2Agents(team2AgentsData);

      // Fetch map data from Valorant API
      await fetchMapData(data.map?.name || 'Ascent');

      // Initialize positions for map
      initializePositions();

      setIsLoading(false);
      startRound(1);

    } catch (error) {
      console.error("Init Error", error);
      Alert.alert("Error", "Initialization failed");
      navigation.goBack();
    }
  };

  // Fetch map data from Valorant API
  const fetchMapData = async (mapName) => {
    try {
      const response = await fetch('https://valorant-api.com/v1/maps');
      const json = await response.json();
      if (json.status === 200) {
        // Find matching map by name
        const foundMap = json.data.find(m =>
          m.displayName.toLowerCase() === mapName.toLowerCase()
        );
        if (foundMap) {
          setMapData(foundMap);
        } else {
          // Default to Ascent if not found
          const defaultMap = json.data.find(m => m.displayName === 'Ascent');
          setMapData(defaultMap || json.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch map data:', error);
    }
  };

  // Map dimensions for positioning
  const MAP_WIDTH = 360;
  const MAP_HEIGHT = 280;

  // Objective positions on map
  const OBJECTIVES = {
    siteA: { x: 60, y: 80 },
    siteB: { x: 300, y: 80 },
    mid: { x: 180, y: 140 },
    defenderSpawn: { x: 60, y: 200 },
    attackerSpawn: { x: 300, y: 200 },
  };

  const initializePositions = () => {
    // Defenders (Team 1) spawn near defender spawn
    const t1Positions = [
      { x: 50, y: 80, target: OBJECTIVES.siteA },    // Hold A
      { x: 70, y: 100, target: OBJECTIVES.siteA },   // Hold A
      { x: 160, y: 140, target: OBJECTIVES.mid },    // Hold Mid
      { x: 280, y: 80, target: OBJECTIVES.siteB },   // Hold B
      { x: 300, y: 100, target: OBJECTIVES.siteB },  // Hold B
    ];
    // Attackers (Team 2) spawn near attacker spawn
    const t2Positions = [
      { x: 300, y: 220, target: OBJECTIVES.mid },    // Push mid
      { x: 280, y: 230, target: OBJECTIVES.mid },    // Push mid
      { x: 260, y: 220, target: OBJECTIVES.siteA },  // Push A
      { x: 240, y: 230, target: OBJECTIVES.siteA },  // Push A
      { x: 320, y: 220, target: OBJECTIVES.siteB },  // Lurk B
    ];
    setSimPositions({ team1: t1Positions, team2: t2Positions });
  };

  const startRound = (roundNum) => {
    setRoundState('active');
    setTimeRemaining(100);

    // Reset agent HP for new round
    setTeam1Agents(prev => prev.map(a => ({ ...a, hp: 100, isDead: false })));
    setTeam2Agents(prev => prev.map(a => ({ ...a, hp: 100, isDead: false })));

    // Reset positions
    initializePositions();

    // Start round timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          endRound('timer');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start simulation loop
    simIntervalRef.current = setInterval(simulateTick, SIM_TICK_RATE);
  };

  const simulateTick = () => {
    // Move agents toward their targets
    setSimPositions(prev => {
      const moveAgent = (pos, speed, isDead) => {
        if (isDead) return pos;

        const dx = pos.target.x - pos.x;
        const dy = pos.target.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 5) {
          // Reached target, pick new random nearby position
          return {
            ...pos,
            x: pos.x + (Math.random() - 0.5) * 10,
            y: pos.y + (Math.random() - 0.5) * 10,
          };
        }

        // Move toward target with some randomness
        const moveX = (dx / dist) * speed + (Math.random() - 0.5) * 2;
        const moveY = (dy / dist) * speed + (Math.random() - 0.5) * 2;

        return {
          ...pos,
          x: Math.max(20, Math.min(MAP_WIDTH - 20, pos.x + moveX)),
          y: Math.max(20, Math.min(MAP_HEIGHT - 20, pos.y + moveY)),
        };
      };

      const newT1 = prev.team1.map((pos, i) =>
        moveAgent(pos, 1.5, team1Agents[i]?.isDead)
      );
      const newT2 = prev.team2.map((pos, i) =>
        moveAgent(pos, 2.5, team2Agents[i]?.isDead) // Attackers move faster
      );

      return { team1: newT1, team2: newT2 };
    });

    // Combat resolution - check for agents in combat range
    resolveCombat();
  };

  const resolveCombat = () => {
    const combatRange = 50;

    // For each attacker, check if near a defender
    simPositions.team2.forEach((attackerPos, aIdx) => {
      if (team2Agents[aIdx]?.isDead) return;

      simPositions.team1.forEach((defenderPos, dIdx) => {
        if (team1Agents[dIdx]?.isDead) return;

        const dx = attackerPos.x - defenderPos.x;
        const dy = attackerPos.y - defenderPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < combatRange) {
          // Combat! Random outcome with skill factor
          const attackerWins = Math.random() > 0.5;

          if (attackerWins) {
            // Defender takes damage
            setTeam1Agents(prev => prev.map((a, i) => {
              if (i === dIdx && !a.isDead) {
                const damage = Math.floor(Math.random() * 40 + 20);
                const newHp = Math.max(0, a.hp - damage);
                return { ...a, hp: newHp, isDead: newHp === 0 };
              }
              return a;
            }));
          } else {
            // Attacker takes damage
            setTeam2Agents(prev => prev.map((a, i) => {
              if (i === aIdx && !a.isDead) {
                const damage = Math.floor(Math.random() * 40 + 20);
                const newHp = Math.max(0, a.hp - damage);
                return { ...a, hp: newHp, isDead: newHp === 0 };
              }
              return a;
            }));
          }
        }
      });
    });

    // Check for round end
    checkElimination();
  };

  const checkElimination = () => {
    const t1Alive = team1Agents.filter(a => !a.isDead).length;
    const t2Alive = team2Agents.filter(a => !a.isDead).length;

    if (t1Alive === 0) {
      endRound('team2'); // Attackers win
    } else if (t2Alive === 0) {
      endRound('team1'); // Defenders win
    }

    // Check if attackers reached site (spike plant simulation)
    const attackersAtSite = simPositions.team2.filter((pos, i) => {
      if (team2Agents[i]?.isDead) return false;
      const distToA = Math.sqrt(Math.pow(pos.x - OBJECTIVES.siteA.x, 2) + Math.pow(pos.y - OBJECTIVES.siteA.y, 2));
      const distToB = Math.sqrt(Math.pow(pos.x - OBJECTIVES.siteB.x, 2) + Math.pow(pos.y - OBJECTIVES.siteB.y, 2));
      return distToA < 30 || distToB < 30;
    }).length;

    // If 2+ attackers reach site, they have advantage
    if (attackersAtSite >= 2 && timeRemaining < 50 && Math.random() < 0.02) {
      endRound('team2'); // Spike plant win
    }
  };

  const endRound = (winner) => {
    stopSimulation();
    setRoundState('ended');

    // Update score - timer expiry favors defenders
    const roundWinner = winner === 'timer' ? 'team1' : winner;
    setScore(prev => {
      const newScore = {
        team1: roundWinner === 'team1' ? prev.team1 + 1 : prev.team1,
        team2: roundWinner === 'team2' ? prev.team2 + 1 : prev.team2,
      };

      // Check match end
      if (newScore.team1 >= MAX_ROUNDS || newScore.team2 >= MAX_ROUNDS) {
        setMatchEnded(true);
        Alert.alert(
          'Match Complete!',
          `${newScore.team1 > newScore.team2 ? matchData?.team1?.name || 'Team 1' : matchData?.team2?.name || 'Team 2'} wins!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
      return newScore;
    });

    // Start next round after delay
    if (!matchEnded && currentRound < MAX_ROUNDS * 2 - 1) {
      setTimeout(() => {
        setCurrentRound(prev => prev + 1);
        initializePositions();
        startRound(currentRound + 1);
      }, 2000);
    }
  };

  // === RENDER COMPONENTS ===

  // Scoreboard Header
  const renderScoreboard = () => (
    <View style={styles.scoreboard}>
      {/* Team 1 Name */}
      <View style={styles.teamNameContainer}>
        <View style={[styles.teamLogo, { backgroundColor: TEAM_COLORS.team1.primary }]}>
          <Text style={styles.teamLogoText}>
            {(matchData?.team1?.name || 'TEAM 1').charAt(0)}
          </Text>
        </View>
        <Text style={[styles.teamName, { color: TEAM_COLORS.team1.primary }]}>
          {matchData?.team1?.name || 'PHANTOM GAMING'}
        </Text>
      </View>

      {/* Score */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>SCOREBOARD</Text>
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreText, { color: TEAM_COLORS.team1.primary }]}>{score.team1}</Text>
          <Text style={styles.scoreDivider}>-</Text>
          <Text style={[styles.scoreText, { color: TEAM_COLORS.team2.primary }]}>{score.team2}</Text>
        </View>
        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>ROUND {currentRound}</Text>
          {roundState === 'active' && (
            <View style={styles.liveBadge}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
      </View>

      {/* Team 2 Name */}
      <View style={[styles.teamNameContainer, { alignItems: 'flex-end' }]}>
        <View style={[styles.teamLogo, { backgroundColor: TEAM_COLORS.team2.primary }]}>
          <Text style={styles.teamLogoText}>
            {(matchData?.team2?.name || 'TEAM 2').charAt(0)}
          </Text>
        </View>
        <Text style={[styles.teamName, { color: TEAM_COLORS.team2.primary }]}>
          {matchData?.team2?.name || 'TITAN ESPORTS'}
        </Text>
      </View>
    </View>
  );

  // Player Card
  const renderPlayerCard = (agent, index, team) => {
    const colors = TEAM_COLORS[team];
    const hpPercent = agent.hp / 100;

    return (
      <View
        key={agent.id || index}
        style={[
          styles.playerCard,
          {
            backgroundColor: agent.isDead ? 'rgba(50,50,50,0.5)' : colors.bg,
            borderColor: agent.isDead ? '#444' : colors.border,
            opacity: agent.isDead ? 0.6 : 1,
          }
        ]}
      >
        {/* Avatar */}
        <View style={[styles.playerAvatar, { borderColor: colors.primary }]}>
          <Text style={styles.avatarText}>👤</Text>
        </View>

        {/* Info */}
        <View style={styles.playerInfo}>
          <Text style={styles.playerName} numberOfLines={1}>
            {agent.player_name || `Player ${index + 1}`}
          </Text>
          <View style={styles.agentRow}>
            <Text style={styles.agentIcon}>{ROLE_ICONS[agent.role] || '✦'}</Text>
            <Text style={styles.agentName}>{agent.name}</Text>
          </View>
          {/* Health Bar */}
          <View style={styles.healthBarContainer}>
            <View style={[styles.healthBar, { width: `${hpPercent * 100}%` }]} />
          </View>
        </View>

        {/* Agent Icon */}
        <View style={[styles.agentAvatar, { borderColor: colors.primary }]}>
          <Text style={styles.agentAvatarIcon}>{ROLE_ICONS[agent.role] || '✦'}</Text>
        </View>

        {/* Dead Overlay */}
        {agent.isDead && (
          <View style={styles.deadOverlay}>
            <Text style={styles.deadText}>☠️</Text>
          </View>
        )}
      </View>
    );
  };

  // Team Panel
  const renderTeamPanel = (agents, team) => (
    <View style={styles.teamPanel}>
      {agents.map((agent, index) => renderPlayerCard(agent, index, team))}
    </View>
  );

  // Tactical Map
  const renderTacticalMap = () => (
    <View style={styles.mapContainer}>
      {/* Map Background with actual map image */}
      <ImageBackground
        source={{ uri: mapData?.displayIcon || mapData?.splash }}
        style={styles.mapBackground}
        imageStyle={{ borderRadius: 12, opacity: 0.8 }}
        resizeMode="cover"
      >
        {/* Dark Overlay for better visibility */}
        <View style={styles.mapOverlay} />

        {/* Map Name */}
        <View style={styles.mapNameBadge}>
          <Text style={styles.mapNameText}>{mapData?.displayName || 'Unknown Map'}</Text>
        </View>

        {/* Site Labels */}
        <View style={[styles.siteLabel, { left: 20, top: 50 }]}>
          <Text style={styles.siteLabelText}>A</Text>
        </View>
        <View style={[styles.siteLabel, { right: 20, top: 50 }]}>
          <Text style={styles.siteLabelText}>B</Text>
        </View>
        <View style={[styles.siteLabel, { left: '45%', top: '45%' }]}>
          <Text style={[styles.siteLabelText, { fontSize: 12 }]}>MID</Text>
        </View>

        {/* Agent Markers - Team 1 */}
        {simPositions.team1.map((pos, i) => {
          const agent = team1Agents[i];
          return (
            <Animatable.View
              key={`t1-${i}`}
              animation="pulse"
              iterationCount="infinite"
              duration={2000}
              style={[
                styles.agentMarker,
                {
                  left: pos.x,
                  top: pos.y,
                  borderColor: TEAM_COLORS.team1.primary,
                  backgroundColor: agent?.isDead ? '#333' : 'rgba(59, 130, 246, 0.3)',
                  opacity: agent?.isDead ? 0.4 : 1,
                }
              ]}
            >
              {agent?.icon ? (
                <Image
                  source={{ uri: agent.icon }}
                  style={styles.agentMarkerIcon}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.markerText}>{agent?.name?.charAt(0) || (i + 1)}</Text>
              )}
              {agent?.isDead && <View style={styles.deadMarkerOverlay} />}
            </Animatable.View>
          );
        })}

        {/* Agent Markers - Team 2 */}
        {simPositions.team2.map((pos, i) => {
          const agent = team2Agents[i];
          return (
            <Animatable.View
              key={`t2-${i}`}
              animation="pulse"
              iterationCount="infinite"
              duration={2000}
              style={[
                styles.agentMarker,
                {
                  left: pos.x,
                  top: pos.y,
                  borderColor: TEAM_COLORS.team2.primary,
                  backgroundColor: agent?.isDead ? '#333' : 'rgba(239, 68, 68, 0.3)',
                  opacity: agent?.isDead ? 0.4 : 1,
                }
              ]}
            >
              {agent?.icon ? (
                <Image
                  source={{ uri: agent.icon }}
                  style={styles.agentMarkerIcon}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.markerText}>{agent?.name?.charAt(0) || (i + 1)}</Text>
              )}
              {agent?.isDead && <View style={styles.deadMarkerOverlay} />}
            </Animatable.View>
          );
        })}

        {/* Timer */}
        {roundState === 'active' && (
          <View style={styles.mapTimer}>
            <Text style={styles.mapTimerText}>{timeRemaining}s</Text>
          </View>
        )}

        {/* LIVE Badge */}
        {roundState === 'active' && (
          <View style={styles.mapLiveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.mapLiveText}>LIVE</Text>
          </View>
        )}
      </ImageBackground>
    </View>
  );

  // Loading State
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.loadingText}>
          Loading Match...
        </Animatable.Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.container}>
      {/* Scoreboard */}
      {renderScoreboard()}

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Team 1 Panel */}
        {renderTeamPanel(team1Agents, 'team1')}

        {/* Tactical Map */}
        {renderTacticalMap()}

        {/* Team 2 Panel */}
        {renderTeamPanel(team2Agents, 'team2')}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },

  // Scoreboard
  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  teamNameContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  teamLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  teamLogoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  teamName: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  scoreContainer: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreDivider: {
    color: '#fff',
    fontSize: 24,
    marginHorizontal: 12,
  },
  roundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roundText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  liveText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Main Content
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
  },

  // Team Panel
  teamPanel: {
    width: 160,
    gap: 8,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  avatarText: {
    fontSize: 18,
  },
  playerInfo: {
    flex: 1,
    marginHorizontal: 8,
  },
  playerName: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  agentIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  agentName: {
    color: '#94a3b8',
    fontSize: 10,
  },
  healthBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  healthBar: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  agentAvatarIcon: {
    fontSize: 14,
  },
  deadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deadText: {
    fontSize: 24,
  },

  // Map
  mapContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  siteLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  siteLabelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  agentMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  markerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mapTimer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mapTimerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  mapNameBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mapNameText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mapLiveBadge: {
    position: 'absolute',
    top: 10,
    right: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mapLiveText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  agentMarkerIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  deadMarkerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
});