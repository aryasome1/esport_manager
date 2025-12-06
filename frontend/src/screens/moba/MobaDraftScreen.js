/**
 * MobaDraftScreen.js
 * Tampilan Draft Ban/Pick dengan gaya eSports Legends
 * Lokasi: frontend/src/screens/moba/MobaDraftScreen.js
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

// --- MOCK DATA ---
const ROLES = ['TOP', 'JUN', 'MID', 'ADC', 'SUP'];

// Data Hero (Pool)
const HERO_POOL = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  name: `Hero ${i + 1}`,
  role: ROLES[i % 5],
  image: `https://ui-avatars.com/api/?name=H${i+1}&background=random&color=fff`
}));

// State Awal Tim
const INITIAL_TEAM_STATE = ROLES.map((role, index) => ({
  role,
  player: `Player ${index + 1}`,
  hero: null, // Hero yang dipilih
  locked: false
}));

export default function MobaDraftScreen({ navigation }) {
  // --- STATE ---
  const [blueTeam, setBlueTeam] = useState(INITIAL_TEAM_STATE);
  const [redTeam, setRedTeam] = useState(INITIAL_TEAM_STATE);
  const [bans, setBans] = useState({ blue: [], red: [] });
  const [phase, setPhase] = useState('BAN'); // BAN, PICK, SWAP
  const [turn, setTurn] = useState('blue'); // blue, red
  const [activeSlot, setActiveSlot] = useState(0); // Slot index yang sedang memilih
  const [selectedHero, setSelectedHero] = useState(null);

  // --- ACTIONS ---
  const handleHeroSelect = (hero) => {
    // Validasi: Apakah hero sudah dipick/ban?
    const isPicked = [...blueTeam, ...redTeam].some(s => s.hero?.id === hero.id);
    const isBanned = [...bans.blue, ...bans.red].some(b => b.id === hero.id);
    
    if (isPicked || isBanned) return;
    
    setSelectedHero(hero);
  };

  const handleLock = () => {
    if (!selectedHero) return;

    if (phase === 'BAN') {
      // Logika Ban Sederhana
      setBans(prev => ({
        ...prev,
        [turn]: [...prev[turn], selectedHero]
      }));
      // Ganti giliran atau pindah fase (Mock Logic)
      if (bans.blue.length + bans.red.length >= 5) {
        setPhase('PICK');
        setTurn('blue');
      } else {
        setTurn(turn === 'blue' ? 'red' : 'blue');
      }
    } else if (phase === 'PICK') {
      // Logika Pick
      const updateTeam = turn === 'blue' ? setBlueTeam : setRedTeam;
      
      updateTeam(prev => {
        const newState = [...prev];
        newState[activeSlot] = { ...newState[activeSlot], hero: selectedHero, locked: true };
        return newState;
      });

      // Lanjut ke slot berikutnya
      if (turn === 'red') setActiveSlot(prev => prev + 1);
      setTurn(turn === 'blue' ? 'red' : 'blue');
    }
    
    setSelectedHero(null);
  };

  // --- SUB-COMPONENTS ---

  // 1. Slot Pemain Vertikal (Kiri/Kanan)
  const TeamSlot = ({ data, isRight, isActive }) => (
    <View style={[styles.slotContainer, isRight && styles.slotRight, isActive && styles.slotActive]}>
      {/* Role Badge */}
      <View style={[styles.roleBadge, { backgroundColor: getRoleColor(data.role) }]}>
        <Text style={styles.roleText}>{data.role}</Text>
      </View>

      {/* Hero Image / Placeholder */}
      <View style={styles.heroFrame}>
        {data.hero ? (
          <Image source={{ uri: data.hero.image }} style={styles.heroImg} />
        ) : (
          <View style={styles.emptyHero} />
        )}
      </View>

      {/* Info Pemain */}
      <View style={[styles.playerInfo, isRight && { alignItems: 'flex-end' }]}>
        <Text style={styles.playerName}>{data.player}</Text>
        <Text style={styles.heroName}>{data.hero ? data.hero.name : 'Picking...'}</Text>
      </View>
    </View>
  );

  // 2. Ban Slot (Kecil di Atas)
  const BanSlot = ({ hero }) => (
    <View style={styles.banSlot}>
      {hero ? (
        <Image source={{ uri: hero.image }} style={styles.banImg} />
      ) : (
        <Text style={styles.banPlaceholder}>🚫</Text>
      )}
    </View>
  );

  // 3. Grafik Radar (Statistik Tim)
  const TeamRadar = ({ color }) => (
    <View style={styles.radarContainer}>
      <View style={[styles.radarShape, { borderColor: color }]}>
        <View style={[styles.radarFill, { backgroundColor: color }]} />
      </View>
      {/* Label Stat */}
      <Text style={[styles.statLabel, { top: 0 }]}>ATK</Text>
      <Text style={[styles.statLabel, { bottom: 0, left: 0 }]}>DEF</Text>
      <Text style={[styles.statLabel, { bottom: 0, right: 0 }]}>MAG</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* === HEADER BAR === */}
      <View style={styles.header}>
        <View style={styles.teamTitleBox}>
          <View style={[styles.teamLogo, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.teamTitleText}>E-LEGEND</Text>
        </View>
        
        <View style={styles.phaseBox}>
          <Text style={styles.phaseText}>
            {phase === 'BAN' ? 'BAN PHASE' : `PICKING: ${turn.toUpperCase()}`}
          </Text>
          <Text style={styles.timerText}>28</Text>
        </View>

        <View style={[styles.teamTitleBox, { flexDirection: 'row-reverse' }]}>
          <View style={[styles.teamLogo, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.teamTitleText}>GREY FOX</Text>
        </View>
      </View>

      {/* === MAIN CONTENT (3 COLUMNS) === */}
      <View style={styles.mainContent}>
        
        {/* KOLOM KIRI: TIM BIRU */}
        <View style={styles.sideColumn}>
          {blueTeam.map((slot, i) => (
            <TeamSlot 
              key={i} 
              data={slot} 
              isRight={false} 
              isActive={turn === 'blue' && phase === 'PICK' && activeSlot === i} 
            />
          ))}
          <View style={styles.radarWrapper}>
            <TeamRadar color="#3b82f6" />
          </View>
        </View>

        {/* KOLOM TENGAH: BAN & SELECTION */}
        <View style={styles.centerColumn}>
          
          {/* BAN HEADER */}
          <View style={styles.banHeader}>
            <View style={styles.banGroup}>
              {[0,1,2].map(i => <BanSlot key={i} hero={bans.blue[i]} />)}
            </View>
            <Text style={styles.vsText}>BANS</Text>
            <View style={styles.banGroup}>
              {[0,1,2].map(i => <BanSlot key={i} hero={bans.red[i]} />)}
            </View>
          </View>

          {/* HERO GRID (SELECTION) */}
          <View style={styles.heroGridContainer}>
            <ScrollView contentContainerStyle={styles.heroGrid}>
              {HERO_POOL.map((hero) => {
                const isSelected = selectedHero?.id === hero.id;
                // Cek status disabled (sudah dipick/ban)
                const isUsed = [...blueTeam, ...redTeam].some(s => s.hero?.id === hero.id) ||
                               [...bans.blue, ...bans.red].some(b => b.id === hero.id);

                return (
                  <TouchableOpacity
                    key={hero.id}
                    style={[
                      styles.gridItem,
                      isSelected && styles.gridItemSelected,
                      isUsed && styles.gridItemDisabled
                    ]}
                    onPress={() => handleHeroSelect(hero)}
                    disabled={isUsed}
                  >
                    <Image source={{ uri: hero.image }} style={styles.gridHeroImg} />
                    {isUsed && <View style={styles.usedOverlay}><Text>❌</Text></View>}
                    <Text style={styles.gridHeroName} numberOfLines={1}>{hero.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionFooter}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]}>
              <Text style={styles.btnText}>LINEUP EFFECT</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.lockBtn, !selectedHero && { opacity: 0.5 }]}
              onPress={handleLock}
              disabled={!selectedHero}
            >
              <Text style={styles.lockBtnText}>LOCK IN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6B7280' }]}>
              <Text style={styles.btnText}>AUTO BAN</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* KOLOM KANAN: TIM MERAH */}
        <View style={styles.sideColumn}>
          {redTeam.map((slot, i) => (
            <TeamSlot 
              key={i} 
              data={slot} 
              isRight={true} 
              isActive={turn === 'red' && phase === 'PICK' && activeSlot === i} 
            />
          ))}
          <View style={styles.radarWrapper}>
            <TeamRadar color="#ef4444" />
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

// --- HELPERS ---
const getRoleColor = (role) => {
  switch(role) {
    case 'TOP': return '#ef4444'; // Merah
    case 'JUN': return '#22c55e'; // Hijau
    case 'MID': return '#3b82f6'; // Biru
    case 'ADC': return '#eab308'; // Kuning
    case 'SUP': return '#a855f7'; // Ungu
    default: return '#6b7280';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Background Gelap
  },
  // --- HEADER ---
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#334155',
  },
  teamTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  teamLogo: {
    width: 40, 
    height: 40,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  teamTitleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontStyle: 'italic',
  },
  phaseBox: {
    alignItems: 'center',
  },
  phaseText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },

  // --- MAIN LAYOUT ---
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 5,
  },
  sideColumn: {
    width: 80, // Kolom Tim (Kecil agar muat Grid tengah)
    justifyContent: 'flex-start',
    gap: 5,
  },
  centerColumn: {
    flex: 1, // Mengisi sisa ruang
    marginHorizontal: 5,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 10,
    padding: 5,
    justifyContent: 'space-between',
  },

  // --- TEAM SLOT ---
  slotContainer: {
    height: 65,
    backgroundColor: '#1e293b',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6', // Default Blue
    padding: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  slotRight: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderRightColor: '#ef4444',
  },
  slotActive: {
    borderColor: '#eab308',
    borderWidth: 2,
  },
  roleBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    zIndex: 10,
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  roleText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  heroFrame: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.6,
  },
  heroImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  emptyHero: { flex: 1, backgroundColor: '#334155' },
  playerInfo: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 2,
    paddingHorizontal: 4,
  },
  playerName: { color: '#fff', fontSize: 10, fontWeight: 'bold', textShadowColor: '#000', textShadowRadius: 2 },
  heroName: { color: '#cbd5e1', fontSize: 8 },

  // --- BAN HEADER ---
  banHeader: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 5,
    marginBottom: 5,
  },
  banGroup: { flexDirection: 'row', gap: 5 },
  banSlot: {
    width: 30,
    height: 30,
    backgroundColor: '#334155',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  banImg: { width: '100%', height: '100%', borderRadius: 2 },
  banPlaceholder: { fontSize: 10 },
  vsText: { color: '#64748b', fontSize: 10, fontWeight: 'bold', marginHorizontal: 10 },

  // --- HERO GRID ---
  heroGridContainer: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 5,
    padding: 5,
  },
  heroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  gridItem: {
    width: 50,
    height: 50,
    backgroundColor: '#334155',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#475569',
    overflow: 'hidden',
  },
  gridItemSelected: {
    borderColor: '#eab308',
    borderWidth: 2,
  },
  gridItemDisabled: {
    opacity: 0.4,
  },
  gridHeroImg: { width: '100%', height: '100%' },
  usedOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  gridHeroName: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: 8,
    textAlign: 'center',
  },

  // --- FOOTER ACTIONS ---
  actionFooter: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  actionBtn: {
    flex: 1,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 2,
  },
  lockBtn: {
    backgroundColor: '#3b82f6',
    flex: 2, // Lebih besar
    height: 45,
    borderWidth: 2,
    borderColor: '#60a5fa',
  },
  btnText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  lockBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },

  // --- RADAR MOCK ---
  radarWrapper: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  radarContainer: {
    width: 60,
    height: 60,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarShape: {
    width: 40,
    height: 40,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }], // Diamond shape
  },
  radarFill: {
    width: 25,
    height: 25,
    opacity: 0.5,
    position: 'absolute',
    top: 7,
    left: 7,
  },
  statLabel: {
    position: 'absolute',
    color: '#64748b',
    fontSize: 6,
    fontWeight: 'bold',
  },
});