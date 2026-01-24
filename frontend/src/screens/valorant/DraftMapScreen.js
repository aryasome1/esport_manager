/**
 * DraftMapScreen - BO3 Map Veto System
 * Valorant-style map ban/pick for Best of 3 matches
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

// Filter non-playable maps
const IGNORED_MAPS = ['The Range', 'Basic Training', 'Training Grounds'];

// Veto phases for BO3
const VETO_PHASES = [
    { type: 'ban', team: 'cpu', label: 'Enemy Ban' },
    { type: 'ban', team: 'player', label: 'Your Ban' },
    { type: 'pick', team: 'cpu', label: 'Enemy Pick (Map 2)' },
    { type: 'pick', team: 'player', label: 'Your Pick (Map 1)' },
    { type: 'ban', team: 'cpu', label: 'Enemy Ban' },
    { type: 'decider', team: 'none', label: 'Decider (Map 3)' },
];

export default function DraftMapScreen({ route, navigation }) {
    const [loading, setLoading] = useState(true);
    const [allMaps, setAllMaps] = useState([]);
    const [availableMaps, setAvailableMaps] = useState([]);
    const [bannedMaps, setBannedMaps] = useState([]);
    const [pickedMaps, setPickedMaps] = useState([]); // Order: [playerPick, cpuPick, decider]
    const [currentPhase, setCurrentPhase] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // Match data from route
    const { matchData, opponentTeam } = route.params || {};

    useEffect(() => {
        fetchMaps();
    }, []);

    useEffect(() => {
        // Auto-process CPU phases
        if (!loading && currentPhase < VETO_PHASES.length) {
            const phase = VETO_PHASES[currentPhase];
            if (phase.team === 'cpu') {
                processCPUPhase();
            }
        }
    }, [currentPhase, loading]);

    const fetchMaps = async () => {
        try {
            const response = await fetch('https://valorant-api.com/v1/maps');
            const json = await response.json();
            if (json.status === 200) {
                const validMaps = json.data.filter(m => !IGNORED_MAPS.includes(m.displayName));
                // Take 7 maps for standard BO3 veto
                const mapPool = validMaps.slice(0, 7);
                setAllMaps(mapPool);
                setAvailableMaps(mapPool);
            }
        } catch (error) {
            console.error('Failed to fetch maps:', error);
            Alert.alert('Error', 'Failed to load maps');
        } finally {
            setLoading(false);
        }
    };

    const processCPUPhase = async () => {
        setIsProcessing(true);

        // Simulate CPU thinking
        await new Promise(resolve => setTimeout(resolve, 1500));

        const phase = VETO_PHASES[currentPhase];
        const available = availableMaps.filter(m =>
            !bannedMaps.find(b => b.uuid === m.uuid) &&
            !pickedMaps.find(p => p.uuid === m.uuid)
        );

        if (available.length === 0) {
            setIsProcessing(false);
            return;
        }

        // Random selection for CPU
        const randomIndex = Math.floor(Math.random() * available.length);
        const selectedMap = available[randomIndex];

        if (phase.type === 'ban') {
            setBannedMaps(prev => [...prev, { ...selectedMap, bannedBy: 'cpu' }]);
        } else if (phase.type === 'pick') {
            setPickedMaps(prev => [...prev, { ...selectedMap, pickedBy: 'cpu', order: 2 }]);
        }

        setCurrentPhase(prev => prev + 1);
        setIsProcessing(false);
    };

    const handlePlayerAction = (map) => {
        if (isProcessing) return;

        const phase = VETO_PHASES[currentPhase];
        if (phase.team !== 'player') return;

        if (phase.type === 'ban') {
            setBannedMaps(prev => [...prev, { ...map, bannedBy: 'player' }]);
        } else if (phase.type === 'pick') {
            setPickedMaps(prev => [...prev, { ...map, pickedBy: 'player', order: 1 }]);
        }

        setCurrentPhase(prev => prev + 1);
    };

    // Check if veto is complete
    useEffect(() => {
        if (currentPhase >= VETO_PHASES.length - 1) {
            // Find decider map
            const remaining = availableMaps.filter(m =>
                !bannedMaps.find(b => b.uuid === m.uuid) &&
                !pickedMaps.find(p => p.uuid === m.uuid)
            );

            if (remaining.length > 0 && currentPhase === VETO_PHASES.length - 1) {
                const decider = { ...remaining[0], pickedBy: 'decider', order: 3 };
                setPickedMaps(prev => [...prev, decider]);
                setCurrentPhase(prev => prev + 1);
            }
        }
    }, [currentPhase, bannedMaps, pickedMaps]);

    const handleStartMatch = () => {
        // Sort maps by order: Player pick (1), CPU pick (2), Decider (3)
        const sortedMaps = [...pickedMaps].sort((a, b) => a.order - b.order);

        navigation.navigate('AgentPickScreen', {
            matchData,
            opponentTeam,
            bo3Maps: sortedMaps,
            currentMapIndex: 0,
            bo3Score: { player: 0, cpu: 0 },
        });
    };

    const isVetoComplete = currentPhase >= VETO_PHASES.length;
    const currentPhaseData = VETO_PHASES[currentPhase] || {};

    const getMapStatus = (map) => {
        const banned = bannedMaps.find(b => b.uuid === map.uuid);
        if (banned) return { status: 'banned', by: banned.bannedBy };

        const picked = pickedMaps.find(p => p.uuid === map.uuid);
        if (picked) return { status: 'picked', by: picked.pickedBy, order: picked.order };

        return { status: 'available' };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff4655" />
                <Text style={styles.loadingText}>Loading Map Pool...</Text>
            </View>
        );
    }

    return (
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>MAP VETO</Text>
                <Text style={styles.subtitle}>Best of 3</Text>
            </View>

            {/* Current Phase Indicator */}
            <View style={styles.phaseContainer}>
                {isVetoComplete ? (
                    <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.phaseComplete}>
                        VETO COMPLETE
                    </Animatable.Text>
                ) : (
                    <>
                        <Text style={styles.phaseLabel}>{currentPhaseData.label}</Text>
                        {currentPhaseData.team === 'cpu' && isProcessing && (
                            <View style={styles.cpuThinking}>
                                <ActivityIndicator size="small" color="#ef4444" />
                                <Text style={styles.cpuText}>Enemy is choosing...</Text>
                            </View>
                        )}
                        {currentPhaseData.team === 'player' && (
                            <Text style={styles.playerPrompt}>Select a map to {currentPhaseData.type}</Text>
                        )}
                    </>
                )}
            </View>

            {/* Map Pool */}
            <View style={styles.mapGrid}>
                {allMaps.map((map) => {
                    const status = getMapStatus(map);
                    const isSelectable = !isVetoComplete &&
                        currentPhaseData.team === 'player' &&
                        status.status === 'available';

                    return (
                        <TouchableOpacity
                            key={map.uuid}
                            style={[
                                styles.mapCard,
                                status.status === 'banned' && styles.bannedCard,
                                status.status === 'picked' && styles.pickedCard,
                            ]}
                            onPress={() => isSelectable && handlePlayerAction(map)}
                            disabled={!isSelectable}
                            activeOpacity={isSelectable ? 0.7 : 1}
                        >
                            <Image
                                source={{ uri: map.listViewIcon || map.displayIcon }}
                                style={styles.mapImage}
                                resizeMode="cover"
                            />

                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.9)']}
                                style={styles.mapOverlay}
                            >
                                <Text style={styles.mapName}>{map.displayName}</Text>

                                {status.status === 'banned' && (
                                    <View style={[styles.statusBadge, styles.bannedBadge]}>
                                        <Text style={styles.badgeText}>
                                            BANNED {status.by === 'player' ? '(You)' : '(Enemy)'}
                                        </Text>
                                    </View>
                                )}

                                {status.status === 'picked' && (
                                    <View style={[styles.statusBadge, styles.pickedBadge]}>
                                        <Text style={styles.badgeText}>
                                            MAP {status.order} {status.by === 'player' ? '(You)' : status.by === 'cpu' ? '(Enemy)' : ''}
                                        </Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Selected Maps Preview */}
            {pickedMaps.length > 0 && (
                <View style={styles.selectedMaps}>
                    <Text style={styles.selectedTitle}>MATCH ORDER</Text>
                    <View style={styles.selectedRow}>
                        {[...pickedMaps].sort((a, b) => a.order - b.order).map((map, idx) => (
                            <View key={map.uuid} style={styles.selectedMapItem}>
                                <Text style={styles.mapOrderNumber}>MAP {idx + 1}</Text>
                                <Text style={styles.selectedMapName}>{map.displayName}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Start Match Button */}
            {isVetoComplete && (
                <Animatable.View animation="fadeInUp" style={styles.startContainer}>
                    <TouchableOpacity style={styles.startButton} onPress={handleStartMatch}>
                        <Text style={styles.startButtonText}>PROCEED TO AGENT SELECT</Text>
                    </TouchableOpacity>
                </Animatable.View>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
    loadingText: { color: '#94a3b8', marginTop: 16, fontSize: 16 },

    header: { alignItems: 'center', paddingTop: 50, paddingBottom: 16 },
    title: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 4 },
    subtitle: { color: '#64748b', fontSize: 14, marginTop: 4 },

    phaseContainer: { alignItems: 'center', paddingVertical: 16, minHeight: 80 },
    phaseLabel: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold' },
    phaseComplete: { color: '#22c55e', fontSize: 20, fontWeight: 'bold' },
    cpuThinking: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    cpuText: { color: '#ef4444', marginLeft: 8, fontSize: 14 },
    playerPrompt: { color: '#3b82f6', fontSize: 14, marginTop: 8 },

    mapGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: 8,
        gap: 8,
    },
    mapCard: {
        width: (width - 48) / 3,
        height: 100,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    bannedCard: { opacity: 0.4, borderColor: '#ef4444' },
    pickedCard: { borderColor: '#22c55e' },
    mapImage: { width: '100%', height: '100%', position: 'absolute' },
    mapOverlay: { flex: 1, justifyContent: 'flex-end', padding: 6 },
    mapName: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

    statusBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4
    },
    bannedBadge: { backgroundColor: '#ef4444' },
    pickedBadge: { backgroundColor: '#22c55e' },
    badgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },

    selectedMaps: { padding: 16, marginTop: 16 },
    selectedTitle: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
    selectedRow: { flexDirection: 'row', justifyContent: 'space-around' },
    selectedMapItem: { alignItems: 'center' },
    mapOrderNumber: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },
    selectedMapName: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 4 },

    startContainer: { padding: 20 },
    startButton: {
        backgroundColor: '#ff4655',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center'
    },
    startButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});
