/**
 * Agent Select Screen
 * Valorant agent selection and management
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

export default function AgentSelectScreen({ navigation }) {
  // Mock agents data
  const agents = [
    { id: 1, name: 'Jett', role: 'Duelist', tier: 'S', avatar: '💨' },
    { id: 2, name: 'Sage', role: 'Sentinel', tier: 'S', avatar: '🕊️' },
    { id: 3, name: 'Sova', role: 'Initiator', tier: 'A', avatar: '🏹' },
    { id: 4, name: 'Viper', role: 'Controller', tier: 'A', avatar: '🐍' },
    { id: 5, name: 'Phoenix', role: 'Duelist', tier: 'B', avatar: '🔥' },
    { id: 6, name: 'Omen', role: 'Controller', tier: 'A', avatar: '👤' },
  ];

  const getRoleColor = (role) => {
    switch (role) {
      case 'Duelist': return '#FF4444';
      case 'Sentinel': return '#44FF44';
      case 'Initiator': return '#4444FF';
      case 'Controller': return '#FFAA00';
      default: return theme.colors.text.secondary;
    }
  };

  const renderAgent = ({ item }) => (
    <TouchableOpacity style={styles.agentCard}>
      <View style={styles.agentHeader}>
        <Text style={styles.agentAvatar}>{item.avatar}</Text>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{item.name}</Text>
          <Text style={styles.agentRole}>{item.role}</Text>
        </View>
        <View style={[
          styles.roleBadge,
          { backgroundColor: getRoleColor(item.role) }
        ]}>
          <Text style={styles.roleText}>{item.role.charAt(0)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.accent.purple, theme.colors.primary.main]}
        style={styles.header}
      >
        <Text style={styles.title}>Agents</Text>
        <Text style={styles.subtitle}>Choose your agents</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Agents</Text>
          <FlatList
            data={agents}
            renderItem={renderAgent}
            keyExtractor={item => item.id.toString()}
            style={styles.agentsList}
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
  agentsList: {
    maxHeight: 500,
  },
  agentCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentAvatar: {
    fontSize: 32,
    marginRight: 15,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  agentRole: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  roleBadge: {
    borderRadius: 16,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
});