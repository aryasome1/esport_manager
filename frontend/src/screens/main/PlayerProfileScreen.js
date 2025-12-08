/**
 * Player Profile Screen
 * Design based on reference: image_602f12.jpg
 * Connects to MOBA API for Hero Images
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

export default function PlayerProfileScreen({ route, navigation }) {
  const { player } = route.params;
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);

  // MOCK API FETCH (Karena direct API call ke ridwaanhall butuh proxy/backend)
  // Di sini kita simulasikan data yang sudah "fetched" dari backend
  useEffect(() => {
    // Simulasi loading
    setTimeout(() => {
      setHeroData({
        // Kita gunakan gambar High Res dari aset Mobile Legends
        fullImage: player.image.replace('square', '').replace('100', 'full'), // Mock logic
        // Kalau player.image url asli, kita pakai itu. Kalau ui-avatar, kita cari gambar hero MLBB.
        realImage: `https://img.mobilelegends.com/group1/M00/00/00/${getHeroImageId(player.name)}`, 
        lore: "A specialized hero focusing on high damage output...",
        equipment: [
          { id: 1, name: 'Swift Boots', img: 'https://img.mobilelegends.com/group1/M00/00/00/rB_yZmALhPuAGhYMAAA1s48x7sU482.jpg', level: 1 },
          { id: 2, name: 'Berserker', img: 'https://img.mobilelegends.com/group1/M00/00/00/rB_yZmALhPuAGhYMAAA1s48x7sU482.jpg', level: 2 },
          { id: 3, name: 'Endless', img: 'https://img.mobilelegends.com/group1/M00/00/00/rB_yZmALhPuAGhYMAAA1s48x7sU482.jpg', level: 3 },
          { id: 4, name: 'Blade', img: 'https://img.mobilelegends.com/group1/M00/00/00/rB_yZmALhPuAGhYMAAA1s48x7sU482.jpg', level: 4 },
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  // Helper untuk mapping nama hero ke dummy image ID (Biar keliatan real)
  const getHeroImageId = (name) => {
    // Ini ID contoh dari server image MLBB
    const map = {
      'Layla': 'rB_yZmALhMeAat8ZAAQhR-ae67g479.jpg', // Layla
      'Tigreal': 'rB_yZmALhOqAci2XAAQ9u8f35o8639.jpg', // Tigreal
      'Eudora': 'rB_yZmALhOCAV8yFAAPp1S_10WU236.jpg', // Eudora
      'Zilong': 'rB_yZmALhP6AX9l_AAM8s48x7sU222.jpg', // Zilong
    };
    return map[name] || 'rB_yZmALhMeAat8ZAAQhR-ae67g479.jpg'; // Default Layla
  };

  const StatBar = ({ label, value1, value2 }) => (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValues}>
        <Text style={styles.val1}>{value1}</Text>
        <Text style={styles.val2}>{value2}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>◀ BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>ESPORTS MANAGER</Text>
          <Text style={styles.headerSubtitle}>MOBA DIVISION - PLAYER PROFILE</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {/* LEFT COLUMN: HERO IMAGE */}
        <View style={styles.leftCol}>
          <View style={styles.heroFrame}>
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 100 }} />
            ) : (
              <Image 
                source={{ uri: heroData.realImage }} 
                style={styles.heroFullImage}
                resizeMode="cover"
              />
            )}
            <LinearGradient colors={['transparent', '#0f172a']} style={styles.fadeOverlay} />
          </View>
        </View>

        {/* RIGHT COLUMN: STATS & CARDS */}
        <View style={styles.rightCol}>
          
          {/* NAME & ROLE */}
          <View style={styles.infoBox}>
            <Text style={styles.heroName}>{player.name.toUpperCase()}</Text>
            <View style={styles.roleBox}>
              <Text style={styles.roleLabel}>ROLE: </Text>
              <Text style={styles.roleValue}>{player.role.toUpperCase()}</Text>
            </View>
          </View>

          {/* STATS COMPARISON (Current vs Max/Next) */}
          <View style={styles.statsContainer}>
            <View style={styles.statHeader}>
              <Text style={styles.statColHeader}></Text>
              <Text style={styles.statColHeader}>CUR</Text>
              <Text style={styles.statColHeader}>MAX</Text>
            </View>
            <StatBar label="ATTACK" value1={player.stats.attack || 90} value2={95} />
            <StatBar label="SKILL" value1={player.stats.skill || 88} value2={92} />
            <StatBar label="SPEED" value1={player.stats.speed || 85} value2={89} />
            <StatBar label="FARM" value1={75} value2={80} />
            <StatBar label="VISION" value1={86} value2={90} />
          </View>

          {/* EQUIPMENT CARDS */}
          <View style={styles.cardsContainer}>
            {[1, 2, 3, 4].map((slot) => (
              <View key={slot} style={styles.cardSlot}>
                <View style={styles.cardLevelBadge}><Text style={styles.lvlText}>{slot}</Text></View>
                <Image 
                  source={{ uri: `https://via.placeholder.com/100x100/333/fff?text=Item${slot}` }} 
                  style={styles.cardImage} 
                />
                <View style={styles.cardArrow}><Text style={{color:'#000', fontSize:8}}>▲</Text></View>
              </View>
            ))}
          </View>

          {/* UPGRADE BUTTON */}
          <TouchableOpacity style={styles.upgradeBtn}>
            <Text style={styles.upgradeText}>UPGRADE</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* BOTTOM NAV PLACEHOLDER */}
      <View style={styles.bottomNav}>
        {['🏠','👥','⚔️','⚙️'].map((ic,i) => <Text key={i} style={{fontSize:20, opacity:0.5}}>{ic}</Text>)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#1e293b', borderBottomWidth: 2, borderColor: '#334155' },
  backBtn: { padding: 8, backgroundColor: '#334155', borderRadius: 5, borderWidth:1, borderColor:'#475569' },
  backText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
  headerInfo: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 12 },
  headerSubtitle: { color: '#fff', fontSize: 9 },

  content: { flex: 1, flexDirection: 'row' },

  // Left Column
  leftCol: { width: '45%', backgroundColor: '#1e293b', borderRightWidth: 2, borderColor: '#334155' },
  heroFrame: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  heroFullImage: { width: '150%', height: '100%', marginLeft: -30 }, // Zoom effect
  fadeOverlay: { position: 'absolute', bottom: 0, width: '100%', height: 100 },

  // Right Column
  rightCol: { flex: 1, padding: 15, justifyContent: 'space-between' },
  
  infoBox: { marginBottom: 10, borderBottomWidth: 1, borderColor: '#334155', paddingBottom: 10 },
  heroName: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  roleBox: { flexDirection: 'row', marginTop: 5 },
  roleLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  roleValue: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Stats
  statsContainer: { marginBottom: 10 },
  statHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 5 },
  statColHeader: { color: '#94a3b8', fontSize: 8, width: 30, textAlign: 'center', fontWeight: 'bold' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, backgroundColor: '#1e293b', padding: 4, borderRadius: 4 },
  statLabel: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  statValues: { flexDirection: 'row' },
  val1: { color: '#fff', fontSize: 12, fontWeight: 'bold', width: 30, textAlign: 'center' },
  val2: { color: '#4ade80', fontSize: 12, fontWeight: 'bold', width: 30, textAlign: 'center' },

  // Cards
  cardsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cardSlot: { width: '22%', aspectRatio: 0.7, backgroundColor: '#334155', borderRadius: 4, borderWidth: 1, borderColor: '#94a3b8', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cardImage: { width: '80%', height: '60%', resizeMode: 'contain' },
  cardLevelBadge: { position: 'absolute', top: -5, left: -5, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fbbf24', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 1, borderColor: '#fff' },
  lvlText: { fontSize: 9, fontWeight: 'bold', color: '#000' },
  cardArrow: { position: 'absolute', bottom: -5, backgroundColor: '#94a3b8', width: 12, height: 12, transform: [{rotate: '45deg'}], alignItems: 'center', justifyContent: 'center' },

  // Upgrade Button
  upgradeBtn: { backgroundColor: '#22c55e', padding: 12, borderRadius: 6, alignItems: 'center', borderWidth: 2, borderColor: '#166534', elevation: 5, shadowColor: '#22c55e', shadowOpacity: 0.5 },
  upgradeText: { color: '#022c22', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  bottomNav: { height: 50, backgroundColor: '#1e293b', borderTopWidth: 2, borderColor: '#334155', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }
});