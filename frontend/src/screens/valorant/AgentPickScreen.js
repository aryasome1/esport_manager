/**
 * Agent Pick Screen
 * Pre-match agent selection for Valorant simulation
 * Fetches agents from official Valorant API
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 60) / 4;

// Role colors
const ROLE_COLORS = {
    Duelist: '#ef4444',
    Controller: '#a855f7',
    Initiator: '#22c55e',
    Sentinel: '#3b82f6',
};

// Role icons
const ROLE_ICONS = {
    Duelist: '⚔️',
    Controller: '🌀',
    Initiator: '🎯',
    Sentinel: '🛡️',
};

export default function AgentPickScreen({ route, navigation }) {
    // BO3 Support: Accept array of maps and current map index
    const {
        matchId,
        matchData,
        teamSide = 'team1',
        bo3Maps = [],      // Array of 3 maps from DraftMapScreen
        currentMapIndex = 0, // Which map we're playing (0, 1, 2)
        bo3Score = { player: 0, cpu: 0 }, // Track BO3 score
    } = route.params || {};

    const currentMap = bo3Maps[currentMapIndex] || null;

    const [loading, setLoading] = useState(true);
    const [agents, setAgents] = useState([]);
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [activeRole, setActiveRole] = useState('All');
    const [currentPick, setCurrentPick] = useState(0); // 0-4 for 5 players

    const roles = ['All', 'Duelist', 'Controller', 'Initiator', 'Sentinel'];

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const response = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
            const json = await response.json();
            if (json.status === 200) {
                // Map to simpler structure
                const mappedAgents = json.data.map(agent => ({
                    id: agent.uuid,
                    name: agent.displayName,
                    role: agent.role?.displayName || 'Unknown',
                    icon: agent.displayIcon,
                    fullPortrait: agent.fullPortrait,
                    background: agent.background,
                    colors: agent.backgroundGradientColors,
                    abilities: agent.abilities,
                }));
                setAgents(mappedAgents);
            }
        } catch (error) {
            console.error('Failed to fetch agents:', error);
            Alert.alert('Error', 'Failed to load agents');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAgent = (agent) => {
        // Check if already selected
        if (selectedAgents.find(a => a.id === agent.id)) {
            Alert.alert('Already Picked', `${agent.name} is already selected`);
            return;
        }

        // Add to selected
        if (selectedAgents.length < 5) {
            setSelectedAgents([...selectedAgents, agent]);
            setCurrentPick(prev => prev + 1);
        }
    };

    const handleRemoveAgent = (index) => {
        const newSelected = [...selectedAgents];
        newSelected.splice(index, 1);
        setSelectedAgents(newSelected);
        setCurrentPick(prev => prev - 1);
    };

    const handleConfirm = () => {
        if (selectedAgents.length < 5) {
            Alert.alert('Incomplete', 'Please select 5 agents');
            return;
        }

        // Navigate to simulation with selected agents and BO3 data
        navigation.replace('ValorantMatchSim', {
            matchId,
            matchData: {
                ...matchData,
                map: currentMap, // Pass current map from BO3
            },
            selectedAgents,
            teamSide,
            // BO3 tracking
            bo3Maps,
            currentMapIndex,
            bo3Score,
        });
    };

    const filteredAgents = activeRole === 'All'
        ? agents
        : agents.filter(a => a.role === activeRole);

    const renderAgentCard = ({ item }) => {
        const isSelected = selectedAgents.find(a => a.id === item.id);
        const roleColor = ROLE_COLORS[item.role] || '#6366f1';

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                style={[
                    styles.agentCard,
                    isSelected && styles.agentCardSelected,
                    { borderColor: isSelected ? roleColor : 'transparent' }
                ]}
                onPress={() => handleSelectAgent(item)}
            >
                <Image
                    source={{ uri: item.icon }}
                    style={styles.agentIcon}
                    resizeMode="contain"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.cardGradient}
                >
                    <Text style={styles.agentName} numberOfLines={1}>{item.name}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
                        <Text style={styles.roleText}>{ROLE_ICONS[item.role]} {item.role}</Text>
                    </View>
                </LinearGradient>
                {isSelected && (
                    <View style={[styles.selectedOverlay, { backgroundColor: roleColor + '40' }]}>
                        <Ionicons name="checkmark-circle" size={32} color="#fff" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderSelectedSlot = (index) => {
        const agent = selectedAgents[index];
        const roleColor = agent ? ROLE_COLORS[agent.role] : '#334155';

        return (
            <TouchableOpacity
                key={index}
                style={[styles.selectedSlot, { borderColor: roleColor }]}
                onPress={() => agent && handleRemoveAgent(index)}
                disabled={!agent}
            >
                {agent ? (
                    <>
                        <Image source={{ uri: agent.icon }} style={styles.slotIcon} resizeMode="contain" />
                        <Text style={styles.slotName} numberOfLines={1}>{agent.name}</Text>
                        <View style={styles.removeBtn}>
                            <Ionicons name="close" size={12} color="#fff" />
                        </View>
                    </>
                ) : (
                    <View style={styles.emptySlot}>
                        <Ionicons name="add" size={24} color="#64748b" />
                        <Text style={styles.emptyText}>Pick {index + 1}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff4655" />
                <Text style={styles.loadingText}>Loading Agents...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>AGENT SELECT</Text>
                    {currentMap ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Text style={styles.headerSubtitle}>
                                MAP {currentMapIndex + 1}/3: {currentMap.displayName?.toUpperCase()}
                            </Text>
                            <View style={{ marginLeft: 12, flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: '#22c55e', fontWeight: 'bold', fontSize: 12 }}>
                                    YOU {bo3Score.player}
                                </Text>
                                <Text style={{ color: '#64748b', marginHorizontal: 4 }}>-</Text>
                                <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 12 }}>
                                    {bo3Score.cpu} CPU
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.headerSubtitle}>Pick 5 agents for your team</Text>
                    )}
                </View>
            </View>

            {/* Selected Agents Bar */}
            <View style={styles.selectedBar}>
                {[0, 1, 2, 3, 4].map(i => renderSelectedSlot(i))}
            </View>

            {/* Role Filter */}
            <View style={styles.roleFilter}>
                {roles.map(role => (
                    <TouchableOpacity
                        key={role}
                        style={[
                            styles.roleBtn,
                            activeRole === role && styles.roleBtnActive,
                            activeRole === role && { backgroundColor: ROLE_COLORS[role] || '#6366f1' }
                        ]}
                        onPress={() => setActiveRole(role)}
                    >
                        <Text style={[styles.roleBtnText, activeRole === role && styles.roleBtnTextActive]}>
                            {role}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Agent Grid */}
            <FlatList
                data={filteredAgents}
                renderItem={renderAgentCard}
                keyExtractor={item => item.id}
                numColumns={4}
                contentContainerStyle={styles.agentGrid}
                showsVerticalScrollIndicator={false}
            />

            {/* Confirm Button */}
            <TouchableOpacity
                style={[
                    styles.confirmBtn,
                    selectedAgents.length < 5 && styles.confirmBtnDisabled
                ]}
                onPress={handleConfirm}
                disabled={selectedAgents.length < 5}
            >
                <LinearGradient
                    colors={selectedAgents.length >= 5 ? ['#ff4655', '#dc2626'] : ['#475569', '#334155']}
                    style={styles.confirmGradient}
                >
                    <Text style={styles.confirmText}>
                        {selectedAgents.length >= 5 ? 'START MATCH' : `SELECT ${5 - selectedAgents.length} MORE`}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
    },
    loadingText: {
        color: '#94a3b8',
        marginTop: 12,
        fontSize: 14,
    },

    // Header
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#1e293b',
    },
    backBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 2,
    },
    headerSubtitle: {
        color: '#94a3b8',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },

    // Selected Bar
    selectedBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        backgroundColor: '#1e293b',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    selectedSlot: {
        width: 60,
        height: 70,
        borderRadius: 8,
        borderWidth: 2,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    slotIcon: {
        width: 40,
        height: 40,
    },
    slotName: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
        marginTop: 2,
    },
    removeBtn: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptySlot: {
        alignItems: 'center',
    },
    emptyText: {
        color: '#64748b',
        fontSize: 8,
        marginTop: 2,
    },

    // Role Filter
    roleFilter: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    roleBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#1e293b',
    },
    roleBtnActive: {
        backgroundColor: '#6366f1',
    },
    roleBtnText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
    },
    roleBtnTextActive: {
        color: '#fff',
    },

    // Agent Grid
    agentGrid: {
        padding: 10,
    },
    agentCard: {
        width: CARD_SIZE,
        height: CARD_SIZE * 1.2,
        margin: 5,
        borderRadius: 10,
        backgroundColor: '#1e293b',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    agentCardSelected: {
        transform: [{ scale: 0.95 }],
    },
    agentIcon: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    cardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
        paddingTop: 20,
    },
    agentName: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    roleBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    roleText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Confirm Button
    confirmBtn: {
        margin: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    confirmBtnDisabled: {
        opacity: 0.7,
    },
    confirmGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    confirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
