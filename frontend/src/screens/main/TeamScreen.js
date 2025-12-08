/**
 * Team Management Screen
 * REAL DATA VERSION: Fetches from Backend API
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, ImageBackground, Dimensions, SafeAreaView, StatusBar,
  Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../contexts/AuthContext';
import { useDivision } from '../../contexts/DivisionContext';
import { apiClient } from '../../services/ApiClient'; // Import API Client

export default function TeamScreen({ navigation }) {
  const { user } = useAuth();
  const { division } = useDivision(); // 'moba' atau 'valorant'
  
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Background asset
  const bgMap = division === 'valorant' 
    ? 'https://img.freepik.com/free-vector/cyberpunk-futuristic-city-background_23-2148798939.jpg' 
    : 'https://img.freepik.com/free-vector/hand-drawn-fantasy-map-mountains_23-2149506472.jpg';

  // --- FETCH DATA DARI API ---
  useEffect(() => {
    loadTeamData();
  }, [division]);

 const loadTeamData = async () => {
    setLoading(true);
    try {
        const teamId = 1; // Atau ambil dari user.team_id
        const response = await apiClient.get(`/api/players/?team_id=${teamId}`);
        
        if (response.data && response.data.items) {
            const formattedData = response.data.items.map(p => ({
                id: p.id,
                name: p.name,
                role: p.current_role ? p.current_role.toUpperCase() : 'UNKNOWN',
                ovr: p.ovr,
                
                // [NEW] Pakai gambar hero dari backend (dari API MLBB)
                // Kalau null, fallback ke avatar huruf
                image: p.signature_hero_image || `https://ui-avatars.com/api/?name=${p.name}&background=random&color=fff&size=200`,
                
                heroName: p.signature_hero_name, // Nama hero andalan
                
                stats: {
                    focus: p.focus,
                    mental: p.mental,
                    fatigue: p.fatigue,
                    ...(division === 'moba' ? {
                        laning: p.moba_laning_skill || 50,
                        teamfight: p.moba_teamfight_presence || 50
                    } : {
                        aim: p.tactical_aim || 50,
                        sense: p.tactical_gamesense || 50
                    })
                }
            }));
            setTeamData(formattedData);
        }
    } catch (error) {
        console.error("Failed to load team:", error);
        Alert.alert("Error", "Gagal memuat data tim.");
    } finally {
        setLoading(false);
    }
};

  const handleBackToDorm = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MainHub' }] });
  };

  const handleProfile = (player) => {
    navigation.navigate('PlayerProfile', { player });
  };

  // --- SUB COMPONENTS ---
  const TopHUD = () => (
    <View style={styles.topHudContainer}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackToDorm}>
          <Text style={styles.backText}>◀ DORM</Text>
        </TouchableOpacity>
        <View style={styles.currencyContainer}>
          <View style={styles.currencyBadge}><Text style={styles.currencyText}>💰 150K</Text></View>
          <View style={[styles.currencyBadge, { marginLeft: 5 }]}><Text style={styles.currencyText}>💎 500</Text></View>
        </View>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.managerCard}>
          <Image source={{ uri: 'https://ui-avatars.com/api/?name=Manager&background=0D8ABC&color=fff' }} style={styles.avatar} />
          <View>
            <Text style={styles.managerLabel}>MANAGER</Text>
            <Text style={styles.managerName}>{user?.username || 'Guest'}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', flex: 1 }}>
          <Text style={styles.headerTitle}>ESPORTS MANAGER</Text>
          <Text style={styles.headerSubtitle}>{division === 'valorant' ? 'FPS DIVISION' : 'MOBA DIVISION'} ROSTER</Text>
        </View>
      </View>
    </View>
  );

  const PlayerCard = ({ player, index }) => (
    <Animatable.View animation="fadeInUp" delay={index * 200} style={styles.cardWrapper}>
      <View style={styles.cardBorder}>
        <ImageBackground source={{ uri: bgMap }} style={styles.cardBackground} imageStyle={{ opacity: 0.3 }}>
          <LinearGradient colors={['rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.95)']} style={styles.cardGradient}>
            <View style={styles.cardContent}>
              <View style={styles.avatarSection}>
                <Image source={{ uri: player.image }} style={styles.playerImage} />
                <View style={styles.nameTag}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerTeam}>TEAM</Text>
                </View>
              </View>
              <View style={styles.statsSection}>
                <Text style={styles.roleHeader}>{player.role} <Text style={{color:'#fbbf24', fontSize: 12}}>OVR {player.ovr}</Text></Text>
                <View style={styles.statsGrid}>
                  {Object.entries(player.stats).map(([key, value], i) => (
                    <View key={i} style={styles.statItem}>
                      <Text style={styles.statLabel}>{key.toUpperCase()}</Text>
                      <Text style={styles.statValue}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.btnAction, { backgroundColor: '#3b82f6', borderColor: '#1d4ed8' }]} 
                onPress={() => handleProfile(player)}
              >
                <Text style={styles.btnText}>PROFILE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#22c55e', borderColor: '#166534' }]}>
                <Text style={styles.btnText}>UPGRADE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnAction, { backgroundColor: '#ef4444', borderColor: '#991b1b' }]}>
                <Text style={styles.btnText}>BENCH</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    </Animatable.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1e293b" />
      <TopHUD />
      
      {loading ? (
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{color:'#94a3b8', marginTop:10}}>Scouting Players...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {teamData.length > 0 ? (
            teamData.map((player, index) => (
              <PlayerCard key={player.id} player={player} index={index} />
            ))
          ) : (
            <Text style={{color:'white', textAlign:'center', marginTop:50}}>No players found. Try recruiting!</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topHudContainer: { backgroundColor: '#1e293b', borderBottomWidth: 2, borderBottomColor: '#334155', paddingTop: 40, paddingBottom: 10, paddingHorizontal: 15 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  backBtn: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#475569' },
  backText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  currencyContainer: { flexDirection: 'row' },
  currencyBadge: { backgroundColor: '#000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#fbbf24' },
  currencyText: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  managerCard: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 35, height: 35, borderRadius: 4, marginRight: 8, borderWidth: 1, borderColor: '#fff' },
  managerLabel: { color: '#94a3b8', fontSize: 8, fontWeight: 'bold' },
  managerName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  headerSubtitle: { color: '#60a5fa', fontWeight: 'bold', fontSize: 10 },
  scrollContent: { padding: 15, paddingBottom: 20 },
  cardWrapper: { marginBottom: 15 },
  cardBorder: { borderRadius: 8, borderWidth: 2, borderColor: '#3b82f6', overflow: 'hidden', backgroundColor: '#172554' },
  cardBackground: { width: '100%' },
  cardGradient: { padding: 12 },
  cardContent: { flexDirection: 'row', marginBottom: 12 },
  avatarSection: { width: '35%', alignItems: 'center' },
  playerImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#fff', marginBottom: 5 },
  nameTag: { backgroundColor: '#0f172a', width: '100%', alignItems: 'center', padding: 4, borderRadius: 4 },
  playerName: { color: '#fff', fontWeight: '900', fontSize: 16, textAlign: 'center' },
  playerTeam: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold' },
  statsSection: { flex: 1, paddingLeft: 15 },
  roleHeader: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statItem: { width: '50%', marginBottom: 8 },
  statLabel: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold' },
  statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', gap: 5 },
  btnAction: { flex: 1, padding: 10, borderRadius: 6, alignItems: 'center', borderWidth: 1, elevation: 3 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 10, letterSpacing: 0.5 },
});