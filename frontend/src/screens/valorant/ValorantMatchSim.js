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
  ImageBackground,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Services
import { ValorantService } from '../../services/ValorantService';

// Theme
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

// Simulation Config
const SIM_TICK_RATE = 100;
const AGENT_SPEED = 2.5; // Increased base speed
const COMBAT_RANGE = 45;
const MAX_ROUNDS_REGULATION = 13;

// Map dimensions for positioning
const MAP_WIDTH = 360;
const MAP_HEIGHT = 280;

// Defines tactical points on the map (HORIZONTAL: Defenders LEFT, Attackers RIGHT)
const MAP_POINTS = {
  // Spawns - Horizontal layout
  defenderSpawn: { x: 40, y: 140 },   // LEFT side
  attackerSpawn: { x: 320, y: 140 },  // RIGHT side

  // Sites (Defenders protect these on LEFT)
  siteA: { x: 60, y: 60 },
  siteB: { x: 60, y: 220 },

  // Mid Control
  midLeft: { x: 120, y: 140 },
  midCenter: { x: 180, y: 140 },
  midRight: { x: 240, y: 140 },

  // A Lane (Top lane)
  aMain: { x: 260, y: 60 },    // Attacker approach
  aLong: { x: 180, y: 60 },    // Long sightline
  aShort: { x: 100, y: 60 },   // Close to site

  // B Lane (Bottom lane)
  bMain: { x: 260, y: 220 },   // Attacker approach
  bLong: { x: 180, y: 220 },   // Long sightline
  bShort: { x: 100, y: 220 },  // Close to site

  // Peek/Angle spots
  aPeek: { x: 200, y: 60 },
  bPeek: { x: 200, y: 220 },
  midPeek: { x: 200, y: 140 },
};

// Tactical Lanes with peek/check points
// Attackers come from RIGHT, push to LEFT sites
const LANES = {
  aPush: {
    path: ['attackerSpawn', 'aMain', 'aPeek', 'aLong', 'aShort', 'siteA'],
    checkPoints: ['aPeek', 'aLong'],
    targetSite: 'siteA',
  },
  bPush: {
    path: ['attackerSpawn', 'bMain', 'bPeek', 'bLong', 'bShort', 'siteB'],
    checkPoints: ['bPeek', 'bLong'],
    targetSite: 'siteB',
  },
  midToA: {
    path: ['attackerSpawn', 'midRight', 'midPeek', 'midCenter', 'midLeft', 'aShort', 'siteA'],
    checkPoints: ['midPeek', 'midLeft'],
    targetSite: 'siteA',
  },
  midToB: {
    path: ['attackerSpawn', 'midRight', 'midPeek', 'midCenter', 'midLeft', 'bShort', 'siteB'],
    checkPoints: ['midPeek', 'midLeft'],
    targetSite: 'siteB',
  },
};

// Lane assignment strategies (how to split the team)
const SPLIT_STRATEGIES = [
  { lanes: ['aPush', 'aPush', 'midToA', 'midToA', 'aPush'], name: 'A Execute' },
  { lanes: ['bPush', 'bPush', 'midToB', 'midToB', 'bPush'], name: 'B Execute' },
  { lanes: ['aPush', 'aPush', 'midToA', 'bPush', 'bPush'], name: 'A/B Split' },
  { lanes: ['midToA', 'midToB', 'aPush', 'bPush', 'midToA'], name: 'Spread' },
  { lanes: ['aPush', 'bPush', 'midToA', 'midToB', 'aPush'], name: 'Default' },
];

// AI Behavior States
const AI_STATES = {
  IDLE: 'idle',
  MOVING: 'moving',
  PEEKING: 'peeking',
  HOLDING: 'holding',
  ENGAGING: 'engaging',
  ROTATING: 'rotating',
  PLANTING: 'planting',
};

