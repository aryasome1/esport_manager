/**
 * Timeout Feature Demo Screen
 * Demonstrates the enhanced timeout functionality
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Import the enhanced timeout interface
import TimeoutInterface from '../../components/valorant/TimeoutInterface';

// Theme
import { theme } from '../../theme/theme';

export default function TimeoutDemoScreen({ navigation }) {
  const [showTimeoutInterface, setShowTimeoutInterface] = useState(false);
  const [timeoutsUsed, setTimeoutsUsed] = useState(0);
  const [maxTimeouts] = useState(2);
  const [selectedTactics, setSelectedTactics] = useState([]);

  // Handle timeout selection
  const handleTimeoutSelect = (type, tacticData = null) => {
    console.log('Timeout selected:', type, tacticData);
    
    if (type === 'tactical_change' && tacticData) {
      setSelectedTactics(prev => [...prev, tacticData]);
    }
    
    setShowTimeoutInterface(false);
  };

  // Handle continue after timeout
  const handleContinue = () => {
    Alert.alert(
      'Match Resumed',
      'Timeout complete! Match continues...',
      [{ text: 'OK' }]
    );
  };

  // Start timeout demo
  const startTimeoutDemo = () => {
    if (timeoutsUsed >= maxTimeouts) {
      Alert.alert('No Timeouts', 'All timeouts have been used');
      return;
    }
    setShowTimeoutInterface(true);
  };

  // Reset demo
  const resetDemo = () => {
    setTimeoutsUsed(0);
    setSelectedTactics([]);
    setShowTimeoutInterface(false);
  };

  // Get timeout reason from selection
  const getTimeoutReason = (tactic) => {
    const reasons = {
      aggressive: 'Aggressive Push',
      defensive: 'Defensive Hold', 
      split: 'Split Attack',
      eco_round: 'Eco Round',
      retake: 'Site Retake',
      lurk: 'Lurk Strategy'
    };
    return reasons[tactic.id] || 'Tactical Adjustment';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.accent.purple, theme.colors.primary.dark]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Enhanced Timeout Feature</Text>
        <Text style={styles.subtitle}>
          Demo of the new timeout interface with tactics selection
        </Text>
      </View>

      {/* Demo Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Demo Controls */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>Demo Controls</Text>
          
          <TouchableOpacity
            style={[
              styles.demoButton,
              styles.primaryButton,
              timeoutsUsed >= maxTimeouts && styles.disabledButton
            ]}
            onPress={startTimeoutDemo}
            disabled={timeoutsUsed >= maxTimeouts}
          >
            <Text style={styles.demoButtonText}>
              ⏱️ Start Timeout Demo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.demoButton, styles.secondaryButton]}
            onPress={resetDemo}
          >
            <Text style={styles.demoButtonText}>🔄 Reset Demo</Text>
          </TouchableOpacity>
        </View>

        {/* Timeout Status */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Timeout Status</Text>
          
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              Timeouts Used: {timeoutsUsed}/{maxTimeouts}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(timeoutsUsed / maxTimeouts) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Selected Tactics History */}
        {selectedTactics.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Tactics Used</Text>
            
            {selectedTactics.map((tactic, index) => (
              <Animatable.View
                key={index}
                animation="slideInLeft"
                delay={index * 200}
                style={styles.tacticHistoryItem}
              >
                <Text style={styles.historyIcon}>{tactic.icon}</Text>
                <View style={styles.historyContent}>
                  <Text style={styles.historyName}>{tactic.name}</Text>
                  <Text style={styles.historyDescription}>
                    {getTimeoutReason(tactic)}
                  </Text>
                </View>
              </Animatable.View>
            ))}
          </View>
        )}

        {/* Feature Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Features Included</Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✅</Text>
              <Text style={styles.featureText}>
                Enhanced timeout interface with clear A/B options
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✅</Text>
              <Text style={styles.featureText}>
                Tactic selection modal with 6 different strategies
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✅</Text>
              <Text style={styles.featureText}>
                Success rates and difficulty levels for each tactic
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✅</Text>
              <Text style={styles.featureText}>
                Visual feedback and confirmation animations
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✅</Text>
              <Text style={styles.featureText}>
                AI adaptation based on selected tactics
              </Text>
            </View>
          </View>
        </View>

        {/* Available Tactics Preview */}
        <View style={styles.tacticsSection}>
          <Text style={styles.sectionTitle}>Available Tactics</Text>
          
          <View style={styles.tacticsGrid}>
            {[
              { id: 'aggressive', name: 'Aggressive Push', icon: '⚡', color: '#EF4444' },
              { id: 'defensive', name: 'Defensive Hold', icon: '🛡️', color: '#3B82F6' },
              { id: 'split', name: 'Split Attack', icon: '⚔️', color: '#8B5CF6' },
              { id: 'eco_round', name: 'Eco Round', icon: '💰', color: '#10B981' },
              { id: 'retake', name: 'Site Retake', icon: '🔄', color: '#F59E0B' },
              { id: 'lurk', name: 'Lurk Strategy', icon: '👤', color: '#EC4899' }
            ].map((tactic) => (
              <View key={tactic.id} style={[
                styles.tacticCard,
                { borderColor: tactic.color }
              ]}>
                <Text style={styles.tacticIcon}>{tactic.icon}</Text>
                <Text style={styles.tacticName}>{tactic.name}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Enhanced Timeout Interface */}
      {showTimeoutInterface && (
        <TimeoutInterface
          timeoutsUsed={timeoutsUsed}
          maxTimeouts={maxTimeouts}
          onTimeoutSelect={handleTimeoutSelect}
          onContinue={handleContinue}
          isVisible={showTimeoutInterface}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  demoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginBottom: 15,
  },
  demoButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent.gold,
  },
  secondaryButton: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: theme.colors.text.inverse,
  },
  disabledButton: {
    backgroundColor: theme.colors.neutral.gray[400],
    opacity: 0.6,
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
  },
  statusSection: {
    marginBottom: 30,
  },
  statusCard: {
    backgroundColor: theme.colors.background.secondary,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.gold,
  },
  historySection: {
    marginBottom: 30,
  },
  tacticHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  historyIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  historyContent: {
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 5,
  },
  historyDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  descriptionSection: {
    marginBottom: 30,
  },
  featureList: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 30,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  tacticsSection: {
    marginBottom: 30,
  },
  tacticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tacticCard: {
    width: '48%',
    backgroundColor: theme.colors.background.secondary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    elevation: 3,
  },
  tacticIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  tacticName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});