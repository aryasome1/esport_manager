import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ImageBackground, TouchableOpacity,
  ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Filter map aneh (The Range, Basic Training)
const IGNORED_MAPS = ['The Range', 'Basic Training', 'Training Grounds'];

export default function MapPoolScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [maps, setMaps] = useState([]);

  useEffect(() => {
    fetchMaps();
  }, []);

  const fetchMaps = async () => {
    try {
      const response = await fetch('https://valorant-api.com/v1/maps');
      const json = await response.json();
      if (json.status === 200) {
        // Filter map yang playable saja
        const validMaps = json.data.filter(m => !IGNORED_MAPS.includes(m.displayName));
        setMaps(validMaps);
      }
    } catch (error) {
      console.error("Failed to load maps:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderMapCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => navigation.navigate('MapTactic', { map: item })}
    >
      <ImageBackground
        source={{ uri: item.splash }} // Gambar Artistik
        style={styles.cardBg}
        imageStyle={{ borderRadius: 8 }}
      >
        <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.95)']}
            style={styles.gradient}
        >
            <Text style={styles.mapName}>{item.displayName.toUpperCase()}</Text>
            <Text style={styles.coords}>{item.coordinates || 'Unknown Sector'}</Text>
            
            <View style={styles.actionRow}>
                <Text style={styles.actionText}>OPEN STRAT BOARD</Text>
                <Ionicons name="arrow-forward" size={14} color="#ff4655" />
            </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#ff4655" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={maps}
          renderItem={renderMapCard}
          keyExtractor={item => item.uuid}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  listContent: { padding: 16 },
  card: {
    height: 180,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardBg: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  gradient: {
    padding: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  mapName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  coords: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 10,
    fontFamily: 'System', // Monospace kalau ada lebih bagus
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#ff4655',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 6,
  },
});