// Role-based behavior modifiers
const ROLE_BEHAVIORS = {
  Duelist: { aggression: 0.8, entryPriority: 1, peekDuration: 400 },
  Initiator: { aggression: 0.6, entryPriority: 2, peekDuration: 600 },
  Controller: { aggression: 0.4, entryPriority: 3, peekDuration: 800 },
  Sentinel: { aggression: 0.3, entryPriority: 4, peekDuration: 1000 },
  Flex: { aggression: 0.5, entryPriority: 3, peekDuration: 600 },
};

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
  const [roundState, setRoundState] = useState('planning'); // planning, active, planted, ended
  const [timeRemaining, setTimeRemaining] = useState(100);
  const [matchData, setMatchData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matchEnded, setMatchEnded] = useState(false);

  // Side Logic
  const [team1Side, setTeam1Side] = useState('defend'); // Initial side

  // Map data
  const [mapData, setMapData] = useState(null);

  // Agent States - includes HP, position, status
  const [team1Agents, setTeam1Agents] = useState([]);
  const [team2Agents, setTeam2Agents] = useState([]);

  // Simulation positions for map
  const [simPositions, setSimPositions] = useState({ team1: [], team2: [] });

  // REFS for Simulation Loop (Avoid Stale Closures)
  const agentsRef = useRef({ team1: [], team2: [] });
  const positionsRef = useRef({ team1: [], team2: [] });
  const roundStateRef = useRef('planning');
  const team1SideRef = useRef('defend'); // 'defend' or 'attack'

  // Services
  const valorantService = new ValorantService();

  // Route params
  const { matchId, matchData: paramMatchData, selectedAgents = [], teamSide = 'team1' } = route.params || {};

  // Refs for intervals
  const timerRef = useRef(null);
  const simIntervalRef = useRef(null);

  // Sync state to refs
  useEffect(() => {
    agentsRef.current = { team1: team1Agents, team2: team2Agents };
  }, [team1Agents, team2Agents]);

  useEffect(() => {
    positionsRef.current = simPositions;
  }, [simPositions]);

  useEffect(() => {
    roundStateRef.current = roundState;
  }, [roundState]);

  useEffect(() => {
    team1SideRef.current = team1Side;
  }, [team1Side]);

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

      // Fetch match data
      if (matchId) {
        try {
          data = await valorantService.getMatch(matchId);
        } catch (err) {
          console.warn("Fetch Error, using params", err);
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

      // Initialize Agents
      await initializeAgents(data);

      // Initialize Map
      if (data.map && data.map.uuid && data.map.displayName) {
        // Optimization: Use passed map object directly if available
        console.log("Using passed map data:", data.map.displayName);
        setMapData(data.map);
      } else {
        // Fallback: Fetch by name
        const mapName = data.map?.displayName || data.map?.name || 'Ascent';
        console.log("Fetching map data (fallback):", mapName);
        await fetchMapData(mapName);
      }

      setIsLoading(false);

      // Start First Round
      startRound(1);

    } catch (error) {
      console.error("Init Error", error);
      Alert.alert("Error", "Initialization failed");
      navigation.goBack();
    }
  };

  const initializeAgents = async (data) => {
    const agentsDict = data.agents || {};
    const agentsList = Object.values(agentsDict);
    const t1FromApi = agentsList.filter(a => a.teamId === data.team1_id);
    const t2FromApi = agentsList.filter(a => a.teamId === data.team2_id);

    // Fetch Icons Mapping first to ensure we have them
    let agentIcons = {};
    try {
      const response = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
      const json = await response.json();
      if (json.status === 200) {
        json.data.forEach(agent => {
          agentIcons[agent.displayName.toLowerCase()] = agent.displayIcon;
          // Also handle cases like "KAY/O" -> "kay/o" or "kayo"
          agentIcons[agent.displayName.replace('/', '').toLowerCase()] = agent.displayIcon;
        });
      }
    } catch (e) {
      console.warn('Icon fetch failed', e);
    }

    const processAgent = (apiAgent, index, isPlayerTeam) => {
      // Prefer selectedAgents if this is player team and they exist
      if (isPlayerTeam && selectedAgents[index]) {
        const selected = selectedAgents[index];
        return {
          id: `t1_${index}`,
          name: selected.name,
          role: selected.role,
          icon: selected.icon, // Selected agents already have icons
          hp: 100,
          isDead: false,
          player_name: apiAgent?.player_name || `Player ${index + 1}`,
          // Stats for simulation balance
          accuracy: 0.2 + (Math.random() * 0.1), // 0.2-0.3
          reaction: 0.5,
        };
      }

      // Fallback or Enemy Team
      const name = apiAgent?.name || (isPlayerTeam ? 'Jett' : 'Reyna'); // Default names
      const cleanName = name.toLowerCase().replace('/', '');

      return {
        id: isPlayerTeam ? `t1_${index}` : `t2_${index}`,
        name: apiAgent?.name || 'Agent',
        role: apiAgent?.role || 'Duelist',
        icon: apiAgent?.icon || agentIcons[cleanName] || null,
        hp: 100,
        isDead: false,
        player_name: apiAgent?.player_name || (isPlayerTeam ? `Player ${index + 1}` : `Enemy ${index + 1}`),
        accuracy: 0.18 + (Math.random() * 0.1), // Slightly lower base for enemies? or equal
        reaction: 0.5,
      };
    };

    // Build Team 1
    const finalTeam1 = Array(5).fill(null).map((_, i) => processAgent(t1FromApi[i], i, true));

    // Build Team 2
    const finalTeam2 = Array(5).fill(null).map((_, i) => processAgent(t2FromApi[i], i, false));

    setTeam1Agents(finalTeam1);
    setTeam2Agents(finalTeam2);

    // Update ref immediately
    agentsRef.current = { team1: finalTeam1, team2: finalTeam2 };
  };

  const fetchMapData = async (mapName) => {
    try {
      const response = await fetch('https://valorant-api.com/v1/maps');
      const json = await response.json();
      if (json.status === 200) {
        const foundMap = json.data.find(m => m.displayName.toLowerCase() === mapName.toLowerCase());
        setMapData(foundMap || json.data.find(m => m.displayName === 'Ascent'));
      }
    } catch (error) {
      console.error('Failed to fetch map data:', error);
    }
  };

  const initializePositions = () => {
    const isT1Attacking = team1SideRef.current === 'attack';
    const getPos = key => MAP_POINTS[key] || { x: 180, y: 180 };
    const jitter = (pt, amount = 15) => ({
      x: pt.x + (Math.random() - 0.5) * amount,
      y: pt.y + (Math.random() - 0.5) * amount
    });

    // Get agents with their roles for role-based behavior
    const t1Agents = agentsRef.current.team1;
    const t2Agents = agentsRef.current.team2;

    // Choose attack strategy
    const laneKeys = Object.keys(LANES);
    const mainLane = laneKeys[Math.floor(Math.random() * laneKeys.length)];
    const splitLane = laneKeys.find(k => k !== mainLane) || mainLane;
    const doSplit = Math.random() > 0.6; // 40% chance to split

    // Sort attackers by role priority (Duelists first)
    const sortByEntry = (agents) => {
      return [...agents].map((a, i) => ({ ...a, originalIdx: i }))
        .sort((a, b) => {
          const aPrio = ROLE_BEHAVIORS[a.role]?.entryPriority || 3;
          const bPrio = ROLE_BEHAVIORS[b.role]?.entryPriority || 3;
          return aPrio - bPrio;
        });
    };

    const createAttackerPositions = (agents) => {
      // Pick a random split strategy
      const strategy = SPLIT_STRATEGIES[Math.floor(Math.random() * SPLIT_STRATEGIES.length)];
      const sorted = sortByEntry(agents);
      const positions = [];

      sorted.forEach((agent, i) => {
        // Each agent gets their own lane from the strategy
        const laneName = strategy.lanes[i % strategy.lanes.length];
        const lane = LANES[laneName];
        const behavior = ROLE_BEHAVIORS[agent.role] || ROLE_BEHAVIORS.Flex;

        positions[agent.originalIdx] = {
          ...jitter(getPos('attackerSpawn'), 8),
          path: lane.path,
          checkPoints: lane.checkPoints,
          pathIndex: 0,
          aiState: AI_STATES.MOVING,
          peekTimer: 0,
          entryDelay: i * 250, // Stagger entry
          aggression: behavior.aggression,
          peekDuration: behavior.peekDuration,
          targetEnemy: null,
          laneName: laneName, // Track which lane
        };
      });
      return positions;
    };

    const createDefenderPositions = (agents) => {
      // Defender positions adapted to new horizontal layout
      const holdSpots = [
        { pos: 'siteA', facing: 'aLong' },     // Site A anchor
        { pos: 'aShort', facing: 'aLong' },   // A short hold
        { pos: 'midLeft', facing: 'midCenter' }, // Mid control
        { pos: 'bShort', facing: 'bLong' },   // B short hold
        { pos: 'siteB', facing: 'bLong' },     // Site B anchor
      ];

      return agents.map((agent, i) => {
        const spot = holdSpots[i % holdSpots.length];
        const behavior = ROLE_BEHAVIORS[agent.role] || ROLE_BEHAVIORS.Flex;

        return {
          ...jitter(getPos(spot.pos), 8),
          aiState: AI_STATES.HOLDING,
          holdAngle: spot.facing,
          patrolRange: 15,
          patrolTimer: 0,
          aggression: behavior.aggression,
          targetEnemy: null,
        };
      });
    };

    let attackers, defenders;

    if (isT1Attacking) {
      attackers = createAttackerPositions(t1Agents);
      defenders = createDefenderPositions(t2Agents);
      setSimPositions({ team1: attackers, team2: defenders });
      positionsRef.current = { team1: attackers, team2: defenders };
    } else {
      attackers = createAttackerPositions(t2Agents);
      defenders = createDefenderPositions(t1Agents);
      setSimPositions({ team1: defenders, team2: attackers });
      positionsRef.current = { team1: defenders, team2: attackers };
    }
  };

  const startRound = (roundNum) => {
    stopSimulation();

    // Side Switching Logic
    if (roundNum === 13) {
      Alert.alert("HALFTIME", "Switching Sides!");
      setTeam1Side(prev => prev === 'defend' ? 'attack' : 'defend');
      // Let effect update ref? No, update manually or wait.
      // We'll set it here but initPos relies on Ref.
      team1SideRef.current = (team1SideRef.current === 'defend' ? 'attack' : 'defend');
    }

    setRoundState('active');
    setTimeRemaining(30);

    // Reset HP
    setTeam1Agents(prev => prev.map(a => ({ ...a, hp: 100, isDead: false })));
    setTeam2Agents(prev => prev.map(a => ({ ...a, hp: 100, isDead: false })));

    // Delay slighty to allow state to settle if needed, but we updated Ref so it should be fine
    initializePositions();

    // Timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time expired - Defenders win if spike not planted
          // Check who is defending
          const defender = team1SideRef.current === 'defend' ? 'team1' : 'team2';
          endRound(defender);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Physics Loop
    simIntervalRef.current = setInterval(simulateTick, SIM_TICK_RATE);
  };

  const simulateTick = () => {
    const agents = agentsRef.current;
    if (!agents.team1.length || !agents.team2.length) return;

    let newPosT1 = [...positionsRef.current.team1];
    let newPosT2 = [...positionsRef.current.team2];

    // STRICT BOUNDS: Keep agents well inside the map
    const BOUNDS_PADDING = 25;
    const clamp = (val, max) => Math.max(BOUNDS_PADDING, Math.min(max - BOUNDS_PADDING, val));
    const clampPos = (pos) => ({
      ...pos,
      x: clamp(pos.x, MAP_WIDTH),
      y: clamp(pos.y, MAP_HEIGHT)
    });

    const isT1Attacking = team1SideRef.current === 'attack';
    const getPos = key => MAP_POINTS[key] || { x: 180, y: 140 };

    // Find nearest enemy helper
    const findNearestEnemy = (pos, enemyPos, enemies) => {
      let target = null;
      let minDist = 9999;
      enemyPos.forEach((ep, i) => {
        if (!enemies[i]?.isDead) {
          const d = Math.sqrt(Math.pow(pos.x - ep.x, 2) + Math.pow(pos.y - ep.y, 2));
          if (d < minDist) { minDist = d; target = { ...ep, idx: i }; }
        }
      });
      return { target, dist: minDist };
    };

    // Attacker AI Logic
    const moveAttacker = (pos, agentIdx, enemies, enemyPos) => {
      const agent = isT1Attacking ? agents.team1[agentIdx] : agents.team2[agentIdx];
      if (!agent || agent.isDead) return pos;

      const { target: nearestEnemy, dist: enemyDist } = findNearestEnemy(pos, enemyPos, enemies);

      // Combat check - if enemy nearby, engage
      if (nearestEnemy && enemyDist < COMBAT_RANGE * 1.5) {
        return { ...pos, aiState: AI_STATES.ENGAGING, targetEnemy: nearestEnemy };
      }

      // State machine
      switch (pos.aiState) {
        case AI_STATES.MOVING: {
          // Check entry delay (stagger)
          if (pos.entryDelay > 0) {
            return { ...pos, entryDelay: pos.entryDelay - SIM_TICK_RATE };
          }

          // Move along path
          const path = pos.path;
          if (!path || pos.pathIndex >= path.length - 1) {
            return { ...pos, aiState: AI_STATES.PLANTING };
          }

          const targetKey = path[pos.pathIndex + 1];
          const targetPt = getPos(targetKey);
          const dx = targetPt.x - pos.x;
          const dy = targetPt.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Reached waypoint
          if (dist < 8) {
            // Check if this is a peek checkpoint
            if (pos.checkPoints?.includes(targetKey)) {
              return {
                ...pos,
                pathIndex: pos.pathIndex + 1,
                aiState: AI_STATES.PEEKING,
                peekTimer: pos.peekDuration || 800
              };
            }
            return { ...pos, pathIndex: pos.pathIndex + 1 };
          }

          // Move with some tactical slowdown near checkpoints
          const speed = AGENT_SPEED * (pos.aggression || 0.5);
          return {
            ...pos,
            x: clamp(pos.x + (dx / dist) * speed, MAP_WIDTH),
            y: clamp(pos.y + (dy / dist) * speed, MAP_HEIGHT)
          };
        }

        case AI_STATES.PEEKING: {
          // Wait at peek spot, then continue
          if (pos.peekTimer > 0) {
            // Small juke movement while peeking
            if (Math.random() < 0.15) {
              return {
                ...pos,
                peekTimer: pos.peekTimer - SIM_TICK_RATE,
                x: clamp(pos.x + (Math.random() - 0.5) * 3, MAP_WIDTH),
                y: clamp(pos.y + (Math.random() - 0.5) * 3, MAP_HEIGHT)
              };
            }
            return { ...pos, peekTimer: pos.peekTimer - SIM_TICK_RATE };
          }
          return { ...pos, aiState: AI_STATES.MOVING };
        }

        case AI_STATES.ENGAGING: {
          // Push toward enemy
          if (nearestEnemy && enemyDist > 20) {
            const dx = nearestEnemy.x - pos.x;
            const dy = nearestEnemy.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = AGENT_SPEED * 1.2;
            return {
              ...pos,
              x: clamp(pos.x + (dx / dist) * speed, MAP_WIDTH),
              y: clamp(pos.y + (dy / dist) * speed, MAP_HEIGHT)
            };
          }
          return pos;
        }

        case AI_STATES.PLANTING:
        default:
          // Jitter in place
          if (Math.random() < 0.1) {
            return {
              ...pos,
              x: clamp(pos.x + (Math.random() - 0.5) * 3, MAP_WIDTH),
              y: clamp(pos.y + (Math.random() - 0.5) * 3, MAP_HEIGHT)
            };
          }
          return pos;
      }
    };

    // Defender AI Logic
    const moveDefender = (pos, agentIdx, enemies, enemyPos) => {
      const agent = isT1Attacking ? agents.team2[agentIdx] : agents.team1[agentIdx];
      if (!agent || agent.isDead) return pos;

      const { target: nearestEnemy, dist: enemyDist } = findNearestEnemy(pos, enemyPos, enemies);
      const myAlive = (isT1Attacking ? agents.team2 : agents.team1).filter(a => !a?.isDead).length;
      const enemyAlive = enemies.filter(a => !a?.isDead).length;

      // If enemy close, engage
      if (nearestEnemy && enemyDist < COMBAT_RANGE * 1.2) {
        return { ...pos, aiState: AI_STATES.ENGAGING, targetEnemy: nearestEnemy };
      }

      // Retake/Hunt mode if advantage or low enemy count
      if (enemyAlive <= 2 || myAlive > enemyAlive + 1) {
        if (nearestEnemy) {
          const dx = nearestEnemy.x - pos.x;
          const dy = nearestEnemy.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const speed = AGENT_SPEED * (pos.aggression || 0.4);
          return {
            ...pos,
            aiState: AI_STATES.ROTATING,
            x: clamp(pos.x + (dx / dist) * speed, MAP_WIDTH),
            y: clamp(pos.y + (dy / dist) * speed, MAP_HEIGHT)
          };
        }
      }

      // Hold angle with micro-adjustments
      switch (pos.aiState) {
        case AI_STATES.HOLDING: {
          // Small patrol/juke movements
          pos.patrolTimer = (pos.patrolTimer || 0) + SIM_TICK_RATE;
          if (pos.patrolTimer > 1000 && Math.random() < 0.2) {
            return {
              ...pos,
              patrolTimer: 0,
              x: clamp(pos.x + (Math.random() - 0.5) * pos.patrolRange, MAP_WIDTH),
              y: clamp(pos.y + (Math.random() - 0.5) * pos.patrolRange, MAP_HEIGHT)
            };
          }
          return pos;
        }

        case AI_STATES.ENGAGING: {
          if (nearestEnemy && enemyDist > 15) {
            const dx = nearestEnemy.x - pos.x;
            const dy = nearestEnemy.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return {
              ...pos,
              x: clamp(pos.x + (dx / dist) * AGENT_SPEED, MAP_WIDTH),
              y: clamp(pos.y + (dy / dist) * AGENT_SPEED, MAP_HEIGHT)
            };
          }
          return pos;
        }

        default:
          return pos;
      }
    };

    // Apply movement
    if (isT1Attacking) {
      newPosT1 = newPosT1.map((p, i) => moveAttacker(p, i, agents.team2, positionsRef.current.team2));
      newPosT2 = newPosT2.map((p, i) => moveDefender(p, i, agents.team1, positionsRef.current.team1));
    } else {
      newPosT1 = newPosT1.map((p, i) => moveDefender(p, i, agents.team2, positionsRef.current.team2));
      newPosT2 = newPosT2.map((p, i) => moveAttacker(p, i, agents.team1, positionsRef.current.team1));
    }

    // FINAL BOUNDS ENFORCEMENT: Clamp all positions before saving
    newPosT1 = newPosT1.map(clampPos);
    newPosT2 = newPosT2.map(clampPos);

    setSimPositions({ team1: newPosT1, team2: newPosT2 });
    positionsRef.current = { team1: newPosT1, team2: newPosT2 };

    resolveCombat();
  };

  const resolveCombat = () => {
    const agents = agentsRef.current;
    const pos = positionsRef.current;

    // Check collisions
    let t1Updates = [...agents.team1];
    let t2Updates = [...agents.team2];
    let combatOccurred = false;

    // Naive O(N^2) check is fine for 10 agents
    pos.team2.forEach((p2, i2) => {
      if (t2Updates[i2].isDead) return;

      pos.team1.forEach((p1, i1) => {
        if (t1Updates[i1].isDead) return;

        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

        if (dist < COMBAT_RANGE) {
          combatOccurred = true;

          // BALANCED COMBAT: Pure skill-based random roll (no defender advantage)
          // Both teams have equal chance based on their accuracy
          const roll1 = Math.random() * (t1Updates[i1].accuracy || 0.2);
          const roll2 = Math.random() * (t2Updates[i2].accuracy || 0.2);

          // Add slight randomness to prevent always same winner
          const finalRoll1 = roll1 + Math.random() * 0.05;
          const finalRoll2 = roll2 + Math.random() * 0.05;

          if (finalRoll1 > finalRoll2) {
            // Team 1 hits Team 2
            const dmg = Math.floor(Math.random() * 25 + 20); // 20-45 damage
            t2Updates[i2].hp = Math.max(0, t2Updates[i2].hp - dmg);
            if (t2Updates[i2].hp === 0) t2Updates[i2].isDead = true;
          } else {
            // Team 2 hits Team 1
            const dmg = Math.floor(Math.random() * 25 + 20); // 20-45 damage
            t1Updates[i1].hp = Math.max(0, t1Updates[i1].hp - dmg);
            if (t1Updates[i1].hp === 0) t1Updates[i1].isDead = true;
          }
        }
      });
    });

    if (combatOccurred) {
      setTeam1Agents(t1Updates);
      setTeam2Agents(t2Updates);
    }

    // Check Round End Conditions
    const t1Alive = t1Updates.filter(a => !a.isDead).length;
    const t2Alive = t2Updates.filter(a => !a.isDead).length;

    if (t1Alive === 0) endRound('team2');
    else if (t2Alive === 0) endRound('team1');
  };

  const endRound = (winner) => {
    stopSimulation();
    setRoundState('ended');

    setScore(prev => {
      const newScore = {
        team1: winner === 'team1' ? prev.team1 + 1 : prev.team1,
        team2: winner === 'team2' ? prev.team2 + 1 : prev.team2,
      };

      // Check if match ended
      // Rule: Reach 13 AND lead by 2. If 12-12, goes to OT (needs 14-12, etc)
      const maxScore = Math.max(newScore.team1, newScore.team2);
      const diff = Math.abs(newScore.team1 - newScore.team2);

      if (maxScore >= MAX_ROUNDS_REGULATION && diff >= 2) {
        setMatchEnded(true);
        setTimeout(() => {
          Alert.alert(
            'Match Complete',
            `${newScore.team1 > newScore.team2 ? matchData?.team1?.name : matchData?.team2?.name} Wins ${newScore.team1}-${newScore.team2}!`,
            [{
              text: 'Exit',
              onPress: () => {
                // Reset to Home
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'FpsHomeScreen' }],
                });
              }
            }]
          );
        }, 500);
      } else {
        // Next round
        if (!matchEnded) {
          setTimeout(() => {
            setCurrentRound(r => r + 1);
            startRound(currentRound + 1);
          }, 3000);
        }
      }
      return newScore;
    });
  };

  // === RENDER COMPONENTS === (Kept mostly same, added safe checks)

  const renderScoreboard = () => (
    <View style={styles.scoreboard}>
      <View style={styles.teamNameContainer}>
        <View style={[styles.teamLogo, { backgroundColor: TEAM_COLORS.team1.primary }]}>
          <Text style={styles.teamLogoText}>{(matchData?.team1?.name || 'T1').charAt(0)}</Text>
        </View>
        <Text style={[styles.teamName, { color: TEAM_COLORS.team1.primary }]}>
          {matchData?.team1?.name || 'TEAM 1'}
        </Text>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>vct masters</Text>
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreText, { color: TEAM_COLORS.team1.primary }]}>{score.team1}</Text>
          <Text style={styles.scoreDivider}>:</Text>
          <Text style={[styles.scoreText, { color: TEAM_COLORS.team2.primary }]}>{score.team2}</Text>
        </View>
        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>
            {score.team1 >= 12 && score.team2 >= 12 ? 'OVERTIME' : `ROUND ${currentRound}`}
          </Text>
        </View>
      </View>

      <View style={[styles.teamNameContainer, { alignItems: 'flex-end' }]}>
        <View style={[styles.teamLogo, { backgroundColor: TEAM_COLORS.team2.primary }]}>
          <Text style={styles.teamLogoText}>{(matchData?.team2?.name || 'T2').charAt(0)}</Text>
        </View>
        <Text style={[styles.teamName, { color: TEAM_COLORS.team2.primary }]}>
          {matchData?.team2?.name || 'TEAM 2'}
        </Text>
      </View>
    </View>
  );

  const renderPlayerCard = (agent, index, team) => {
    if (!agent) return null;
    const colors = TEAM_COLORS[team];
    const hpPercent = agent.hp / 100;

    return (
      <View
        key={agent.id || index}
        style={[
          styles.playerCard,
          {
            backgroundColor: agent.isDead ? 'rgba(0,0,0,0.6)' : colors.bg,
            borderColor: agent.isDead ? '#444' : colors.border,
            opacity: agent.isDead ? 0.5 : 1,
          }
        ]}
      >
        <View style={styles.playerInfo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.playerName} numberOfLines={1}>{agent.player_name}</Text>
            <Text style={styles.agentIcon}>{ROLE_ICONS[agent.role]}</Text>
          </View>
          <Text style={[styles.agentName, { color: '#fff' }]}>{agent.name}</Text>
          <View style={styles.healthBarContainer}>
            <View style={[styles.healthBar, { width: `${hpPercent * 100}%` }]} />
          </View>
        </View>

        {/* Agent Icon or Fallback */}
        <View style={[styles.agentAvatar, { borderColor: colors.primary }]}>
          {agent.icon ? (
            <Image source={{ uri: agent.icon }} style={{ width: '100%', height: '100%', borderRadius: 4 }} />
          ) : (
            <Text style={styles.agentAvatarIcon}>{ROLE_ICONS[agent.role]}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderTacticalMap = () => (
    <View style={styles.mapContainer}>
      <ImageBackground
        source={{ uri: mapData?.displayIcon || mapData?.splash }}
        style={styles.mapBackground}
        imageStyle={{ borderRadius: 12, opacity: 0.6 }} // Dimmed for contrast
        resizeMode="contain"
      >
        {/* Agents T1 */}
        {simPositions.team1.map((pos, i) => {
          const agent = team1Agents[i];
          if (!agent) return null;
          return (
            <Animatable.View
              key={`t1-${i}`}
              transition={["left", "top"]}
              duration={SIM_TICK_RATE}
              style={[
                styles.agentMarker,
                {
                  left: pos.x, top: pos.y,
                  borderColor: TEAM_COLORS.team1.primary,
                  backgroundColor: agent.isDead ? '#333' : TEAM_COLORS.team1.primary,
                  opacity: agent.isDead ? 0.3 : 1,
                  zIndex: agent.isDead ? 1 : 10,
                }
              ]}
            >
              {agent.icon ? (
                <Image source={{ uri: agent.icon }} style={styles.markerImage} />
              ) : (
                <Text style={{ fontSize: 8, color: '#fff' }}>{agent.name[0]}</Text>
              )}
            </Animatable.View>
          );
        })}

        {/* Agents T2 */}
        {simPositions.team2.map((pos, i) => {
          const agent = team2Agents[i];
          if (!agent) return null;
          return (
            <Animatable.View
              key={`t2-${i}`}
              transition={["left", "top"]}
              duration={SIM_TICK_RATE}
              style={[
                styles.agentMarker,
                {
                  left: pos.x, top: pos.y,
                  borderColor: TEAM_COLORS.team2.primary,
                  backgroundColor: agent.isDead ? '#333' : TEAM_COLORS.team2.primary,
                  opacity: agent.isDead ? 0.3 : 1,
                  zIndex: agent.isDead ? 1 : 10,
                }
              ]}
            >
              {agent.icon ? (
                <Image source={{ uri: agent.icon }} style={styles.markerImage} />
              ) : (
                <Text style={{ fontSize: 8, color: '#fff' }}>{agent.name[0]}</Text>
              )}
            </Animatable.View>
          );
        })}

        {/* Timer */}
        <View style={styles.mapTimer}>
          <Text style={[styles.mapTimerText, { color: timeRemaining < 10 ? '#ef4444' : '#fff' }]}>
            {timeRemaining}
          </Text>
        </View>

      </ImageBackground>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Match Data...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.container}>
      {renderScoreboard()}

      {/* Scrollable Content for small screens if needed, though we try to fit */}
      <View style={styles.mainContent}>

        {/* TOP: TACTICAL MAP */}
        <View style={styles.mapContainer}>
          <ImageBackground
            source={{ uri: mapData?.displayIcon || mapData?.splash }}
            style={styles.mapBackground}
            imageStyle={{ borderRadius: 12, opacity: 0.6 }}
            resizeMode="contain"
          >
            {/* T1 Agents */}
            {simPositions.team1.map((pos, i) => {
              const agent = team1Agents[i];
              if (!agent) return null;
              return (
                <Animatable.View
                  key={`t1-${i}`}
                  transition={["left", "top"]}
                  duration={SIM_TICK_RATE}
                  style={[
                    styles.agentMarker,
                    {
                      left: pos.x, top: pos.y,
                      borderColor: TEAM_COLORS.team1.primary,
                      backgroundColor: agent.isDead ? '#333' : TEAM_COLORS.team1.primary,
                      opacity: agent.isDead ? 0.3 : 1,
                      zIndex: agent.isDead ? 1 : 10,
                    }
                  ]}
                >
                  {agent.icon ? (
                    <Image source={{ uri: agent.icon }} style={styles.markerImage} />
                  ) : (
                    <Text style={{ fontSize: 8, color: '#fff' }}>{agent.name[0]}</Text>
                  )}
                </Animatable.View>
              );
            })}

            {/* T2 Agents */}
            {simPositions.team2.map((pos, i) => {
              const agent = team2Agents[i];
              if (!agent) return null;
              return (
                <Animatable.View
                  key={`t2-${i}`}
                  transition={["left", "top"]}
                  duration={SIM_TICK_RATE}
                  style={[
                    styles.agentMarker,
                    {
                      left: pos.x, top: pos.y,
                      borderColor: TEAM_COLORS.team2.primary,
                      backgroundColor: agent.isDead ? '#333' : TEAM_COLORS.team2.primary,
                      opacity: agent.isDead ? 0.3 : 1,
                      zIndex: agent.isDead ? 1 : 10,
                    }
                  ]}
                >
                  {agent.icon ? (
                    <Image source={{ uri: agent.icon }} style={styles.markerImage} />
                  ) : (
                    <Text style={{ fontSize: 8, color: '#fff' }}>{agent.name[0]}</Text>
                  )}
                </Animatable.View>
              );
            })}

            {/* Timer */}
            <View style={styles.mapTimer}>
              <Text style={[styles.mapTimerText, { color: timeRemaining < 10 ? '#ef4444' : '#fff' }]}>
                {timeRemaining}
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* BOTTOM: TEAMS GRID */}
        <View style={styles.teamsGrid}>
          <View style={styles.teamColumn}>
            <Text style={[styles.columnHeader, { color: TEAM_COLORS.team1.primary }]}>DEFENDERS</Text>
            {team1Agents.map((a, i) => renderPlayerCard(a, i, 'team1'))}
          </View>
          <View style={styles.teamColumn}>
            <Text style={[styles.columnHeader, { color: TEAM_COLORS.team2.primary }]}>ATTACKERS</Text>
            {team2Agents.map((a, i) => renderPlayerCard(a, i, 'team2'))}
          </View>
        </View>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#fff', fontSize: 18 },

  // Scoreboard
  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginBottom: 10
  },
  teamNameContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamLogo: { width: 32, height: 32, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  teamLogoText: { color: '#fff', fontWeight: 'bold' },
  teamName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  scoreContainer: { alignItems: 'center', minWidth: 80 },
  scoreLabel: { color: '#94a3b8', fontSize: 10, textTransform: 'uppercase' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreText: { fontSize: 32, fontWeight: 'bold' },
  scoreDivider: { color: '#64748b', fontSize: 24 },
  roundInfo: { marginTop: -2 },
  roundText: { color: '#e2e8f0', fontSize: 12, fontWeight: 'bold' },

  // Main Content
  mainContent: { flex: 1, flexDirection: 'column', paddingHorizontal: 10 },

  // Map
  mapContainer: {
    width: '100%',
    aspectRatio: 1.3, // Slightly wider than tall for standard layouts
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  mapBackground: { flex: 1, width: '100%', height: '100%' },
  agentMarker: { position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  markerImage: { width: '100%', height: '100%' },
  mapTimer: { position: 'absolute', top: 10, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  mapTimerText: { fontWeight: 'bold', fontSize: 16 },

  // Teams Grid
  teamsGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 10
  },
  teamColumn: {
    flex: 1,
    gap: 6
  },
  columnHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1
  },

  // Player Card
  playerCard: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },
  playerInfo: { flex: 1 },
  playerName: { color: '#94a3b8', fontSize: 10 },
  agentName: { fontWeight: 'bold', fontSize: 11, color: '#fff' },
  healthBarContainer: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 4, borderRadius: 2 },
  healthBar: { height: '100%', backgroundColor: '#22c55e', borderRadius: 2 },
  agentIcon: { fontSize: 10, color: '#cbd5e1' },

  agentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1
  },
  agentAvatarIcon: { fontSize: 14 },
});