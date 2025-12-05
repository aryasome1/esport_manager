/**
 * Map Pool Screen
 * Valorant map pool management
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Theme
import { theme } from '../../theme/theme';

export default function MapPoolScreen({ navigation }) {
  // Mock maps data
  const maps = [
    { id: 1, name: 'Bind', difficulty: 'Easy', icon: '🏰', status: 'available' },
    { id: 2, name: 'Haven', difficulty: 'Medium', icon: '🏛️', status: 'available' },
    { id: 3, name: 'Split', difficulty: 'Hard', icon: '⚡', status: 'available' },
    { id: 4, name: 'Ascent', difficulty: 'Medium', icon: '🏛️', status: 'available' },
    { id: 5, name: 'Icebox', difficulty: 'Hard', icon: '🧊', status: 'banned' },
    { id: 6, name: 'Breeze', difficulty: 'Hard', icon: '🌪️', status: 'available' },
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return theme.colors.status.success;
      case 'Medium': return theme.colors.status.warning;
      case 'Hard': return theme.colors.status.error;
      default: return theme.colors.text.secondary;
    }
  };

  const renderMap = ({ item }) => (
    <TouchableOpacity style={[
      styles.mapCard,
      item.status === 'banned' && styles.bannedMap
    ]}>
      <View style={styles.mapHeader}>
        <Text style={styles.mapIcon}>{item.icon}</Text>
        <View style={styles.mapInfo}>
          <Text style={styles.mapName}>{item.name}</Text>
          <View style={styles.mapMeta}>
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(item.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>{item.difficulty}</Text>
            </View>
            <Text style={styles.statusText}>
              {item.status === 'banned' ? '🔒 Banned' : '✅ Available'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.accent.purple, theme.colors.primary.dark]}
        style={styles.header}
      >
        <Text style={styles.title}>Map Pool</Text>
        <Text style={styles.subtitle}>Select your maps</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Map Pool (6 maps)</Text>
          <FlatList
            data={maps}
            renderItem={renderMap}
            keyExtractor={item => item.id.toString()}
            style={styles.mapsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 15,
  },
  mapsList: {
    maxHeight: 450,
  },
  mapCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  bannedMap: {
    opacity: 0.6,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  mapInfo: {
    flex: 1,
  },
  mapName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 5,
  },
  mapMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 10,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
});