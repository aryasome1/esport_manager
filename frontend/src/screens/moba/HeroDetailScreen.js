import React from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

export default function HeroDetailScreen({ route, navigation }) {
  const { hero } = route.params;

  const renderStatBar = (label, value, color) => (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.barContainer}>
        <View style={[
            styles.barFill, 
            { width: `${(value / 100) * 100}%`, backgroundColor: color }
        ]} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: hero.image_url }} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', '#0f172a']}
            style={styles.gradient}
          />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.heroName}>{hero.name}</Text>
            {/* Jika ada role di DB, tampilkan */}
            <Text style={styles.heroRole}>{hero.description || 'Unknown Role'}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Attributes</Text>
            {renderStatBar("Base Power", hero.base_power || 50, theme.colors.primary.main)}
            {renderStatBar("Difficulty", (hero.difficulty || 1) * 20, theme.colors.state.error)}
            {renderStatBar("Utility", Math.random() * 40 + 60, theme.colors.state.success)}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Analysis</Text>
            <Text style={styles.desc}>
              {hero.name} is a powerful hero suitable for drafting strategies focused on 
              {hero.base_power > 80 ? ' aggressive plays' : ' tactical scaling'}.
              Current meta analysis suggests a ban rate of {hero.ban_count || 0}.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  imageContainer: { height: 350, width: width, position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
  backButton: {
    position: 'absolute', top: 50, left: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center'
  },
  titleContainer: { position: 'absolute', bottom: 20, left: 20 },
  heroName: { fontSize: 32, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 10 },
  heroRole: { fontSize: 16, color: '#94a3b8', marginTop: 4 },
  content: { padding: 20 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statLabel: { width: 80, color: '#94a3b8', fontSize: 14 },
  barContainer: { flex: 1, height: 8, backgroundColor: '#0f172a', borderRadius: 4, marginRight: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  statValue: { width: 30, color: '#fff', fontSize: 12, textAlign: 'right' },
  desc: { color: '#cbd5e1', lineHeight: 22 }
});