/**
 * Matches Screen
 * Match history and upcoming matches
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

export default function MatchesScreen({ navigation, route }) {
  const { division } = route.params || { division: 'moba' };

  // Mock matches data
  const matches = [
    {
      id: 1,
      opponent: 'Team Phoenix',
      result: 'Win',
      score: '2-1',
      date: '2024-01-15',
      duration: '25:30'
    },
    {
      id: 2,
      opponent: 'Team Dragons',
      result: 'Loss',
      score: '1-2',
      date: '2024-01-12',
      duration: '32:15'
    },
    {
      id: 3,
      opponent: 'Team Wolves',
      result: 'Win',
      score: '2-0',
      date: '2024-01-10',
      duration: '28:45'
    }
  ];

  const getResultColor = (result) => {
    return result === 'Win' ? theme.colors.status.success : theme.colors.status.error;
  };

  const renderMatch = ({ item }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <Text style={styles.opponentName}>vs {item.opponent}</Text>
        <View style={[
          styles.resultBadge,
          { backgroundColor: getResultColor(item.result) }
        ]}>
          <Text style={styles.resultText}>{item.result}</Text>
        </View>
      </View>
      <Text style={styles.matchScore}>Final Score: {item.score}</Text>
      <Text style={styles.matchDetails}>
        {item.date} • {item.duration}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.accent.purple, theme.colors.primary.main]}
        style={styles.header}
      >
        <Text style={styles.title}>Matches</Text>
        <Text style={styles.subtitle}>
          {division === 'tactical' ? 'Tactical Match History' : 'MOBA Match History'}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Matches</Text>
          <FlatList
            data={matches}
            renderItem={renderMatch}
            keyExtractor={item => item.id.toString()}
            style={styles.matchesList}
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
  matchesList: {
    maxHeight: 400,
  },
  matchCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  opponentName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  resultBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  resultText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
  },
  matchScore: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  matchDetails: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
});