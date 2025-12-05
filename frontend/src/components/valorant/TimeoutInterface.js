/**
 * Enhanced Timeout Interface with Tactic Selection
 * After timeout is called, players can choose between:
 * A. Do the same thing
 * B. Choose tactics (with modal)
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Theme
import { theme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');

// Available tactics data
const availableTactics = {
  aggressive: {
    id: 'aggressive',
    name: 'Aggressive Push',
    description: 'Quickly advance and overwhelm enemies',
    difficulty: 'Easy',
    successRate: 65,
    requires: ['3+ players'],
    icon: '⚡'
  },
  defensive: {
    id: 'defensive',
    name: 'Defensive Hold',
    description: 'Maintain position and counter attacks',
    difficulty: 'Medium',
    successRate: 58,
    requires: ['2+ players'],
    icon: '🛡️'
  },
  split: {
    id: 'split',
    name: 'Split Attack',
    description: 'Divide team and attack from multiple angles',
    difficulty: 'Hard',
    successRate: 72,
    requires: ['Full team coordination'],
    icon: '⚔️'
  },
  eco_round: {
    id: 'eco_round',
    name: 'Eco Round',
    description: 'Save money for next round buy',
    difficulty: 'Easy',
    successRate: 45,
    requires: ['Pistols and utility only'],
    icon: '💰'
  },
  retake: {
    id: 'retake',
    name: 'Site Retake',
    description: 'Coordinate retake of contested site',
    difficulty: 'Hard',
    successRate: 55,
    requires: ['Full utility coordination'],
    icon: '🔄'
  },
  lurk: {
    id: 'lurk',
    name: 'Lurk Strategy',
    description: 'Flank enemy from unexpected angle',
    difficulty: 'Medium',
    successRate: 62,
    requires: ['1-2 players'],
    icon: '👤'
  }
};

export default function TimeoutInterface({
  onTimeoutSelect,
  onContinue,
  timeoutsUsed,
  maxTimeouts,
  isVisible = true
}) {
  const [showTacticsModal, setShowTacticsModal] = useState(false);
  const [selectedTactic, setSelectedTactic] = useState(null);
  const [timeoutReason, setTimeoutReason] = useState('');
  const tacticConfirmAnim = useRef(new Animated.Value(0)).current;

  // Handle option selection
  const handleOptionSelect = (option, reason = '') => {
    if (option === 'A') {
      // "Do the same thing" - continue with current strategy
      onTimeoutSelect('continue_same_strategy');
      onContinue();
    } else if (option === 'B') {
      // "Choose tactics" - open tactics modal
      setShowTacticsModal(true);
      setTimeoutReason(reason);
    }
  };

  // Handle tactic selection
  const handleTacticSelect = (tactic) => {
    setSelectedTactic(tactic);
    
    // Show tactic confirmation for 2 seconds before continuing
    Animated.timing(tacticConfirmAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setTimeout(() => {
      setShowTacticsModal(false);
      setSelectedTactic(null);
      onTimeoutSelect('tactical_change', tactic);
      onContinue();
    }, 2000);
  };

  // Render tactic modal
  const renderTacticsModal = () => (
    <Modal
      transparent={true}
      visible={showTacticsModal}
      animationType="fade"
      onRequestClose={() => setShowTacticsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Tactics</Text>
            <Text style={styles.modalSubtitle}>
              {timeoutReason ? `Timeout for: ${timeoutReason}` : 'Select your tactical approach'}
            </Text>
          </View>

          {/* Tactics List */}
          <ScrollView 
            style={styles.tacticsList}
            showsVerticalScrollIndicator={false}
          >
            {Object.values(availableTactics).map((tactic) => (
              <TouchableOpacity
                key={tactic.id}
                style={styles.tacticItem}
                onPress={() => handleTacticSelect(tactic)}
                activeOpacity={0.7}
              >
                <View style={styles.tacticHeader}>
                  <Text style={styles.tacticIcon}>{tactic.icon}</Text>
                  <View style={styles.tacticInfo}>
                    <Text style={styles.tacticName}>{tactic.name}</Text>
                    <Text style={styles.tacticDescription}>{tactic.description}</Text>
                  </View>
                  <View style={styles.tacticMeta}>
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(tactic.difficulty) }
                    ]}>
                      <Text style={styles.difficultyText}>{tactic.difficulty}</Text>
                    </View>
                    <Text style={styles.successRate}>{tactic.successRate}%</Text>
                  </View>
                </View>
                
                <View style={styles.tacticRequirements}>
                  <Text style={styles.requiresText}>Requires: {tactic.requires}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowTacticsModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Render tactic confirmation
  const renderTacticConfirmation = () => (
    <Modal
      transparent={true}
      visible={!!selectedTactic}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <Animatable.View 
          ref="tacticConfirm"
          style={styles.confirmationContainer}
          animation="zoomIn"
          duration={300}
        >
          <Text style={styles.confirmationIcon}>{selectedTactic?.icon}</Text>
          <Text style={styles.confirmationTitle}>Tactic Selected!</Text>
          <Text style={styles.confirmationText}>{selectedTactic?.name}</Text>
          <Text style={styles.confirmationSubtext}>Implementing strategy...</Text>
        </Animatable.View>
      </View>
    </Modal>
  );

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return theme.colors.accent.green;
      case 'Medium': return theme.colors.accent.gold;
      case 'Hard': return theme.colors.accent.red;
      default: return theme.colors.accent.gold;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <View style={styles.container}>
        <Animatable.View 
          animation="slideInUp"
          duration={500}
          style={styles.timeoutContainer}
        >
          <LinearGradient
            colors={[theme.colors.accent.gold, theme.colors.primary.dark]}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Timeout Called</Text>
              <Text style={styles.subtitle}>
                Timeouts used: {timeoutsUsed}/{maxTimeouts}
              </Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>What would you like to do?</Text>
              
              {/* Option A: Do the same thing */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleOptionSelect('A')}
                activeOpacity={0.8}
              >
                <Text style={styles.optionLabel}>A</Text>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Do the same thing</Text>
                  <Text style={styles.optionDescription}>
                    Continue with current strategy and execution
                  </Text>
                </View>
                <Text style={styles.optionArrow}>→</Text>
              </TouchableOpacity>

              {/* Option B: Choose tactics */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleOptionSelect('B', 'Tactical Adjustment')}
                activeOpacity={0.8}
              >
                <Text style={styles.optionLabel}>B</Text>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Choose tactics</Text>
                  <Text style={styles.optionDescription}>
                    Select a new tactical approach from available strategies
                  </Text>
                </View>
                <Text style={styles.optionArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Reason Buttons */}
            <View style={styles.quickReasons}>
              <Text style={styles.quickReasonsTitle}>Quick reasons:</Text>
              <View style={styles.reasonsContainer}>
                <TouchableOpacity
                  style={styles.reasonButton}
                  onPress={() => handleOptionSelect('A', 'Economy Discussion')}
                >
                  <Text style={styles.reasonText}>Economy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reasonButton}
                  onPress={() => handleOptionSelect('B', 'Tactical Adjustment')}
                >
                  <Text style={styles.reasonText}>Tactical</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reasonButton}
                  onPress={() => handleOptionSelect('B', 'Pistol Round Prep')}
                >
                  <Text style={styles.reasonText}>Pistol Prep</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>
      </View>

      {/* Modals */}
      {renderTacticsModal()}
      {renderTacticConfirmation()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    zIndex: 1000,
  },
  timeoutContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderTopWidth: 3,
    borderTopColor: theme.colors.accent.gold,
  },
  gradient: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  optionsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: theme.colors.accent.gold,
    elevation: 5,
  },
  optionLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.accent.gold,
    width: 30,
    textAlign: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  optionArrow: {
    fontSize: 20,
    color: theme.colors.accent.gold,
    fontWeight: 'bold',
  },
  quickReasons: {
    marginTop: 20,
  },
  quickReasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  reasonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reasonButton: {
    backgroundColor: theme.colors.accent.gold,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.background.primary,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: theme.colors.accent.gold,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  tacticsList: {
    flex: 1,
    padding: 10,
  },
  tacticItem: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  tacticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tacticIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  tacticInfo: {
    flex: 1,
  },
  tacticName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  tacticDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  tacticMeta: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.background.primary,
  },
  successRate: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.accent.green,
  },
  tacticRequirements: {
    marginTop: 8,
  },
  requiresText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  cancelButton: {
    margin: 20,
    backgroundColor: theme.colors.status.error,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  // Confirmation styles
  confirmationContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.accent.gold,
  },
  confirmationIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  confirmationText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.accent.gold,
    marginBottom: 10,
  },
  confirmationSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
});