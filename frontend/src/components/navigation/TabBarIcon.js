/**
 * Tab Bar Icon Component
 * Custom tab bar icons for navigation
 */
import React from 'react';
import { View, Text } from 'react-native';

// Theme
import { theme } from '../../theme/theme';

export default function TabBarIcon({ routeName, focused, color, size }) {
  const getIcon = (routeName) => {
    const icons = {
      // MOBA Tabs
      'Home': '🏠',
      'Team': '👥',
      'Heroes': '⚔️',
      'Matches': '🏆',
      'Profile': '👤',
      
      // Tactical Tabs  
      'TacticalHome': '🎯',
      'AgentSelect': '👤',
      'MapPool': '🗺️',
      'TacticalMatches': '🏆',
      'TimeoutDemo': '⏱️',
      
      // Other
      'Draft': '🎲',
    };
    
    return icons[routeName] || '📱';
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.8, color }}>
        {getIcon(routeName)}
      </Text>
    </View>
  );
}