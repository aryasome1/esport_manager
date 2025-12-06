/**
 * MobaMatchSim.js
 * Simulasi Pertandingan MOBA Visual (Style eSports Legends)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

// --- KONFIGURASI PETA (Koordinat Relatif 0-100%) ---
const LANE_PATHS = {
  top: [
    { x: 10, y: 80 }, { x: 10, y: 10 }, { x: 90, y: 10 }, { x: 90, y: 80 } // Base -> Top -> Enemy Top -> Enemy Base
  ],
  mid: [
    { x: 15, y: 75 }, { x: 50, y: 50 }, { x: 85, y: 25 } // Base -> Mid -> Enemy Base (Diagonal)
  ],
  bot: [
    { x: 20, y: 90 }, { x: 90, y: 90 }, { x: 90, y: 20 } // Base -> Bot -> Enemy Base
  ],
  jungle: [
    { x: 30, y: 60 }, { x: 70, y: 40 }, { x: 40, y: 30 }, { x: 60, y: 70 } // Random patrol points
  ]
};

// Mock Data Awal
const INITIAL_HEROES = [
  // TEAM BLUE (Player)
  { id: 'b1', name: 'Saoz', role: 'TOP', hp: 80, mp: 40, lvl: 15, kda: '1/0/1', lane: 'top', team: 'blue' },
  { id: 'b2', name: 'Diamond', role: 'JUN', hp: 90, mp: 60, lvl: 9, kda: '3/2/1', lane: 'jungle', team: 'blue' },
  { id: 'b3', name: 'Yuelun', role: 'MID', hp: 45, mp: 80, lvl: 14, kda: '1/0/0', lane: 'mid', team: 'blue' },
  { id: 'b4', name: 'Abler', role: 'ADC', hp: 100, mp: 90, lvl: 10, kda: '10/2/1', lane: 'bot', team: 'blue' },
  { id: 'b5', name: 'Mith', role: 'SUP', hp: 60, mp: 70, lvl: 10, kda: '1/1/9', lane: 'bot', team: 'blue' },
  
  // TEAM RED (Enemy)
  { id: 'r1', name: 'Ring', role: 'TOP', hp: 20, mp: 10, lvl: 13, kda: '0/2/0', lane: 'top', team: 'red' },
  { id: 'r2', name: 'Aka', role: 'JUN', hp: 100, mp: 50, lvl: 10, kda: '1/2/3', lane: 'jungle', team: 'red' },
  { id: 'r3', name: 'Phoenix', role: 'MID', hp: 70, mp: 40, lvl: 13, kda: '0/1/0', lane: 'mid', team: 'red' },
  { id: 'r4', name: 'Keth', role: 'ADC', hp: 50, mp: 30, lvl: 9, kda: '3/4/1', lane: 'bot', team: 'red' },
  { id: 'r5', name: 'Watch', role: 'SUP', hp: 10, mp: 20, lvl: 10, kda: '0/7/2', lane: 'bot', team: 'red' },
];

export default function MobaMatchSim({ navigation }) {
  const [heroes, setHeroes] = useState(INITIAL_HEROES);
  const [gameTime, setGameTime] = useState(0); // Detik
  const [scores, setScores] = useState({ blue: 16, red: 4 });
  const [gold, setGold] = useState({ blue: 29.9, red: 20.6 }); // Dalam ribuan (K)
  const [battleLog, setBattleLog] = useState([
    { time: '17:31', text: 'Braveman killed Night Archer', color: 'green' },
    { time: '17:32', text: 'E-LEGEND destroyed a defense tower', color: 'cyan' },
  ]);
  
  // Posisi animasi untuk hero di map (0-100 scale)
  const heroAnims = useRef(INITIAL_HEROES.map(() => new Animated.ValueXY({ x: 10, y: 90 }))).current;

  // --- GAME LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime(t => t + 1);
      
      // Update Logika Simulasi Sederhana
      updatePositions();
      simulateCombat();
    }, 1000); // 1 detik game = 1 detik asli (bisa dipercepat)

    return () => clearInterval(interval);
  }, []);

  // Format Waktu (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${18 + mins}:${secs < 10 ? '0' : ''}${secs}`; // Start jam 18:00 mock
  };

  // Update Posisi Hero di Map (Mock Movement)
  const updatePositions = () => {
    heroes.forEach((hero, index) => {
      // Logika pergerakan sangat sederhana: bolak balik di lane
      const path = LANE_PATHS[hero.lane] || LANE_PATHS.mid;
      // Random movement jitter
      const jitterX = Math.random() * 5 - 2.5;
      const jitterY = Math.random() * 5 - 2.5;
      
      // Target ditentukan berdasarkan tim (Biru gerak ke kanan atas, Merah ke kiri bawah)
      // Ini hanya visualisasi mock
      let targetX = hero.team === 'blue' ? 60 : 40;
      let targetY = hero.team === 'blue' ? 40 : 60;

      if (hero.role === 'TOP') { targetX = 50; targetY = 10; }
      if (hero.role === 'ADC') { targetX = 80; targetY = 80; }

      Animated.timing(heroAnims[index], {
        toValue: { x: targetX + jitterX, y: targetY + jitterY },
        duration: 900,
        useNativeDriver: false
      }).start();
    });
  };

  const simulateCombat = () => {
    // Random chance terjadi kill
    if (Math.random() > 0.8) {
      const isBlueKill = Math.random() > 0.3; // Tim biru lebih jago (sesuai skor)
      const killer = isBlueKill ? heroes[Math.floor(Math.random() * 5)] : heroes[Math.floor(Math.random() * 5) + 5];
      const victim = isBlueKill ? heroes[Math.floor(Math.random() * 5) + 5] : heroes[Math.floor(Math.random() * 5)];
      
      const newLog = {
        time: formatTime(gameTime),
        text: `${killer.name} killed ${victim.name}`,
        color: isBlueKill ? '#4ade80' : '#f87171'
      };
      
      setBattleLog(prev => [newLog, ...prev.slice(0, 4)]);
      setScores(prev => ({
        blue: isBlueKill ? prev.blue + 1 : prev.blue,
        red: !isBlueKill ? prev.red + 1 : prev.red
      }));
    }
  };

  // --- SUB-COMPONENTS ---

  const HeroStatsRow = ({ hero, isRight }) => (
    <View style={[styles.heroRow, isRight && styles.heroRowRight]}>
      {/* Role Badge */}
      <View style={[styles.roleBadge, { backgroundColor: getRoleColor(hero.role) }]}>
        <Text style={styles.roleText}>{hero.role}</Text>
      </View>

      {/* Stats Info */}
      <View style={[styles.statsInfo, isRight ? { alignItems: 'flex-end', marginRight: 5 } : { marginLeft: 5 }]}>
        <View style={styles.kdaLevelRow}>
          {!isRight && <Text style={styles.levelText}>{hero.lvl}</Text>}
          <Text style={styles.kdaText}>{hero.kda}</Text>
          {isRight && <Text style={styles.levelText}>{hero.lvl}</Text>}
        </View>
        {/* Bars */}
        <View style={styles.barContainer}>
          <View style={[styles.hpBar, { width: `${hero.hp}%` }]} />
        </View>
        <View style={[styles.barContainer, { marginTop: 2 }]}>
          <View style={[styles.mpBar, { width: `${hero.mp}%` }]} />
        </View>
      </View>

      {/* Hero Icon */}
      <View style={styles.heroIconContainer}>
        <Image 
          source={{ uri: `https://ui-avatars.com/api/?name=${hero.name}&background=random` }} 
          style={[styles.heroIconImage, hero.hp <= 0 && styles.deadHero]}
        />
        {/* Ult Indicator */}
        <View style={[styles.ultDot, hero.mp > 90 ? styles.ultReady : styles.ultNotReady]} />
        {/* Death Timer Overlay if needed */}
        {hero.hp <= 0 && (
          <View style={styles.deathTimer}>
            <Text style={styles.deathText}>20s</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. TOP HEADER (Scoreboard) */}
      <View style={styles.header}>
        <View style={styles.teamHeaderLeft}>
          <View style={styles.teamLogoBlue}><Text>🛡️</Text></View>
          <Text style={styles.teamName}>E-LEGEND</Text>
        </View>
        
        <View style={styles.scoreboard}>
          <View style={styles.scoreInfo}>
            <Text style={styles.goldText}>💰 {gold.blue}K</Text>
            <Text style={styles.scoreBlue}>{scores.blue}</Text>
          </View>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(gameTime)}</Text>
            <Text style={styles.vsText}>⚔️</Text>
          </View>

          <View style={styles.scoreInfo}>
            <Text style={styles.scoreRed}>{scores.red}</Text>
            <Text style={styles.goldText}>💰 {gold.red}K</Text>
          </View>
        </View>

        <View style={styles.teamHeaderRight}>
          <Text style={styles.teamName}>Grey Fox</Text>
          <View style={styles.teamLogoRed}><Text>🐺</Text></View>
        </View>
      </View>

      {/* 2. MAIN CONTENT AREA */}
      <View style={styles.mainArea}>
        
        {/* LEFT PANEL (Blue Team) */}
        <View style={styles.sidePanel}>
          {heroes.filter(h => h.team === 'blue').map((hero) => (
            <HeroStatsRow key={hero.id} hero={hero} isRight={false} />
          ))}
          
          {/* Strategy Control (Bottom Left) */}
          <View style={styles.strategyContainer}>
            <View style={styles.strategyHeader}>
              <Text style={styles.strategyTitle}>STRATEGY</Text>
            </View>
            <View style={styles.strategyRow}>
              <StrategyButton label="CONSERVATIVE" active={false} />
              <StrategyButton label="BALANCED" active={true} />
              <StrategyButton label="RADICAL" active={false} />
            </View>
            <View style={styles.strategyRow}>
              <StrategyButton label="GROWTH" active={false} />
              <StrategyButton label="BALANCED" active={true} />
              <StrategyButton label="STROLL" active={false} />
            </View>
            <View style={styles.strategyRow}>
              <StrategyButton label="PUSH" active={false} />
              <StrategyButton label="BALANCED" active={true} />
              <StrategyButton label="REGIMENT" active={false} />
            </View>
          </View>
        </View>

        {/* CENTER MAP */}
        <View style={styles.mapContainer}>
          {/* Map Background Image */}
          <Image 
            source={{ uri: 'https://via.placeholder.com/600x600/1a2c2a/335544?text=MOBA+MAP' }}
            style={styles.mapImage}
            resizeMode="cover"
          />
          
          {/* Towers (Static Visuals) */}
          <View style={[styles.tower, { top: '15%', left: '15%', backgroundColor: '#3b82f6' }]} />
          <View style={[styles.tower, { top: '85%', left: '85%', backgroundColor: '#ef4444' }]} />
          <View style={[styles.tower, { top: '50%', left: '50%', backgroundColor: '#fbbf24' }]} /> {/* Mid conflict */}

          {/* Hero Icons (Animated) */}
          {heroes.map((hero, index) => (
            <Animated.View
              key={hero.id}
              style={[
                styles.mapHeroMarker,
                {
                  left: heroAnims[index].x.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                  top: heroAnims[index].y.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                  borderColor: hero.team === 'blue' ? '#3b82f6' : '#ef4444'
                }
              ]}
            >
              <Image 
                source={{ uri: `https://ui-avatars.com/api/?name=${hero.name}&background=random` }} 
                style={styles.mapHeroImage}
              />
              {/* HP Bar Kecil di Map */}
              <View style={styles.mapHpBar}><View style={{width: `${hero.hp}%`, height: '100%', backgroundColor: '#4ade80'}} /></View>
            </Animated.View>
          ))}
        </View>

        {/* RIGHT PANEL (Red Team) */}
        <View style={styles.sidePanel}>
          {heroes.filter(h => h.team === 'red').map((hero) => (
            <HeroStatsRow key={hero.id} hero={hero} isRight={true} />
          ))}

          {/* Battle Log (Bottom Right) */}
          <View style={styles.logContainer}>
            <Text style={styles.logTitle}>BATTLE LOG</Text>
            <ScrollView style={styles.logScroll}>
              {battleLog.map((log, i) => (
                <Text key={i} style={[styles.logText, { color: log.color }]}>
                  {log.time} {log.text}
                </Text>
              ))}
            </ScrollView>
            <View style={styles.logActions}>
              <TouchableOpacity style={styles.speedButton}><Text style={styles.btnText}>⏩ 2x</Text></TouchableOpacity>
              <TouchableOpacity style={styles.skipButton}><Text style={styles.btnText}>SKIP</Text></TouchableOpacity>
            </View>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

