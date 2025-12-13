/**
 * Player Profile Screen
 * Design based on reference: image_602f12.jpg
 * Connects to MOBA API for Hero Images
 * ADAPTED: Safe check for props coming from MobaRoster/TacticalTeam
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
import { Ionicons } from '@expo/vector-icons'; // Tambahan untuk icon

const { width, height } = Dimensions.get('window');

export default function PlayerProfileScreen({ route, navigation }) {
  const { player } = route.params;
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi loading & Data Processing
    setTimeout(() => {
      // [ADAPTASI] Deteksi sumber gambar (Moba vs Tactical vs Mock)
      let displayImage = 'https://via.placeholder.com/400x600'; // Default
      
      if (player.signature_hero_image) displayImage = player.signature_hero_image; // Dari DB MOBA
      else if (player.agentImage) displayImage = player.agentImage; // Dari DB Tactical
      else if (player.image) displayImage = player.image; // Fallback legacy

      setHeroData({
        fullImage: displayImage,
        realImage: displayImage, 
        lore: player.full_name ? `${player.full_name} is a professional player currently assigned to the ${player.current_role || 'Flex'} position.` : "A specialized hero focusing on high damage output...",
        equipment: [
          { id: 1, name: 'Swift Boots', img: 'https://mobilelegends.fandom.com/wiki/Special:FilePath/Swift_Boots.png', level: 1 },
          { id: 2, name: 'Berserker', img: 'https://mobilelegends.fandom.com/wiki/Special:FilePath/Berserker%27s_Fury.png', level: 2 },
          { id: 3, name: 'Endless', img: 'https://mobilelegends.fandom.com/wiki/Special:FilePath/Endless_Battle.png', level: 3 },
          { id: 4, name: 'Blade', img: 'https://mobilelegends.fandom.com/wiki/Special:FilePath/Blade_of_Despair.png', level: 4 },
        ]
      });
      setLoading(false);
    }, 800);
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

  // [ADAPTASI] Mapping statistik dari DB ke UI
  // Jika data stats spesifik tidak ada, gunakan OVR sebagai base
  const attackVal = player.tactical_aim || player.moba_laning_skill || player.ovr || 80;
  const skillVal = player.tactical_gamesense || player.moba_teamfight_presence || (player.ovr - 5) || 75;
  const speedVal = player.ovr ? Math.round(player.ovr * 0.9) : 85;

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
        {/* LEFT COLUMN: HERO IMAGE */}
        <View style={styles.leftCol}>
          <View style={styles.heroFrame}>
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 100 }} />
            ) : (
              <Animatable.Image 
                animation="fadeInLeft"
                source={{ uri: heroData?.realImage }} 
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
            <Text style={styles.heroName}>{player.name?.toUpperCase()}</Text>
            <View style={styles.roleBox}>
              <Text style={styles.roleLabel}>ROLE: </Text>
              <Text style={styles.roleValue}>{player.current_role?.toUpperCase() || 'UNKNOWN'}</Text>
            </View>
          </Animatable.View>

          {/* STATS COMPARISON (Current vs Max/Next) */}
          <Animatable.View animation="fadeInRight" delay={300} style={styles.statsContainer}>
            <View style={styles.statHeader}>
              <Text style={styles.statColHeader}></Text>
              <Text style={styles.statColHeader}>CUR</Text>
              <Text style={styles.statColHeader}>MAX</Text>
            </View>
            <StatBar label="OFFENSE" value1={attackVal} value2={99} />
            <StatBar label="GAME IQ" value1={skillVal} value2={99} />
            <StatBar label="MECHANIC" value1={speedVal} value2={99} />
            <StatBar label="MENTAL" value1={player.mental || 70} value2={100} />
            <StatBar label="FATIGUE" value1={player.fatigue || 0} value2={100} />
          </Animatable.View>

          {/* EQUIPMENT CARDS (Visual Only for now) */}
          <Animatable.View animation="fadeInRight" delay={400} style={styles.cardsContainer}>
            {[1, 2, 3, 4].map((slot) => (
              <View key={slot} style={styles.cardSlot}>
                <View style={styles.cardLevelBadge}><Text style={styles.lvlText}>{slot}</Text></View>
                {/* Placeholder item image jika heroData belum load */}
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
  heroFullImage: { width: '150%', height: '100%', marginLeft: -30 }, // Zoom effect
  fadeOverlay: { position: 'absolute', bottom: 0, width: '100%', height: 100 },

  // Right Column
  rightCol: { flex: 1, padding: 15, justifyContent: 'space-between' },
  
  infoBox: { marginBottom: 10, borderBottomWidth: 1, borderColor: '#334155', paddingBottom: 10 },
  heroName: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1, fontStyle: 'italic' },
  roleBox: { flexDirection: 'row', marginTop: 5 },
  roleLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  roleValue: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },

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