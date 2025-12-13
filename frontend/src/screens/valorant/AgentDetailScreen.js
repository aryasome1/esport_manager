import React from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function AgentDetailScreen({ route, navigation }) {
  const { agent } = route.params;
  const insets = useSafeAreaInsets();

  const renderAbility = (ability) => (
    <View key={ability.slot} style={styles.abilityRow}>
        <View style={styles.abilityIconBox}>
            {ability.displayIcon ? (
                <Image source={{ uri: ability.displayIcon }} style={styles.abilityIcon} />
            ) : (
                <Text style={{color:'#fff'}}>?</Text>
            )}
        </View>
        <View style={styles.abilityInfo}>
            <Text style={styles.abilityName}>{ability.displayName.toUpperCase()}</Text>
            <Text style={styles.abilityDesc}>{ability.description}</Text>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView bounces={false}>
        {/* Hero Header */}
        <View style={styles.headerContainer}>
            <ImageBackground
                source={{ uri: agent.background }}
                style={styles.bgPattern}
                imageStyle={{ opacity: 0.3 }}
            >
                <Image source={{ uri: agent.fullPortrait }} style={styles.fullPortrait} />
                
                <LinearGradient
                    colors={['transparent', '#0f172a']}
                    style={styles.gradient}
                />
                
                {/* Back Button */}
                <TouchableOpacity 
                    style={[styles.backButton, { top: insets.top + 10 }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.nameContainer}>
                    <Text style={styles.roleText}>{agent.role?.displayName.toUpperCase()}</Text>
                    <Text style={styles.agentName}>{agent.displayName.toUpperCase()}</Text>
                </View>
            </ImageBackground>
        </View>

        {/* Description */}
        <View style={styles.content}>
            <Text style={styles.descText}>{agent.description}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>ABILITIES</Text>
            {agent.abilities.map(ability => renderAbility(ability))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  headerContainer: { height: 450, position: 'relative', backgroundColor: '#1e293b' },
  bgPattern: { width: '100%', height: '100%' },
  fullPortrait: { width: width, height: '100%', resizeMode: 'cover', position: 'absolute', bottom: -50 }, // Adjust position
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
  
  backButton: {
    position: 'absolute', left: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10
  },
  
  nameContainer: { position: 'absolute', bottom: 20, left: 20 },
  roleText: { color: '#ff4655', fontWeight: 'bold', fontSize: 14, letterSpacing: 2, marginBottom: 4 },
  agentName: { color: '#fff', fontWeight: '900', fontSize: 40, fontStyle: 'italic', letterSpacing: 1 },
  
  content: { padding: 20 },
  descText: { color: '#94a3b8', lineHeight: 22, fontSize: 14, marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#334155', marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16, fontStyle: 'italic' },
  
  abilityRow: { flexDirection: 'row', marginBottom: 20 },
  abilityIconBox: { 
    width: 50, height: 50, backgroundColor: '#1e293b', 
    justifyContent: 'center', alignItems: 'center', 
    marginRight: 16, borderWidth: 1, borderColor: '#334155' 
  },
  abilityIcon: { width: 32, height: 32, tintColor: '#fff' },
  abilityInfo: { flex: 1 },
  abilityName: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  abilityDesc: { color: '#64748b', fontSize: 12, lineHeight: 18 },
});