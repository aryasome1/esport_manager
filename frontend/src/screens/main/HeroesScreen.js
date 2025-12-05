/**
 * Heroes Screen
 * MOBA heroes management and selection
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

export default function HeroesScreen({ navigation }) {
  // Mock heroes data
  const heroes = [
    { id: 1, name: 'Luna', role: 'Carry', tier: 'S', avatar: '🌙' },
    { id: 2, name: 'Miya', role: 'Carry', tier: 'A', avatar: '🏹' },
    { id: 3, name: 'Alucard', role: 'Carry', tier: 'A', avatar: '⚔️' },
    { id: 4, name: 'Angela', role: 'Support', tier: 'S', avatar: '👼' },
    { id: 5, name: 'Rafaela', role: 'Support', tier: 'A', avatar: '💊' },
    { id: 6, name: 'Kagura', role: 'Mage', tier: 'S', avatar: '🌸' },
    { id: 7, name: 'Gord', role: 'Mage', tier: 'B', avatar: '📚' },
    { id: 8, name: 'Lapu-Lapu', role: 'Fighter', tier: 'A', avatar: '🪓' },
  ];

  const getTierColor = (tier) => {
    switch (tier) {
      case 'S': return '#FFD700';
      case 'A': return '#C0C0C0';
      case 'B': return '#CD7F32';
      default: return theme.colors.text.secondary;
    }
  };

  const renderHero = ({ item }) => (
    <TouchableOpacity style={styles.heroCard}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroAvatar}>{item.avatar}</Text>
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{item.name}</Text>
          <Text style={styles.heroRole}>{item.role}</Text>
        </View>
        <View style={[
          styles.tierBadge,
          { backgroundColor: getTierColor(item.tier) }
        ]}>
          <Text style={styles.tierText}>{item.tier}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary.main, theme.colors.secondary.main]}
        style={styles.header}
      >
        <Text style={styles.title}>Heroes</Text>
        <Text style={styles.subtitle}>Choose your champions</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Heroes</Text>
          <FlatList
            data={heroes}
            renderItem={renderHero}
            keyExtractor={item => item.id.toString()}
            style={styles.heroesList}
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
  heroesList: {
    maxHeight: 500,
  },
  heroCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatar: {
    fontSize: 32,
    marginRight: 15,
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  heroRole: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  tierBadge: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
});