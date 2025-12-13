import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  TextInput, ActivityIndicator, Dimensions, ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const CARD_WIDTH = (width - 48) / COLUMN_COUNT;

const ROLES = ['All', 'Duelist', 'Initiator', 'Controller', 'Sentinel'];

export default function AgentListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    filterData();
  }, [search, selectedRole, agents]);

  const fetchAgents = async () => {
    try {
      // Fetch langsung dari Official Valorant API (Public)
      const response = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
      const json = await response.json();
      if (json.status === 200) {
        setAgents(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = agents;

    // Filter by Role
    if (selectedRole !== 'All') {
        result = result.filter(a => 
            a.role && a.role.displayName === selectedRole
        );
    }

    // Filter by Search
    if (search) {
      result = result.filter(a => 
        a.displayName.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredAgents(result);
  };

  const renderAgentCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('AgentDetail', { agent: item })}
    >
      <View style={styles.imageContainer}>
          {/* Background Gradient/Pattern per role bisa disini */}
          <Image source={{ uri: item.displayIcon }} style={styles.agentImage} />
      </View>
      
      <LinearGradient
        colors={['transparent', 'rgba(15, 23, 42, 1)']}
        style={styles.textOverlay}
      >
        <Text style={styles.agentName} numberOfLines={1}>{item.displayName.toUpperCase()}</Text>
      </LinearGradient>
      
      {/* Role Icon Badge */}
      <View style={styles.roleBadge}>
         <Image source={{ uri: item.role?.displayIcon }} style={{ width: 12, height: 12, tintColor: '#fff' }} />
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
          placeholder="Find an agent..."
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

      {/* Agent Grid */}
      {loading ? (
        <ActivityIndicator size="large" color="#ff4655" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredAgents}
          renderItem={renderAgentCard}
          keyExtractor={item => item.uuid}
          numColumns={COLUMN_COUNT}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    borderRadius: 4, // Kotak tajam FPS
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'System', // Atau font Valorant jika ada
  },
  filterContainer: {
    marginBottom: 10,
    paddingLeft: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4, // Kotak
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: '#ff4655', // Valorant Red
    borderColor: '#ff4655',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  activeFilterText: { color: '#fff' },
  
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  
  // Card Styles
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    marginBottom: 12,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#334155',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#252f45', // Lighter bg for contrast
  },
  agentImage: {
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
    alignItems: 'center',
  },
  agentName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  roleBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 4,
  },
});