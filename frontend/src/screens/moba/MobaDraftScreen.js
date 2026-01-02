/**
 * MobaDraftScreen
 * Feature: SMART DRAFT SYSTEM + SEARCH BAR
 * UX Update: Compact Grid & STRICT FILTERING (No Duplicates)
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    StatusBar,
    FlatList,
    ActivityIndicator,
    TextInput,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import { theme } from '../../theme/theme';
import { getPlayerAvatar } from '../../utils/PlayerAvatars';
import { apiClient } from '../../services/ApiClient';
// [IMPORT NEW]
import { getHeroImage } from '../../utils/HeroAssets';

const { width } = Dimensions.get('window');

// --- CONSTANTS ---
const ROLE_FILTERS = ['All', 'Jungle', 'Mid', 'Roam', 'Gold', 'Exp'];

// --- KOMPONEN KECIL ---

const PlayerSlot = ({ player, isEnemy }) => {
    const avatarSource = getPlayerAvatar(player.id);
    const heroImageSource = player.hero ? getHeroImage(player.hero.id) : null;
    const isFilled = !!player.hero;

    return (
        <Animatable.View
            animation={isEnemy ? "fadeInRight" : "fadeInLeft"}
            style={[styles.slotContainer, isEnemy && styles.slotContainerEnemy]}
        >
            <LinearGradient
                colors={isFilled ? [theme.colors.accent.gold + '20', theme.colors.accent.gold + '05'] : ['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)']}
                style={[styles.slotGradient, isFilled && styles.slotGradientFilled]}
            >
                <View style={[styles.slotContent, isEnemy && styles.slotContentEnemy]}>
                    <View style={styles.avatarContainer}>
                        <Image source={avatarSource} style={styles.avatarImage} />
                        {!isEnemy && (
                            <Text style={styles.playerNameSmall} numberOfLines={1}>{player.name}</Text>
                        )}
                        <Text style={styles.roleLabelSmall}>{player.role.toUpperCase()}</Text>
                    </View>

                    <View style={styles.pickStatus}>
                        {isFilled ? (
                            <Text style={styles.pickedText}>{player.hero.name.toUpperCase()}</Text>
                        ) : (
                            <Text style={styles.waitingText}>WAITING...</Text>
                        )}
                    </View>

                    <View style={[styles.heroContainer, isFilled && styles.heroContainerFilled]}>
                        {heroImageSource ? (
                            <Image source={heroImageSource} style={styles.heroImage} resizeMode="cover" />
                        ) : (
                            <View style={styles.heroPlaceholder}>
                                <MaterialCommunityIcons name="help" size={20} color={theme.colors.text.secondary} />
                            </View>
                        )}
                    </View>
                </View>
            </LinearGradient>
        </Animatable.View>
    );
};

const HeroGridItem = ({ hero, onPress, isDisabled, isSelected }) => (
    <TouchableOpacity
        style={[
            styles.heroGridItem,
            isDisabled && styles.heroGridItemDisabled,
            isSelected && styles.heroGridItemSelected
        ]}
        onPress={onPress}
        disabled={isDisabled}
    >
        <Image source={getHeroImage(hero.id)} style={styles.heroGridImage} resizeMode="cover" />

        <View style={styles.heroNameOverlay}>
            <Text style={styles.heroNameText} numberOfLines={1}>{hero.name}</Text>
        </View>

        {/* Role Badge */}
        <View style={styles.gridRoleBadge}>
            <Text style={styles.gridRoleText}>{hero.primaryRole?.charAt(0)}</Text>
        </View>

        {isDisabled && (
            <View style={styles.disabledOverlay}>
                <MaterialCommunityIcons name="check" size={24} color="#10b981" />
            </View>
        )}
    </TouchableOpacity>
);

