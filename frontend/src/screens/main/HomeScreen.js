/**
 * Home Screen
 * Main dashboard for both MOBA and Tactical divisions
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Theme
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation, route }) {
  const division = (route?.params && route.params.division)
    || (route?.name && route.name.toLowerCase().includes('tactical') ? 'tactical' : 'moba');

  const getDivisionInfo = () => {
    if (division === 'tactical') {
      return {
        name: 'Tactical Shooter Division',
        icon: '🎯',
        color: theme.colors.accent.purple,
        description: 'Valorant, CS:GO, and tactical strategy',
        features: ['Agent Drafting', 'Tactical Timeouts', 'Site Control', 'Round Economy']
      };
    }
    return {
      name: 'MOBA Division',
      icon: '⚔️',
      color: theme.colors.primary.main,
      description: 'Mobile Legends, League of Legends style gameplay',
      features: ['Hero Drafting', 'Lane Strategy', 'Team Coordination', 'Objective Control']
    };
  };

  const divisionInfo = getDivisionInfo();

  const handleDraft = () => {
    // Navigate to nested Draft screen inside the MOBA stack
    navigation.navigate('MOBA', { screen: 'Draft', params: { sessionToken: 'demo', matchId: 1 } });
  };

  const handleTeam = () => {
    navigation.navigate('Team');
  };

  const handleMatches = () => {
    navigation.navigate('Matches');
  };

  const handleHeroes = () => {
    navigation.navigate('Heroes');
  };

  const handleAgentSelect = () => {
    navigation.navigate('AgentSelect');
  };

  const handleMapPool = () => {
    navigation.navigate('MapPool');
  };

  const handleValorantDraft = () => {
    navigation.navigate('ValorantDraft');
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[divisionInfo.color, theme.colors.primary.dark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.divisionIcon}>{divisionInfo.icon}</Text>
          <Text style={styles.title}>{divisionInfo.name}</Text>
          <Text style={styles.description}>{divisionInfo.description}</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {division === 'tactical' ? (
              <>
                <TouchableOpacity style={styles.actionCard} onPress={handleAgentSelect}>
                  <Text style={styles.actionIcon}>👤</Text>
                  <Text style={styles.actionTitle}>Select Agents</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={handleMapPool}>
                  <Text style={styles.actionIcon}>🗺️</Text>
                  <Text style={styles.actionTitle}>Map Pool</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={handleValorantDraft}>
                  <Text style={styles.actionIcon}>🎯</Text>
                  <Text style={styles.actionTitle}>Agent Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={handleMatches}>
                  <Text style={styles.actionIcon}>🏆</Text>
                  <Text style={styles.actionTitle}>Matches</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.actionCard} onPress={handleHeroes}>
                  <Text style={styles.actionIcon}>⚔️</Text>
                  <Text style={styles.actionTitle}>Heroes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={handleDraft}>
                  <Text style={styles.actionIcon}>🎲</Text>
                  <Text style={styles.actionTitle}>Draft</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={handleTeam}>
                  <Text style={styles.actionIcon}>👥</Text>
                  <Text style={styles.actionTitle}>Team</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={handleMatches}>
                  <Text style={styles.actionIcon}>🏆</Text>
                  <Text style={styles.actionTitle}>Matches</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Division Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Division Features</Text>
          <View style={styles.featuresContainer}>
            {divisionInfo.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>✅</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>No recent activity</Text>
            <Text style={styles.activitySubtext}>
              Start playing matches to see your progress here
            </Text>
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
  },
  headerContent: {
    alignItems: 'center',
  },
  divisionIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 15,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: theme.colors.background.secondary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 25,
  },
  featureText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  activityCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  activityText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 5,
  },
  activitySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});