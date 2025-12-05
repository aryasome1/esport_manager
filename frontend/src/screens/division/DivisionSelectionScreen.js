/**
 * Division Selection Screen
 * Choose between MOBA and Tactical Shooter divisions
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

// Theme
import { theme } from '../../theme/theme';

// Services
import { DivisionService } from '../../services/DivisionService';

const { width, height } = Dimensions.get('window');

export default function DivisionSelectionScreen({ onDivisionSelect }) {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDivision, setSelectedDivision] = useState(null);

  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    try {
      const divisionsData = await DivisionService.getAvailableDivisions();
      setDivisions(divisionsData);
    } catch (error) {
      console.error('Failed to load divisions:', error);
      Alert.alert('Error', 'Failed to load divisions');
    } finally {
      setLoading(false);
    }
  };

  const handleDivisionSelect = (division) => {
    setSelectedDivision(division);
  };

  const confirmSelection = () => {
    if (selectedDivision) {
      onDivisionSelect(selectedDivision.type);
    }
  };

  const renderDivisionCard = (division) => {
    const isSelected = selectedDivision?.id === division.id;
    const isMoba = division.type === 'moba';
    
    const getDivisionColors = (type) => {
      return type === 'moba' 
        ? { primary: theme.colors.primary.main, secondary: theme.colors.secondary.main }
        : { primary: theme.colors.accent.purple, secondary: theme.colors.accent.orange };
    };

    const colors = getDivisionColors(division.type);
    
    return (
      <Animatable.View
        key={division.id}
        animation="fadeInUp"
        delay={division.id * 200}
        style={[
          styles.divisionCard,
          isSelected && styles.selectedCard,
        ]}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={() => handleDivisionSelect(division)}
        >
          {/* Card Header with Gradient */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.cardHeader}
          >
            <View style={styles.divisionIcon}>
              <Text style={styles.iconText}>
                {isMoba ? '⚔️' : '🎯'}
              </Text>
            </View>
            
            <View style={styles.divisionInfo}>
              <Text style={styles.divisionName}>
                {division.name}
              </Text>
              <Text style={styles.divisionDescription}>
                {division.description}
              </Text>
            </View>

            {isSelected && (
              <Animatable.View 
                animation="bounceIn"
                style={styles.selectedIndicator}
              >
                <Text style={styles.selectedIcon}>✓</Text>
              </Animatable.View>
            )}
          </LinearGradient>

          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* Features */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>Key Features</Text>
              {division.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>
                    {feature.enabled ? '✓' : '○'}
                  </Text>
                  <Text style={[
                    styles.featureText,
                    feature.enabled ? styles.featureEnabled : styles.featureDisabled
                  ]}>
                    {feature.name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Stats */}
            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {division.stats.players_online}
                </Text>
                <Text style={styles.statLabel}>Players Online</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {division.stats.active_matches}
                </Text>
                <Text style={styles.statLabel}>Active Matches</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {division.stats.avg_match_duration}
                </Text>
                <Text style={styles.statLabel}>Avg Duration</Text>
              </View>
            </View>

            {/* Game Mode Badges */}
            <View style={styles.gameModeBadges}>
              {division.game_modes.map((mode, index) => (
                <View
                  key={index}
                  style={[
                    styles.gameModeBadge,
                    { backgroundColor: colors.primary + '20' }
                  ]}
                >
                  <Text style={[
                    styles.gameModeText,
                    { color: colors.primary }
                  ]}>
                    {mode}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading divisions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Division</Text>
        <Text style={styles.subtitle}>
          Select your preferred eSports gaming style
        </Text>
      </View>

      {/* Division Cards */}
      <ScrollView 
        style={styles.cardsContainer}
        contentContainerStyle={styles.cardsContent}
        showsVerticalScrollIndicator={false}
      >
        {divisions.map(renderDivisionCard)}
      </ScrollView>

      {/* Selection Info */}
      {selectedDivision && (
        <Animatable.View
          animation="slideUp"
          style={styles.selectionInfo}
        >
          <Text style={styles.selectedDivisionName}>
            Selected: {selectedDivision.name}
          </Text>
          <Text style={styles.selectionDescription}>
            {selectedDivision.summary}
          </Text>
        </Animatable.View>
      )}

      {/* Confirm Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedDivision && styles.disabledButton
          ]}
          onPress={confirmSelection}
          disabled={!selectedDivision}
        >
          <Text style={styles.confirmButtonText}>
            Enter {selectedDivision?.name || 'Division'}
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,
  },
  cardsContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  divisionCard: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius['2xl'],
    backgroundColor: theme.colors.background.secondary,
    shadowColor: theme.colors.neutral.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: theme.colors.accent.gold,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  cardTouchable: {
    borderRadius: theme.borderRadius['2xl'],
    overflow: 'hidden',
  },
  cardHeader: {
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  divisionIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  iconText: {
    fontSize: 28,
  },
  divisionInfo: {
    flex: 1,
  },
  divisionName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.contrast,
    marginBottom: theme.spacing.xs,
  },
  divisionDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary.contrast + 'CC',
    lineHeight: 20,
  },
  selectedIndicator: {
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 18,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.contrast,
  },
  cardContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  featuresSection: {
    gap: theme.spacing.sm,
  },
  featuresTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: theme.typography.fontSize.sm,
    marginRight: theme.spacing.sm,
    width: 20,
  },
  featureText: {
    fontSize: theme.typography.fontSize.sm,
    flex: 1,
  },
  featureEnabled: {
    color: theme.colors.text.primary,
  },
  featureDisabled: {
    color: theme.colors.text.tertiary,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary + '50',
    borderRadius: theme.borderRadius.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  gameModeBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  gameModeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  gameModeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  selectionInfo: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  selectedDivisionName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  selectionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  buttonContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    shadowColor: theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: theme.colors.neutral.gray[400],
    shadowOpacity: 0.1,
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.contrast,
  },
});