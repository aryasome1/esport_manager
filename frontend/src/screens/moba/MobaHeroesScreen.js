import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  TextInput, ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { apiClient } from '../../services/ApiClient';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3; // 3 Kolom biar muat banyak
const CARD_WIDTH = (width - 48) / COLUMN_COUNT;

const ROLES = ['All', 'Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'];

export default function MobaHeroes({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [heroes, setHeroes] = useState([]);
  const [filteredHeroes, setFilteredHeroes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');

  useEffect(() => {
    fetchHeroes();
  }, []);

  useEffect(() => {
    filterData();
  }, [search, selectedRole, heroes]);

  const fetchHeroes = async () => {
    try {
      // Asumsi endpoint ini ada di backend (standard CRUD)
      const response = await apiClient.get('/api/heroes/');
      if (response.data && response.data.items) {
        setHeroes(response.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch heroes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = heroes;

    // Filter by Role
    if (selectedRole !== 'All') {
        // Backend mungkin nyimpen role lowercase atau uppercase, kita samain
        result = result.filter(h => 
            h.role_specific && h.role_specific.toLowerCase() === selectedRole.toLowerCase() 
            || (h.description && h.description.includes(selectedRole)) // Fallback cek deskripsi
        );
    }

    // Filter by Search
    if (search) {
      result = result.filter(h => 
        h.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredHeroes(result);
  };

  const renderHeroCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('HeroDetail', { hero: item })}
    >
      <Image source={{ uri: item.image_url }} style={styles.heroImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
        style={styles.textOverlay}
      >
        <Text style={styles.heroName} numberOfLines={1}>{item.name}</Text>
      </LinearGradient>
      
      {/* Power Badge (Optional) */}
      <View style={styles.powerBadge}>
        <Text style={styles.powerText}>{Math.round(item.base_power || 50)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Find a hero..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Role Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={ROLES}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedRole === item && styles.activeFilterChip
              ]}
              onPress={() => setSelectedRole(item)}
            >
              <Text style={[
                styles.filterText,
                selectedRole === item && styles.activeFilterText
              ]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Hero Grid */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary.main} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredHeroes}
          renderItem={renderHeroCard}
          keyExtractor={item => item.id.toString()}
          numColumns={COLUMN_COUNT}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No heroes found.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  searchContainer: {
    margin: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 14,
  },
  filterContainer: {
    marginBottom: 10,
    paddingLeft: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3, // Aspect ratio portrait
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    paddingTop: 20,
  },
  heroName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  powerBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  powerText: {
    color: '#fbbf24', // Gold color
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 50,
  },
});