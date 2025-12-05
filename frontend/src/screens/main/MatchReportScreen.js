/**
 * Match Report Screen
 * Detailed match analysis and reports
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Theme
import { theme } from '../../theme/theme';

export default function MatchReportScreen({ navigation, route }) {
  const { matchData } = route.params || {};

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary.main, theme.colors.accent.purple]}
        style={styles.header}
      >
        <Text style={styles.title}>Match Report</Text>
        <Text style={styles.subtitle}>Detailed Analysis</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              Match report details will be displayed here.
            </Text>
            {matchData && (
              <Text style={styles.matchInfo}>
                Match ID: {matchData.matchId || 'N/A'}
              </Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
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
  summaryCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  summaryText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  matchInfo: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontFamily: 'monospace',
  },
});