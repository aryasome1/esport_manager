/**
 * Division Selection Screen
 * UI Updated to match Reference Image (MOBA vs FPS Cards)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Services & Context
import { DivisionService } from '../../services/DivisionService';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function DivisionSelectionScreen({ route, navigation, onDivisionSelect }) {
  const { nextTarget } = route?.params || {};
  const { user } = useAuth();
  
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    try {
      const data = await DivisionService.getAvailableDivisions();
      setDivisions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (divisionType) => {
    // Panggil callback ke App.js untuk set state global
    onDivisionSelect(divisionType);
  };

  // --- COMPONENTS ---

  const TopHUD = () => (
    <View style={styles.topHud}>
      {/* Manager Info */}
      <View style={styles.managerCard}>
        <Image 
          source={{ uri: 'https://ui-avatars.com/api/?name=Manager&background=0D8ABC&color=fff' }} 
          style={styles.avatar} 
        />
        <View>
          <Text style={styles.managerLabel}>MANAGER</Text>
          <Text style={styles.managerName}>{user?.username || 'Guest'}</Text>
          <View style={styles.expBarBg}>
            <View style={[styles.expBarFill, { width: '40%' }]} />
          </View>
        </View>
      </View>

      {/* Title Center */}
      <View style={styles.centerTitleContainer}>
        <Text style={styles.mainTitle}>ESPORTS MANAGER:</Text>
        <Text style={styles.subTitle}>PHANTOM GAMING</Text>
      </View>

      {/* Currency */}
      <View style={styles.currencyContainer}>
        <View style={styles.currencyItem}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.currencyText}>150,000</Text>
        </View>
        <View style={[styles.currencyItem, { marginLeft: 5 }]}>
          <Text style={styles.gemIcon}>💎</Text>
          <Text style={styles.currencyText}>500</Text>
        </View>
      </View>
    </View>
  );

  const DivisionCard = ({ item, index }) => {
    // Tentukan aset berdasarkan tipe (Manual override biar pas sama desain)
    const isMoba = item.type === 'moba';
    const title = isMoba ? "MOBA DIVISION" : "FPS DIVISION";
    // Gunakan image dari service atau fallback lokal
    const bgImage = { uri: item.image }; 

    return (
      <Animatable.View 
        animation="fadeInUp" 
        delay={index * 300}
        style={styles.cardContainer}
      >
        <View style={styles.cardBorder}>
          <ImageBackground
            source={bgImage}
            style={styles.cardBackground}
            imageStyle={{ borderRadius: 12 }}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
              style={styles.cardOverlay}
            >
              {/* Content Inside Card */}
              <View style={styles.cardContent}>
                {/* Character/Icon Placeholder (Visual Only) */}
                <View style={{ flex: 1 }} /> 
                
                {/* Title */}
                <Text style={styles.cardTitle}>{title}</Text>
              </View>
            </LinearGradient>
          </ImageBackground>

          {/* GREEN SELECT BUTTON (Outside Image like reference) */}
          <TouchableOpacity 
            style={styles.selectButton}
            onPress={() => handleSelect(item.type)}
            activeOpacity={0.8}
          >
            <Text style={styles.selectButtonText}>SELECT</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden={false} />
      
      {/* Background Utama Gelap */}
      <LinearGradient
        colors={['#1e1b4b', '#0f172a', '#020617']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <TopHUD />

        {/* ScrollView untuk Daftar Divisi */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text style={{color: 'white', textAlign: 'center', marginTop: 50}}>Loading Divisions...</Text>
          ) : (
            divisions.map((div, index) => (
              <DivisionCard key={div.id} item={div} index={index} />
            ))
          )}
          
          {/* Tombol Back/Cancel */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>BACK TO DORM</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Nav Placeholder (Visual Only, Optional) */}
        <View style={styles.bottomNavPlaceholder}>
          {['🏠','👥','⚔️','👜','⚙️'].map((icon, i) => (
            <Text key={i} style={{fontSize: 24, opacity: 0.5}}>{icon}</Text>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  
  // --- TOP HUD ---
  topHud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderBottomWidth: 2,
    borderBottomColor: '#334155',
    elevation: 5,
  },
  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  avatar: { width: 35, height: 35, borderRadius: 4, marginRight: 8, borderWidth: 1, borderColor: '#fff' },
  managerLabel: { color: '#94a3b8', fontSize: 8, fontWeight: 'bold' },
  managerName: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  expBarBg: { width: 60, height: 4, backgroundColor: '#333', marginTop: 2 },
  expBarFill: { height: '100%', backgroundColor: '#3b82f6' },

  centerTitleContainer: { alignItems: 'center', flex: 1 },
  mainTitle: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  subTitle: { color: '#60a5fa', fontSize: 10, fontWeight: 'bold' },

  currencyContainer: { flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  currencyItem: { 
    flexDirection: 'row', 
    backgroundColor: '#0f172a', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fbbf24',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'space-between'
  },
  currencyText: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold' },
  coinIcon: { fontSize: 10 },
  gemIcon: { fontSize: 10 },

  // --- CONTENT ---
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  
  // --- CARD STYLE ---
  cardContainer: {
    marginBottom: 25,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  cardBorder: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    padding: 4,
  },
  cardBackground: {
    height: 180, // Tinggi gambar kartu
    width: '100%',
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 15,
    borderRadius: 8,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    letterSpacing: 1,
    marginBottom: 5,
  },
  
  // --- SELECT BUTTON (GREEN) ---
  selectButton: {
    backgroundColor: '#22c55e', // Green like reference
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: 4, // Sedikit jarak dari gambar
    borderWidth: 1,
    borderColor: '#15803d',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  selectButtonText: {
    color: '#022c22', // Dark green text
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // --- FOOTER ---
  backButton: {
    alignSelf: 'center',
    padding: 15,
    marginTop: 10,
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  bottomNavPlaceholder: {
    height: 60,
    backgroundColor: '#0f172a',
    borderTopWidth: 2,
    borderTopColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  }
});