// --- MAIN SCREEN ---
export default function MobaDraftScreen({ navigation, route }) {
    const [timer, setTimer] = useState(30);
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // [NEW] Dynamic Team Names
    const [teamNames, setTeamNames] = useState({ myTeam: 'PHANTOM', enemyTeam: 'TITAN' });
    const { matchId } = route.params || {};

    const [heroPool, setHeroPool] = useState([]);
    const [loading, setLoading] = useState(true);

    // State Teams
    const [myTeam, setMyTeam] = useState([
        { id: 1, name: 'Player 1', role: 'jungle', hero: null },
        { id: 2, name: 'Player 2', role: 'mid', hero: null },
        { id: 3, name: 'Player 3', role: 'roam', hero: null },
        { id: 4, name: 'Player 4', role: 'gold', hero: null },
        { id: 5, name: 'Player 5', role: 'exp', hero: null },
    ]);

    const [enemyTeam, setEnemyTeam] = useState([
        { id: 6, name: 'Enemy 1', role: 'exp', hero: null },
        { id: 7, name: 'Enemy 2', role: 'gold', hero: null },
        { id: 8, name: 'Enemy 3', role: 'mid', hero: null },
        { id: 9, name: 'Enemy 4', role: 'roam', hero: null },
        { id: 10, name: 'Enemy 5', role: 'jungle', hero: null },
    ]);

    const [tempSelectedHero, setTempSelectedHero] = useState(null);

    // [NEW] Fetch Heroes from Local API
    useEffect(() => {
        const fetchHeroes = async () => {
            try {
                const response = await apiClient.get('/api/heroes/');
                if (response.data && response.data.items) {
                    const heroes = response.data.items;

                    const formattedHeroes = heroes.map(hero => {
                        // Map Database 'lane' or 'hero_class' to Draft Roles
                        // DB Lanes: 'Exp Lane', 'Jungle', 'Mid Lane', 'Gold Lane', 'Roamer'
                        // Draft Roles: 'Jungle', 'Mid', 'Roam', 'Gold', 'Exp'

                        let primaryRole = 'Exp';
                        const lane = hero.lane || '';

                        if (lane.includes('Gold')) primaryRole = 'Gold';
                        else if (lane.includes('Mid')) primaryRole = 'Mid';
                        else if (lane.includes('Jungle')) primaryRole = 'Jungle';
                        else if (lane.includes('Roam')) primaryRole = 'Roam';
                        else if (lane.includes('Exp')) primaryRole = 'Exp';
                        else {
                            // Fallback based on class if lane is missing
                            const hClass = hero.hero_class || '';
                            if (hClass === 'Marksman') primaryRole = 'Gold';
                            else if (hClass === 'Support' || hClass === 'Tank') primaryRole = 'Roam';
                            else if (hClass === 'Mage') primaryRole = 'Mid';
                            else if (hClass === 'Assassin') primaryRole = 'Jungle';
                        }

                        // Local Asset mapping handled by HeroAssets utility import
                        return {
                            id: hero.id,
                            name: hero.name,
                            roles: [primaryRole],
                            primaryRole: primaryRole,
                            isPicked: false,
                            originalData: hero
                        };
                    });

                    setHeroPool(formattedHeroes);
                }
            } catch (error) {
                console.error("Failed to fetch heroes:", error);
                Alert.alert("Error", "Failed to load heroes.");
            } finally {
                setLoading(false);
            }
        };
        fetchHeroes();
    }, []);

    // [NEW] Fetch Match Details for Team Names
    useEffect(() => {
        const fetchMatchDetails = async () => {
            if (!matchId) return;
            try {
                const response = await apiClient.get(`/api/matches/${matchId}`);
                const match = response.data;
                if (match) {
                    setTeamNames({
                        myTeam: match.team1?.name?.toUpperCase() || 'PHANTOM',
                        enemyTeam: match.team2?.name?.toUpperCase() || 'TITAN'
                    });
                }
            } catch (error) {
                console.error("Failed to fetch match details:", error);
            }
        };
        fetchMatchDetails();
    }, [matchId]);

    // LOGIC SELECT
    const handleSelectHero = (hero) => {
        if (hero.isPicked) return;
        const targetRole = hero.primaryRole.toLowerCase();
        const targetPlayer = myTeam.find(p => p.role === targetRole);

        if (!targetPlayer) {
            Alert.alert("Role Mismatch", `Hero ini khusus role ${hero.primaryRole}.`);
            return;
        }
        if (targetPlayer.hero) {
            Alert.alert("Slot Full", `Slot ${hero.primaryRole} sudah terisi.`);
            return;
        }
        setTempSelectedHero(hero);
    };

    // LOGIC LOCK IN
    const handleLockIn = () => {
        if (!tempSelectedHero) return;
        const targetRole = tempSelectedHero.primaryRole.toLowerCase();

        const updatedTeam = myTeam.map(player =>
            player.role === targetRole ? { ...player, hero: tempSelectedHero } : player
        );
        setMyTeam(updatedTeam);

        const updatedPool = heroPool.map(h =>
            h.id === tempSelectedHero.id ? { ...h, isPicked: true } : h
        );
        setHeroPool(updatedPool);
        setTempSelectedHero(null);
        setSearchQuery('');

        if (updatedTeam.every(p => p.hero !== null)) {
            Alert.alert("Draft Complete", "Semua hero dipilih!", [
                { text: "START MATCH", onPress: () => navigation.navigate('MobaMatch', { myTeam: updatedTeam }) }
            ]);
        }
    };

    const filteredHeroes = heroPool.filter(hero => {
        const roleMatch = selectedFilter === 'All' || hero.roles.includes(selectedFilter);
        const searchMatch = hero.name.toLowerCase().includes(searchQuery.toLowerCase());
        return roleMatch && searchMatch;
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar hidden />
            <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={StyleSheet.absoluteFillObject} />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.teamHeaderLeft}>
                    <MaterialCommunityIcons name="shield-account" size={24} color={theme.colors.accent.gold} />
                    <Text style={styles.teamName}>{teamNames.myTeam}</Text>
                </View>
                <View style={styles.scoreTimerContainer}>
                    <View style={styles.timerBadge}>
                        <Text style={styles.timerText}>{timer}</Text>
                    </View>
                    <Text style={styles.phaseText}>
                        {tempSelectedHero ? `LOCKING ${tempSelectedHero.name.toUpperCase()}...` : "PICK PHASE"}
                    </Text>
                </View>
                <View style={styles.teamHeaderRight}>
                    <Text style={styles.teamName}>{teamNames.enemyTeam}</Text>
                    <MaterialCommunityIcons name="shield-account-outline" size={24} color={theme.colors.text.secondary} />
                </View>
            </View>

            <View style={styles.contentRow}>

                {/* LEFT: MY TEAM */}
                <View style={styles.sideColumn}>
                    {myTeam.map(p => (
                        <PlayerSlot key={p.id} player={p} isEnemy={false} />
                    ))}
                </View>

                {/* CENTER: SEARCH & HERO GRID */}
                <View style={styles.centerColumn}>

                    {/* SEARCH BAR */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search Hero..."
                            placeholderTextColor="#64748b"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery !== '' && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={16} color="#64748b" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* FILTER BUTTONS */}
                    <View style={styles.filterRow}>
                        {ROLE_FILTERS.map(filter => (
                            <TouchableOpacity
                                key={filter}
                                style={[styles.filterBtn, selectedFilter === filter && styles.filterBtnActive]}
                                onPress={() => setSelectedFilter(filter)}
                            >
                                <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                                    {filter.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* HERO GRID (4 COLUMNS) */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.accent.gold} />
                        </View>
                    ) : (
                        <FlatList
                            data={filteredHeroes}
                            keyExtractor={item => item.id.toString()}
                            numColumns={4}
                            renderItem={({ item }) => (
                                <HeroGridItem
                                    hero={item}
                                    onPress={() => handleSelectHero(item)}
                                    isDisabled={item.isPicked}
                                    isSelected={tempSelectedHero?.id === item.id}
                                />
                            )}
                            contentContainerStyle={styles.heroGridContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No heroes found</Text>
                                </View>
                            }
                        />
                    )}

                    {/* LOCK IN BUTTON */}
                    <TouchableOpacity
                        style={[styles.confirmBtn, !tempSelectedHero && styles.confirmBtnDisabled]}
                        onPress={handleLockIn}
                        disabled={!tempSelectedHero}
                    >
                        <Text style={[styles.confirmBtnText, !tempSelectedHero && styles.confirmBtnTextDisabled]}>
                            {tempSelectedHero ? "LOCK IN" : "SELECT"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* RIGHT: ENEMY TEAM */}
                <View style={styles.sideColumn}>
                    {enemyTeam.map(p => (
                        <PlayerSlot key={p.id} player={p} isEnemy={true} />
                    ))}
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(15, 23, 42, 0.9)', borderBottomWidth: 1, borderColor: theme.colors.accent.gold + '30' },
    teamHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    teamHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    teamName: { color: '#fff', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
    scoreTimerContainer: { alignItems: 'center' },
    timerBadge: { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 12, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.accent.gold },
    timerText: { color: theme.colors.accent.gold, fontWeight: '900', fontSize: 16 },
    phaseText: { color: theme.colors.text.secondary, fontSize: 10, fontWeight: 'bold', marginTop: 4 },

    // Layout
    contentRow: { flex: 1, flexDirection: 'row', padding: 4 },
    sideColumn: { width: '25%', justifyContent: 'space-evenly', paddingVertical: 4 },
    centerColumn: { flex: 1, marginHorizontal: 4, backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: 8, padding: 4, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', position: 'relative' },

    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 6,
        paddingHorizontal: 10,
        marginBottom: 6,
        height: 36,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    searchInput: { flex: 1, color: '#fff', fontSize: 12 },

    // Slot Logic Styles
    slotContainer: { height: 55, marginBottom: 4 },
    slotContainerEnemy: { alignItems: 'flex-end' },
    slotGradient: { flex: 1, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' },
    slotGradientFilled: { borderColor: theme.colors.accent.gold },
    slotContent: { flexDirection: 'row', alignItems: 'center', padding: 2, height: '100%' },
    slotContentEnemy: { flexDirection: 'row-reverse' },

    avatarContainer: { alignItems: 'center', marginHorizontal: 4, width: 40 },
    avatarImage: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#64748b' },
    playerNameSmall: { color: '#fff', fontSize: 7, marginTop: 1, textAlign: 'center', width: '100%' },
    roleLabelSmall: { color: theme.colors.accent.gold, fontSize: 6, fontWeight: 'bold', marginTop: 1 },

    pickStatus: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pickedText: { color: theme.colors.accent.gold, fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
    waitingText: { color: '#64748b', fontSize: 7, textAlign: 'center' },

    heroContainer: { width: 40, height: 40, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginRight: 4 },
    heroContainerFilled: { borderColor: theme.colors.accent.gold, borderWidth: 1 },
    heroImage: { width: '100%', height: '100%' },
    heroPlaceholder: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },

    // Filters
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    filterBtn: { paddingVertical: 4, paddingHorizontal: 4, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)', flex: 1, marginHorizontal: 1, alignItems: 'center' },
    filterBtnActive: { backgroundColor: theme.colors.accent.gold },
    filterText: { color: theme.colors.text.secondary, fontSize: 7, fontWeight: 'bold' },
    filterTextActive: { color: '#0f172a' },

    // Grid
    heroGridContent: { paddingBottom: 60 },
    heroGridItem: { flex: 1, aspectRatio: 1, margin: 2, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', position: 'relative' },
    heroGridItemSelected: { borderColor: theme.colors.accent.gold, borderWidth: 2 },
    heroGridItemDisabled: { opacity: 0.3 },
    heroGridImage: { width: '100%', height: '100%' },
    heroNameOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 2, alignItems: 'center' },
    heroNameText: { color: '#fff', fontSize: 7, fontWeight: 'bold', textAlign: 'center' },
    gridRoleBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: theme.colors.accent.gold, width: 10, height: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
    gridRoleText: { fontSize: 6, fontWeight: 'bold', color: '#000' },

    disabledOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },

    // Button
    confirmBtn: { position: 'absolute', bottom: 6, left: 6, right: 6, backgroundColor: theme.colors.accent.gold, paddingVertical: 10, borderRadius: 6, alignItems: 'center', elevation: 5 },
    confirmBtnDisabled: { backgroundColor: '#334155', elevation: 0 },
    confirmBtnText: { color: '#0f172a', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    confirmBtnTextDisabled: { color: '#94a3b8' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
    emptyText: { color: '#64748b' }
});