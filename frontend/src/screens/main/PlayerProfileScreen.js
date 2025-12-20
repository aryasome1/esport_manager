/**
 * Player Profile Screen (Dossier Style)
 * Design based on reference: image_602f12.jpg
 * Features: Dynamic Avatar, Real Stats, Equipment Slots
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
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

// [IMPORT BARU] Import utility avatar
import { getPlayerAvatar } from '../../utils/PlayerAvatars';

const { width } = Dimensions.get('window');

export default function PlayerProfileScreen({ route, navigation }) {
  const { player } = route.params;
  
  // [LOGIC] Ambil Role & Avatar
  const playerRole = player.current_role || player.role || player.position || 'Unknown';
  const avatarSource = getPlayerAvatar(playerRole);

  const [loading, setLoading] = useState(true);
  const [heroData, setHeroData] = useState(null);

  useEffect(() => {
    // Simulasi loading data equipment (nanti bisa dari DB juga)
    setTimeout(() => {
      setHeroData({
        equipment: [
          { id: 1, img: 'https://mobilelegends.fandom.com/wiki/Special:FilePath/Swift_Boots.png' },
          { id: 2, img: 'https://mobilelegends.fandom.com/wiki/Special:FilePath/Berserker%27s_Fury.png' },
          { id: 3, img: 'https://mobilelegends.fandom.com/wiki/Special:FilePath/Endless_Battle.png' },
          { id: 4, img: 'https://mobilelegends.fandom.com/wiki/Special:FilePath/Blade_of_Despair.png' },
        ]
      });
      setLoading(false);
    }, 500);
  }, []);

  const StatBar = ({ label, value1, value2 }) => (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValues}>
        <Text style={styles.val1}>{value1}</Text>
        <Text style={styles.val2}>{value2}</Text>
      </View>
    </View>
  );

  // Mapping statistik dari DB
  const attackVal = player.mechanics || player.tactical_aim || 75;
  const skillVal = player.macro || player.tactical_gamesense || 70;
  const speedVal = player.kda_avg ? Math.min(Math.round(player.kda_avg * 10), 99) : 60; // KDA -> 0-99 scale roughly
  const mentalVal = player.morale || 80;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={16} color="#fff" />
          <Text style={styles.backText}> BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>ESPORTS MANAGER</Text>
          <Text style={styles.headerSubtitle}>PLAYER DOSSIER</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        
        {/* LEFT COLUMN: HERO IMAGE / AVATAR */}
        <View style={styles.leftCol}>
          <View style={styles.heroFrame}>
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 100 }} />
            ) : (
              <Animatable.Image 
                animation="fadeInLeft"
                source={avatarSource}  // [UPDATED] Pakai avatarSource
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
          <Animatable.View animation="fadeInRight" delay={200} style={styles.infoBox}>
            <Text style={styles.heroName} numberOfLines={1}>
                {player.ign || player.username || 'PLAYER'}
            </Text>
            <View style={styles.roleBox}>
              <Text style={styles.roleLabel}>ROLE: </Text>
              <Text style={styles.roleValue}>{playerRole.toUpperCase()}</Text>
            </View>
            <Text style={styles.teamText}>Phantom Gaming</Text>
          </Animatable.View>

          {/* STATS COMPARISON */}
          <Animatable.View animation="fadeInRight" delay={300} style={styles.statsContainer}>
            <View style={styles.statHeader}>
              <Text style={styles.statColHeader}></Text>
              <Text style={styles.statColHeader}>CUR</Text>
              <Text style={styles.statColHeader}>MAX</Text>
            </View>
            <StatBar label="OFFENSE" value1={attackVal} value2={99} />
            <StatBar label="GAME IQ" value1={skillVal} value2={99} />
            <StatBar label="MECHANIC" value1={speedVal} value2={99} />
            <StatBar label="MENTAL" value1={mentalVal} value2={100} />
            <StatBar label="ENERGY" value1={player.energy || 100} value2={100} />
          </Animatable.View>

          {/* EQUIPMENT CARDS */}
          <Animatable.View animation="fadeInRight" delay={400} style={styles.cardsContainer}>
            {[1, 2, 3, 4].map((slot) => (
              <View key={slot} style={styles.cardSlot}>
                <View style={styles.cardLevelBadge}><Text style={styles.lvlText}>{slot}</Text></View>
                {heroData && (
                    <Image 
                      source={{ uri: heroData.equipment[slot-1]?.img }} 
                      style={styles.cardImage} 
                    />
                )}
                <View style={styles.cardArrow}><Text style={{color:'#000', fontSize:8}}>▲</Text></View>
              </View>
            ))}
          </Animatable.View>

          {/* UPGRADE BUTTON */}
          <Animatable.View animation="bounceIn" delay={600}>
            <TouchableOpacity style={styles.upgradeBtn}>
                <Text style={styles.upgradeText}>TRAINING DRILL</Text>
            </TouchableOpacity>
          </Animatable.View>

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingTop: 40, backgroundColor: '#1e293b', borderBottomWidth: 2, borderColor: '#334155' },
  backBtn: { flexDirection: 'row', alignItems:'center', padding: 8, backgroundColor: '#334155', borderRadius: 5, borderWidth:1, borderColor:'#475569' },
  backText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
  headerInfo: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  headerSubtitle: { color: '#94a3b8', fontSize: 9, letterSpacing: 2 },

  content: { flex: 1, flexDirection: 'row' },

  // Left Column
  leftCol: { width: '45%', backgroundColor: '#1e293b', borderRightWidth: 2, borderColor: '#334155' },
  heroFrame: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  // [FIX] Style untuk Avatar agar pas di kolom kiri
  heroFullImage: { 
      width: '100%', 
      height: '80%', // Sesuaikan tinggi
      marginLeft: 0, 
      marginTop: 20
  }, 
  fadeOverlay: { position: 'absolute', bottom: 0, width: '100%', height: 100 },

  // Right Column
  rightCol: { flex: 1, padding: 15, justifyContent: 'space-between' },
  
  infoBox: { marginBottom: 10, borderBottomWidth: 1, borderColor: '#334155', paddingBottom: 10 },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1, fontStyle: 'italic' },
  roleBox: { flexDirection: 'row', marginTop: 5 },
  roleLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  roleValue: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },
  teamText: { color: '#64748b', fontSize: 10, marginTop: 4, fontStyle: 'italic' },

  // Stats
  statsContainer: { marginBottom: 10 },
  statHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 5 },
  statColHeader: { color: '#94a3b8', fontSize: 8, width: 30, textAlign: 'center', fontWeight: 'bold' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, backgroundColor: '#1e293b', padding: 4, borderRadius: 4, borderWidth: 1, borderColor: '#334155' },
  statLabel: { color: '#fff', fontSize: 10, fontWeight: 'bold', paddingLeft: 4 },
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