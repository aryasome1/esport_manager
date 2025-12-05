/**
 * Team Screen
 * Team management and member overview
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

export default function TeamScreen({ navigation, route }) {
  const { division } = route.params || { division: 'moba' };

  // Mock team data
  const teamMembers = [
    { id: 1, name: 'Player 1', role: 'Carry', level: 85, avatar: '🎯' },
    { id: 2, name: 'Player 2', role: 'Support', level: 78, avatar: '🛡️' },
    { id: 3, name: 'Player 3', role: 'Mid', level: 82, avatar: '⚔️' },
    { id: 4, name: 'Player 4', role: 'Jungle', level: 79, avatar: '🌿' },
    { id: 5, name: 'Player 5', role: 'Roam', level: 88, avatar: '🚀' },
  ];

  const renderMember = ({ item }) => (
    <View style={styles.memberCard}>
      <Text style={styles.memberAvatar}>{item.avatar}</Text>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRole}>{item.role}</Text>
      </View>
      <View style={styles.memberLevel}>
        <Text style={styles.levelText}>Lv.{item.level}</Text>
      </View>
    </View>
  );

  const handleInvitePlayer = () => {
    // TODO: Implement invite functionality
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary.main, theme.colors.accent.purple]}
        style={styles.header}
      >
        <Text style={styles.title}>My Team</Text>
        <Text style={styles.subtitle}>
          {division === 'tactical' ? 'Tactical Squad' : 'MOBA Team'}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team Members (5/5)</Text>
          <FlatList
            data={teamMembers}
            renderItem={renderMember}
            keyExtractor={item => item.id.toString()}
            style={styles.membersList}
            showsVerticalScrollIndicator={false}
          />
        </View>

        <TouchableOpacity
          style={styles.inviteButton}
          onPress={handleInvitePlayer}
        >
          <Text style={styles.inviteButtonText}>Invite Player</Text>
        </TouchableOpacity>
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
  membersList: {
    maxHeight: 400,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  memberAvatar: {
    fontSize: 32,
    marginRight: 15,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  memberLevel: {
    backgroundColor: theme.colors.accent.gold,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
  },
  inviteButton: {
    backgroundColor: theme.colors.accent.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
  },
});