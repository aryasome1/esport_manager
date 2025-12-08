/**
 * MainHubScreen.js
 * Layar Utama (Dorm) setelah Login.
 * Titik temu sebelum memilih divisi.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

export default function MainHubScreen({ navigation }) {
  const { user } = useAuth();

  // Fungsi navigasi yang meminta pemilihan divisi dulu
  const navigateToFeature = (feature) => {
    // Kita lempar parameter 'targetFeature' ke layar seleksi
    // Nanti setelah pilih divisi, dia akan otomatis loncat ke fitur tsb
    navigation.navigate('DivisionSelect', { nextTarget: feature });
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Background Image (Dorm Room) */}
      {/* Ganti uri dengan gambar lokal lo kalau ada, ini placeholder */}
      <ImageBackground
        source={{ uri: 'https://i.imgur.com/8Q5g5yM.jpg' }} // Contoh background dorm isometrik
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          
          {/* --- TOP HUD (Manager Info & Currency) --- */}
          <SafeAreaView style={styles.topHud}>
            {/* Manager Profile */}
            <View style={styles.profileCard}>
              <Image 
                source={{ uri: 'https://ui-avatars.com/api/?name=Manager&background=0D8ABC&color=fff' }} 
                style={styles.avatar} 
              />
              <View>
                <Text style={styles.managerLabel}>MANAGER</Text>
                <Text style={styles.managerName}>{user?.username || 'Guest'}</Text>
                <View style={styles.expBarBg}>
                  <View style={[styles.expBarFill, { width: '60%' }]} />
                </View>
              </View>
            </View>

            {/* Currency */}
            <View style={styles.currencyContainer}>
              <View style={styles.currencyBadge}>
                <Text style={styles.coinIcon}>🪙</Text>
                <Text style={styles.currencyText}>150,000</Text>
              </View>
              <View style={styles.currencyBadge}>
                <Text style={styles.gemIcon}>💎</Text>
                <Text style={styles.currencyText}>500</Text>
              </View>
            </View>
          </SafeAreaView>

          {/* --- CENTER AREA (Interaksi Ruangan - Opsional) --- */}
          <View style={styles.centerArea}>
            {/* Bisa tambah tombol interaksi ke PC atau karakter di sini nanti */}
          </View>

          {/* --- BOTTOM ACTION BAR --- */}
          <View style={styles.bottomBar}>
            
            {/* Notification / Next Match Banner */}
            <View style={styles.notificationBanner}>
              <Text style={styles.notifText}>
                NEXT MATCH: vs <Text style={{color: '#fbbf24', fontWeight:'bold'}}>TITAN ESPORTS</Text> in 2h
              </Text>
              <TouchableOpacity 
                style={styles.trainBtn}
                onPress={() => navigateToFeature('Training')}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.trainGradient}
                >
                  <Text style={styles.trainText}>TRAIN</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Main Navigation Tabs */}
            <View style={styles.navGrid}>
              <NavButton icon="🏠" label="DORM" active onPress={() => {}} />
              <NavButton icon="👥" label="TEAM" onPress={() => navigateToFeature('Team')} />
              <NavButton icon="⚔️" label="MATCH" onPress={() => navigateToFeature('Match')} isBig />
              <NavButton icon="👜" label="MARKET" onPress={() => alert('Market Closed')} />
              <NavButton icon="⚙️" label="SETTINGS" onPress={() => navigation.navigate('Profile')} />
            </View>
          </View>

        </View>
      </ImageBackground>
    </View>
  );
}

// Komponen Tombol Navigasi Bawah
const NavButton = ({ icon, label, onPress, active, isBig }) => (
  <TouchableOpacity 
    style={[styles.navBtn, isBig && styles.navBtnBig]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    {isBig ? (
      <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.bigIconBg}>
        <Text style={{ fontSize: 32 }}>{icon}</Text>
      </LinearGradient>
    ) : (
      <Text style={[styles.navIcon, active && {color: '#3b82f6'}]}>{icon}</Text>
    )}
    <Text style={[styles.navLabel, active && {color: '#3b82f6'}]}>{label}</Text>
    {active && <View style={styles.activeIndicator} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'space-between' },
  
  // TOP HUD
  topHud: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, marginTop: 10 },
  profileCard: { 
    flexDirection: 'row', 
    backgroundColor: '#1e293b', 
    padding: 5, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#334155',
    alignItems: 'center',
    paddingRight: 15
  },
  avatar: { width: 40, height: 40, borderRadius: 5, marginRight: 10, borderWidth: 1, borderColor: '#fff' },
  managerLabel: { color: '#94a3b8', fontSize: 8, fontWeight: 'bold' },
  managerName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  expBarBg: { width: 80, height: 4, backgroundColor: '#333', marginTop: 2, borderRadius: 2 },
  expBarFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2 },
  
  currencyContainer: { flexDirection: 'row', gap: 5 },
  currencyBadge: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 5, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569'
  },
  coinIcon: { fontSize: 12, marginRight: 4 },
  gemIcon: { fontSize: 12, marginRight: 4 },
  currencyText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 12 },

  centerArea: { flex: 1 },

  // BOTTOM BAR
  bottomBar: { backgroundColor: '#0f172a', borderTopWidth: 2, borderTopColor: '#1e293b' },
  
  // Notification Banner
  notificationBanner: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(30, 41, 59, 0.95)', 
    margin: 10, 
    borderRadius: 8, 
    padding: 10, 
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155'
  },
  notifText: { color: '#e2e8f0', fontSize: 12, fontWeight: '600', flex: 1 },
  trainBtn: { overflow: 'hidden', borderRadius: 5 },
  trainGradient: { paddingHorizontal: 20, paddingVertical: 8 },
  trainText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  // Navigation Grid
  navGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 15, paddingTop: 5 },
  navBtn: { alignItems: 'center', flex: 1 },
  navBtnBig: { marginBottom: 10 },
  navIcon: { fontSize: 24, marginBottom: 2, color: '#94a3b8' },
  bigIconBg: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 5, borderWidth: 3, borderColor: '#0f172a', marginTop: -20 },
  navLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  activeIndicator: { width: 20, height: 2, backgroundColor: '#3b82f6', marginTop: 4 },
});