// Helper Components
const StrategyButton = ({ label, active }) => (
  <TouchableOpacity style={[styles.stratBtn, active ? styles.stratBtnActive : styles.stratBtnInactive]}>
    <Text style={[styles.stratText, active && styles.stratTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const getRoleColor = (role) => {
  switch(role) {
    case 'TOP': return '#ef4444';
    case 'JUN': return '#22c55e';
    case 'MID': return '#3b82f6';
    case 'ADC': return '#eab308';
    case 'SUP': return '#a855f7';
    default: return '#6b7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark Navy Background
  },
  // --- HEADER ---
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#334155',
  },
  teamHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  teamHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  teamLogoBlue: { width: 40, height: 40, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', transform: [{skewX: '-15deg'}], marginRight: 5 },
  teamLogoRed: { width: 40, height: 40, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', transform: [{skewX: '15deg'}], marginLeft: 5 },
  teamName: { color: '#FFF', fontWeight: 'bold', fontSize: 16, fontStyle: 'italic' },
  
  scoreboard: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  scoreInfo: { alignItems: 'center', marginHorizontal: 15 },
  scoreBlue: { color: '#60a5fa', fontSize: 24, fontWeight: 'bold' },
  scoreRed: { color: '#f87171', fontSize: 24, fontWeight: 'bold' },
  goldText: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
  timerContainer: { backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 5, alignItems: 'center' },
  timerText: { color: '#FFF', fontSize: 16, fontFamily: 'monospace' },
  vsText: { fontSize: 10, color: '#94a3b8' },

  // --- MAIN AREA ---
  mainArea: {
    flex: 1,
    flexDirection: 'row',
  },
  sidePanel: {
    width: width * 0.22, // 22% lebar layar
    paddingVertical: 5,
    justifyContent: 'space-between',
  },
  mapContainer: {
    flex: 1, // Sisa ruang tengah
    margin: 5,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#050505',
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
  },
  mapImage: { width: '100%', height: '100%', opacity: 0.6 },

  // --- HERO ROW ---
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingVertical: 4,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  heroRowRight: {
    flexDirection: 'row-reverse',
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderRightColor: '#ef4444',
  },
  roleBadge: {
    width: 20,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    marginHorizontal: 2,
  },
  roleText: { fontSize: 8, color: '#FFF', fontWeight: 'bold' },
  statsInfo: { flex: 1 },
  kdaLevelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  levelText: { color: '#60a5fa', fontSize: 10, fontWeight: 'bold' },
  kdaText: { color: '#FFF', fontSize: 10 },
  barContainer: { height: 4, backgroundColor: '#333', borderRadius: 2, width: '100%' },
  hpBar: { height: '100%', backgroundColor: '#4ade80', borderRadius: 2 },
  mpBar: { height: '100%', backgroundColor: '#60a5fa', borderRadius: 2 },
  heroIconContainer: { position: 'relative', marginHorizontal: 2 },
  heroIconImage: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#FFF' },
  deadHero: { opacity: 0.3, borderColor: '#ef4444' },
  ultDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 0, right: 0, borderWidth: 1, borderColor: '#000' },
  ultReady: { backgroundColor: '#4ade80' },
  ultNotReady: { backgroundColor: '#333' },
  deathTimer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16 },
  deathText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },

  // --- MAP ELEMENTS ---
  mapHeroMarker: { position: 'absolute', width: 24, height: 24, borderRadius: 12, borderWidth: 2, zIndex: 10 },
  mapHeroImage: { width: '100%', height: '100%', borderRadius: 12 },
  mapHpBar: { position: 'absolute', top: -4, left: 0, right: 0, height: 2, backgroundColor: 'red' },
  tower: { position: 'absolute', width: 15, height: 15, borderRadius: 3, borderWidth: 1, borderColor: '#FFF' },

  // --- STRATEGY PANEL ---
  strategyContainer: {
    backgroundColor: '#1e293b',
    borderTopRightRadius: 10,
    overflow: 'hidden',
    marginTop: 'auto', // Push to bottom
  },
  strategyHeader: { backgroundColor: '#0ea5e9', padding: 2 },
  strategyTitle: { color: '#FFF', fontSize: 10, textAlign: 'center', fontWeight: 'bold' },
  strategyRow: { flexDirection: 'row', marginTop: 1 },
  stratBtn: { flex: 1, paddingVertical: 4, alignItems: 'center', borderWidth: 0.5, borderColor: '#334155' },
  stratBtnActive: { backgroundColor: '#3b82f6' },
  stratBtnInactive: { backgroundColor: '#0f172a' },
  stratText: { color: '#94a3b8', fontSize: 6 },
  stratTextActive: { color: '#FFF', fontWeight: 'bold' },

  // --- LOG PANEL ---
  logContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 10,
    marginTop: 'auto',
    height: 120,
  },
  logTitle: { color: '#94a3b8', fontSize: 10, padding: 4, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  logScroll: { flex: 1, padding: 5 },
  logText: { fontSize: 9, marginBottom: 2, fontFamily: 'monospace' },
  logActions: { flexDirection: 'row', height: 30 },
  speedButton: { flex: 1, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  skipButton: { flex: 1, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
});