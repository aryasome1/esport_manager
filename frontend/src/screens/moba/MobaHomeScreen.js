/**
 * MobaHomeScreen.js
 * Base/Markas Tim MOBA (Versi Stabil - Tanpa Gambar Online)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useDivision } from '../../contexts/DivisionContext'; 

const { width } = Dimensions.get('window');

// Data Dummy Pemain
const TEAM_ROSTER = [
  { id: 1, name: 'Lemon', role: 'Mid', activity: 'training', energy: 80 },
  { id: 2, name: 'R7', role: 'Exp', activity: 'sleeping', energy: 40 },
  { id: 3, name: 'Alberttt', role: 'Jungle', activity: 'training', energy: 90 },
  { id: 4, name: 'Vyn', role: 'Roam', activity: 'analyzing', energy: 75 },
  { id: 5, name: 'Skylar', role: 'Gold', activity: 'training', energy: 85 },
];

export default function MobaHomeScreen({ navigation }) {
  const { exitDivision } = useDivision(); 
  const [gameDate, setGameDate] = useState({ week: 1, day: 1 });
  const [resources, setResources] = useState({ money: 5000, fans: 1200 });
  const [isWeekend, setIsWeekend] = useState(false);

  useEffect(() => {
    setIsWeekend(gameDate.day >= 6);
  }, [gameDate]);

  // Fungsi Logika Tombol Back
  const handleBackToMenu = () => {
    Alert.alert(
      "Exit Division",
      "Return to division selection?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Exit", 
          style: "destructive",
          onPress: () => {
            console.log("Exiting division...");
            exitDivision(); 
          }
        }
      ]
    );
  };

  const handleNextDay = () => {
    if (isWeekend) {
      navigation.navigate('MobaDraft');
    } else {
      setGameDate(prev => {
        const nextDay = prev.day + 1;
        if (nextDay > 7) return { week: prev.week + 1, day: 1 };
        return { ...prev, day: nextDay };
      });
      Alert.alert("Day Passed", "Training completed.");
    }
  };

  const getDayName = (day) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day - 1] || 'Mon';

  const PlayerAvatar = ({ player }) => (
    <TouchableOpacity style={styles.avatarContainer} onPress={() => Alert.alert(player.name, `Role: ${player.role}`)}>
      <View style={styles.energyBarBg}>
        <View style={[styles.energyBarFill, { width: `${player.energy}%` }]} />
      </View>
      {/* Menggunakan inisial nama sebagai avatar (Offline-safe) */}
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarInitial}>{player.name.charAt(0)}</Text>
      </View>
      <View style={styles.roleBadge}><Text style={styles.roleText}>{player.role[0]}</Text></View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 1. TOP HUD */}
      <View style={styles.topHud}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackToMenu}>
          <Text style={styles.backText}>◀ MENU</Text>
        </TouchableOpacity>

        <View style={styles.dateBox}>
          <View style={styles.weekBadge}><Text style={styles.weekText}>W{gameDate.week}</Text></View>
          <Text style={[styles.dayText, isWeekend && { color: '#ef4444' }]}>{getDayName(gameDate.day)}</Text>
        </View>

        <View style={styles.resBox}>
          <Text style={styles.resText}>💰 {resources.money}</Text>
          <Text style={styles.resText}>⭐ {resources.fans}</Text>
        </View>
      </View>

      {/* 2. HOUSE VIEW (Diganti View biasa, bukan ImageBackground) */}
      <View style={styles.houseArea}>
        <View style={styles.houseBg}> 
          <View style={styles.building}>
            {/* Lantai 2: Dorm */}
            <View style={[styles.floor, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
              <Text style={styles.roomName}>REST AREA</Text>
              <View style={styles.roomContent}>
                {TEAM_ROSTER.filter(p => ['sleeping', 'analyzing'].includes(p.activity)).map(p => <PlayerAvatar key={p.id} player={p} />)}
              </View>
            </View>
            {/* Lantai 1: Training */}
            <View style={[styles.floor, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderBottomWidth: 0 }]}>
              <Text style={styles.roomName}>TRAINING ROOM</Text>
              <View style={styles.roomContent}>
                {TEAM_ROSTER.filter(p => p.activity === 'training').map(p => <PlayerAvatar key={p.id} player={p} />)}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 3. BOTTOM MENU */}
      <View style={styles.bottomMenu}>
        <View style={styles.menuIcons}>
          {['Team', 'Train', 'Tactics', 'Shop'].map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={() => item === 'Team' && navigation.navigate('Team')}>
              <Text style={styles.menuIcon}>{['👥','🏋️','📋','👜'][i]}</Text>
              <Text style={styles.menuLabel}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.actionBtn, isWeekend ? { backgroundColor: '#ef4444' } : { backgroundColor: '#334155' }]}
          onPress={handleNextDay}
        >
          <Text style={styles.actionBtnText}>{isWeekend ? '⚔️ START MATCH' : '🌙 END DAY'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  // HUD
  topHud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 15, paddingBottom: 15, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155', zIndex: 10 },
  backBtn: { backgroundColor: '#334155', padding: 8, borderRadius: 5 },
  backText: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' },
  dateBox: { flexDirection: 'row', alignItems: 'center' },
  weekBadge: { backgroundColor: '#f59e0b', paddingHorizontal: 6, borderRadius: 4, marginRight: 5 },
  weekText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  dayText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resBox: { flexDirection: 'row', gap: 10 },
  resText: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold' },
  
  // House (Diperbaiki)
  houseArea: { flex: 1, backgroundColor: '#1e293b' }, // Fallback color
  houseBg: { flex: 1, justifyContent: 'flex-end', paddingBottom: 20 },
  building: { marginHorizontal: 20, borderWidth: 2, borderColor: '#475569', backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: 8, overflow: 'hidden' },
  floor: { height: 100, borderBottomWidth: 1, borderBottomColor: '#334155', padding: 5 },
  roomName: { position: 'absolute', top: 2, left: 5, color: '#64748b', fontSize: 8, fontWeight: 'bold' },
  roomContent: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: '100%', paddingBottom: 5 },
  
  // Avatar (Diperbaiki - Tanpa Gambar Online)
  avatarContainer: { alignItems: 'center' },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#fff', backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  roleBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#0f172a', width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fff' },
  roleText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  energyBarBg: { width: 30, height: 3, backgroundColor: '#333', marginBottom: 2, borderRadius: 1 },
  energyBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 1 },
  
  // Menu
  bottomMenu: { backgroundColor: '#1e293b', padding: 15, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  menuIcons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  menuItem: { alignItems: 'center', flex: 1 },
  menuIcon: { fontSize: 20, marginBottom: 2 },
  menuLabel: { color: '#94a3b8', fontSize: 10 },
  actionBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});