/**
 * Player Profile Screen (Dossier Style)
 * Design based on reference: image_602f12.jpg
 * Features: Dynamic Avatar, Real Stats, Equipment Slots, Mastery List
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
  ActivityIndicator,
  ScrollView // Added ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Utilities
import { getPlayerAvatar } from '../../utils/PlayerAvatars';
import { getHeroImage } from '../../utils/HeroAssets';
import { apiClient } from '../../services/ApiClient';

const { width } = Dimensions.get('window');

export default function PlayerProfileScreen({ route, navigation }) {
  const { player: initialPlayer } = route.params;
  const [player, setPlayer] = useState(initialPlayer);
  const [loading, setLoading] = useState(true);
  const [heroData, setHeroData] = useState(null);

  // Fetch full details
  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const response = await apiClient.get(`/api/players/${initialPlayer.id}`);
        setPlayer(response.data);
      } catch (err) {
        console.error("Failed to fetch player details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullProfile();

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
    }, 500);
  }, [initialPlayer.id]);

  // [LOGIC] Ambil Role & Avatar
  const playerRole = player.current_role || player.role || player.position || 'Unknown';

  // Use assigned_hero image if available (from local assets), else generic/signature logic
  const assignedHero = player.assigned_hero;

  // Resolve Avatar Source:
  // 1. If Assigned Hero -> Local Asset (getHeroImage)
  // 2. If Signature Hero URL -> Remote URL
  // 3. Fallback -> Generic Player Avatar
  let avatarSource;
  if (assignedHero) {
    avatarSource = getHeroImage(assignedHero.id);
  } else if (player.signature_hero_image && player.signature_hero_image.startsWith('http')) {
    avatarSource = { uri: player.signature_hero_image };
  } else {
    avatarSource = getPlayerAvatar(player.id);
  }

  const heroName = assignedHero?.name || player.signature_hero_name || 'UNKNOWN HERO';

  // Stats Logic
  const heroBasePower = assignedHero?.base_power || 50;
  const attackVal = player.mechanics || player.tactical_aim || 75;
  const skillVal = player.macro || player.tactical_gamesense || 70;
  const speedVal = player.kda_avg ? Math.min(Math.round(player.kda_avg * 10), 99) : 60;
  const mentalVal = player.morale || 80;
  const heroPower = Math.round((heroBasePower * 0.4) + (attackVal * 0.3) + (skillVal * 0.3));

  const StatBar = ({ label, value1, value2 }) => (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValues}>
        <Text style={styles.val1}>{value1}</Text>
        <Text style={styles.val2}>{value2}</Text>
      </View>
    </View>
  );

  // Mastery List Logic
  const renderMasteryList = () => {
    if (!player.hero_stats || player.hero_stats.length === 0) return null;

    // Group by Role (Hero Class)
    const groupedStats = {};
    player.hero_stats.forEach(stat => {
      // Assume 'hero' is nested in stat response (updated schema)
      // If not, we might need to rely on what we have or fetch heroes separately.
      // Assuming backend 'get_player' returns nested hero details in hero_stats logic?
      // Wait, schema HeroStatResponse helper 'hero' field is optional.
      // Let's assume the API returns it (we didn't explicitly check that deep nest in backend code, checking now...)
      // In players.py: "hero_stats": hero_stats. HeroStat model has 'hero' relationship. Pydantic should serialize.

      const role = stat.hero?.hero_class || 'Unclassified';
      if (!groupedStats[role]) groupedStats[role] = [];
      groupedStats[role].push(stat);
    });

    return (
      <View style={styles.masterySection}>
        <Text style={styles.sectionTitle}>HERO MASTERY</Text>
        {Object.entries(groupedStats).map(([role, stats]) => (
          <View key={role} style={styles.roleGroup}>
            <Text style={styles.roleGroupTitle}>{role}</Text>
            {stats.map((stat, index) => {
              // Mastery Level Logic (Simple mapping based on hero_power)
              let mastery = 'I';
              if (stat.hero_power > 80) mastery = 'IV';
              else if (stat.hero_power > 60) mastery = 'III';
              else if (stat.hero_power > 40) mastery = 'II';

              return (
                <View key={index} style={styles.masteryItem}>
                  <Image source={getHeroImage(stat.hero_id)} style={styles.masteryIcon} />
                  <View style={styles.masteryInfo}>
                    <Text style={styles.masteryName}>{stat.hero?.name || `Hero ${stat.hero_id}`}</Text>
                    <Text style={styles.masterySub}>PWR {stat.hero_power}</Text>
                  </View>
                  <View style={[styles.masteryBadge, styles[`mastery${mastery}`]]}>
                    <Text style={styles.masteryBadgeText}>{mastery}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

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

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* WRAPPER FOR SCROLL IF NEEDED, but ensuring split layout persists */}

        {/* LEFT COLUMN: HERO IMAGE / AVATAR */}
        <View style={styles.leftCol}>
          <View style={styles.heroFrame}>
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 100 }} />
            ) : (
              <Animatable.Image
                animation="fadeInLeft"
                source={avatarSource}
                style={styles.heroFullImage}
                resizeMode="cover"
              />
            )}
            <LinearGradient colors={['transparent', '#0f172a']} style={styles.fadeOverlay} />
          </View>
        </View>

        {/* RIGHT COLUMN: STATS & CARDS (SCROLLABLE) */}
        <ScrollView style={styles.rightCol} showsVerticalScrollIndicator={false}>
          <View style={{ padding: 15 }}>

            {/* NAME & ROLE */}
            <Animatable.View animation="fadeInRight" delay={200} style={styles.infoBox}>
              <Text style={styles.heroName} numberOfLines={1}>
                {player.ign || player.username || player.name || 'PLAYER'}
              </Text>
              <View style={styles.roleBox}>
                <Text style={styles.roleLabel}>ROLE: </Text>
                <Text style={styles.roleValue}>{playerRole.toUpperCase()}</Text>
              </View>
              <View style={styles.roleBox}>
                <Text style={styles.roleLabel}>HERO: </Text>
                <Text style={[styles.roleValue, { color: '#eab308' }]}>{heroName.toUpperCase()}</Text>
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
              <StatBar label="HERO PWR" value1={heroPower} value2={100} />
              <StatBar label="OFFENSE" value1={attackVal} value2={99} />
              <StatBar label="GAME IQ" value1={skillVal} value2={99} />
              <StatBar label="MECHANIC" value1={speedVal} value2={99} />
              <StatBar label="MENTAL" value1={mentalVal} value2={100} />
            </Animatable.View>

            {/* EQUIPMENT CARDS */}
            <Animatable.View animation="fadeInRight" delay={400} style={styles.cardsContainer}>
              {[1, 2, 3, 4].map((slot) => (
                <View key={slot} style={styles.cardSlot}>
                  <View style={styles.cardLevelBadge}><Text style={styles.lvlText}>{slot}</Text></View>
                  {heroData && (
                    <Image
                      source={{ uri: heroData.equipment[slot - 1]?.img }}
                      style={styles.cardImage}
                    />
                  )}
                  <View style={styles.cardArrow}><Text style={{ color: '#000', fontSize: 8 }}>▲</Text></View>
                </View>
              ))}
            </Animatable.View>

            {/* UPGRADE BUTTON */}
            <Animatable.View animation="bounceIn" delay={600}>
              <TouchableOpacity style={styles.upgradeBtn}>
                <Text style={styles.upgradeText}>TRAINING DRILL</Text>
              </TouchableOpacity>
            </Animatable.View>

            {/* MASTERY LIST */}
            {renderMasteryList()}

          </View>
        </ScrollView>

      </View>

      {/* BOTTOM NAV PLACEHOLDER */}
      <View style={styles.bottomNav}>
        {['🏠', '👥', '⚔️', '⚙️'].map((ic, i) => <Text key={i} style={{ fontSize: 20, opacity: 0.5 }}>{ic}</Text>)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, paddingTop: 40, backgroundColor: '#1e293b', borderBottomWidth: 2, borderColor: '#334155' },
  backBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#334155', borderRadius: 5, borderWidth: 1, borderColor: '#475569' },
  backText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
  headerInfo: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  headerSubtitle: { color: '#94a3b8', fontSize: 9, letterSpacing: 2 },

  // Layout
  leftCol: { width: '45%', backgroundColor: '#1e293b', borderRightWidth: 2, borderColor: '#334155' },
  rightCol: { flex: 1 },

  // Left Column Content
  heroFrame: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  heroFullImage: {
    width: '100%',
    height: '80%',
    marginLeft: 0,
    marginTop: 20
  },
  fadeOverlay: { position: 'absolute', bottom: 0, width: '100%', height: 100 },

  // Right Column Content
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
  cardArrow: { position: 'absolute', bottom: -5, backgroundColor: '#94a3b8', width: 12, height: 12, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },

  // Upgrade Button
  upgradeBtn: { backgroundColor: '#22c55e', padding: 12, borderRadius: 6, alignItems: 'center', borderWidth: 2, borderColor: '#166534', elevation: 5, shadowColor: '#22c55e', shadowOpacity: 0.5 },
  upgradeText: { color: '#022c22', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  // Mastery Section
  masterySection: { marginTop: 20 },
  sectionTitle: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10, borderBottomWidth: 1, borderColor: '#334155', paddingBottom: 5 },
  roleGroup: { marginBottom: 10 },
  roleGroupTitle: { color: '#64748b', fontSize: 10, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  masteryItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 8, borderRadius: 6, marginBottom: 5, borderColor: '#334155', borderWidth: 1 },
  masteryIcon: { width: 30, height: 30, borderRadius: 4, marginRight: 10, backgroundColor: '#0f172a' },
  masteryInfo: { flex: 1 },
  masteryName: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  masterySub: { color: '#94a3b8', fontSize: 10 },
  masteryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  masteryBadgeText: { fontSize: 9, fontWeight: 'bold' },
  // Badge Colors
  masteryI: { backgroundColor: 'rgba(148, 163, 184, 0.2)', borderColor: '#94a3b8', },
  masteryII: { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#22c55e', },
  masteryIII: { backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6', },
  masteryIV: { backgroundColor: 'rgba(234, 179, 8, 0.2)', borderColor: '#eab308', },

  bottomNav: { height: 50, backgroundColor: '#1e293b', borderTopWidth: 2, borderColor: '#334155', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }
});