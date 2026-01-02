/**
 * Main App.js for eSports Multi-Division Manager Frontend
 * FIXED: Moved SafeAreaProvider to Top Level to prevent Web Crash (removeChild error)
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // [PENTING] Import ini
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from './src/theme/theme';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WebSocketProvider } from './src/contexts/WebSocketContext';
import { DivisionProvider, useDivision } from './src/contexts/DivisionContext';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import MainHubScreen from './src/screens/main/MainHubScreen';
import DivisionSelectionScreen from './src/screens/division/DivisionSelectionScreen';

// MOBA Screens
import MobaDraftScreen from './src/screens/moba/MobaDraftScreen';
import MobaMatchSim from './src/screens/moba/MobaMatchSim';
import TeamScreen from './src/screens/main/TeamScreen';
import HeroesScreen from './src/screens/main/HeroesScreen';
import MatchesScreen from './src/screens/main/MatchesScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import PlayerProfileScreen from './src/screens/main/PlayerProfileScreen';
import MobaHeroesScreen from './src/screens/moba/MobaHeroesScreen'; // <--- IMPORT INI
import HeroDetailScreen from './src/screens/moba/HeroDetailScreen'; // <--- IMPORT INI
import MobaScheduleScreen from './src/screens/moba/MobaScheduleScreen';
import MobaRosterScreen from './src/screens/moba/MobaRosterScreen';
import MobaHomeScreen from './src/screens/moba/MobaHomeScreen';

// Tactical Screens
import FpsHomeScreen from './src/screens/valorant/FpsHomeScreen';
import ValorantDraftScreen from './src/screens/valorant/ValorantDraftScreen';
import ValorantMatchSim from './src/screens/valorant/ValorantMatchSim';
import AgentSelectScreen from './src/screens/valorant/AgentSelectScreen';
import MapPoolScreen from './src/screens/valorant/MapPoolScreen';
import TimeoutDemoScreen from './src/screens/demo/TimeoutDemoScreen';
import TacticalTeamScreen from './src/screens/valorant/TacticalTeamScreen'; // <--- Tambah Import
import AgentListScreen from './src/screens/valorant/AgentListScreen';
import AgentDetailScreen from './src/screens/valorant/AgentDetailScreen';
import MapTacticScreen from './src/screens/valorant/MapTacticScreen';
import TacticalMatchScreen from './src/screens/valorant/TacticalMatchScreen'; // <--- Tambah Import
import AgentPickScreen from './src/screens/valorant/AgentPickScreen'; // <--- Agent Pick Screen

// Setup Screen
import TeamSetupScreen from './src/screens/setup/TeamSetupScreen';

import TabBarIcon from './src/components/navigation/TabBarIcon';
import LoadingScreen from './src/components/common/LoadingScreen';

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

Animatable.initializeRegistryWithDefinitions({
  slideUp: { from: { translateY: 50, opacity: 0 }, to: { translateY: 0, opacity: 1 } },
});

// --- AUTH STACK ---
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: theme.colors.background.primary } }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// --- MOBA TABS ---
function MOBATabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon routeName={route.name} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: theme.colors.primary.main, // Biru
        tabBarInactiveTintColor: theme.colors.text.secondary,
        // Styling Header & TabBar disamakan dengan Tactical (tapi beda warna background header)
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary.main, // Header Biru
          elevation: 0,
          shadowOpacity: 0
        },
        headerTintColor: theme.colors.primary.contrast,
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 2 }
      })}
    >
      {/* TAB 1: HOME (Dashboard) */}
      <Tab.Screen
        name="MobaHome"
        component={MobaHomeScreen}
        options={{
          title: 'Team Headquarters',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-variant" size={24} color={color} />
        }}
      />

      {/* TAB 2: ROSTER (Team) */}
      <Tab.Screen
        name="MobaRoster"
        component={MobaRosterScreen}
        options={{ tabBarLabel: 'Roster' }}
      />

      {/* TAB LAINNYA */}
      <Tab.Screen name="Heroes" component={MobaHeroesScreen} options={{ tabBarLabel: 'Database' }} />
      <Tab.Screen name="Matches" component={MobaScheduleScreen} options={{ tabBarLabel: 'Schedule' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Manager' }} />
    </Tab.Navigator>
  );
}

// --- MOBA STACK ---
function MOBAStackContainer() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.primary.main }, headerTintColor: theme.colors.primary.contrast }}>
      <Stack.Screen
        name="MOBATabs"
        component={MOBATabs}
        options={{ headerShown: false }} // <--- MATIKAN DOUBLE HEADER
      />
      <Stack.Screen name="MobaDraft" component={MobaDraftScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MobaMatch" component={MobaMatchSim} options={{ headerShown: false }} />
      <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="MobaHeroes"
        component={MobaHeroesScreen}
        options={{ title: 'Hero Database', headerShown: true }}
      />
      <Stack.Screen
        name="HeroDetail"
        component={HeroDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// --- TACTICAL TABS ---
function TacticalTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon routeName={route.name} focused={focused} color={color} size={size} />
        ),
        // Warna Aksen tetap Merah/Ungu biar beda Divisi, tapi struktur layout SAMA
        tabBarActiveTintColor: '#ff4655', // Valorant Red
        tabBarInactiveTintColor: theme.colors.text.secondary,

        // [STYLING DISAMAKAN DENGAN MOBA]
        tabBarStyle: {
          backgroundColor: '#1a1a2e', // Samakan background
          borderTopColor: '#334155', // Samakan border
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60, // Samakan tinggi
        },
        headerStyle: {
          backgroundColor: '#ff4655', // Header merah (Tactical), tapi...
          elevation: 0, // Hilangkan shadow biar flat kayak MOBA
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.primary.contrast,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18, // Samakan ukuran font
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 2
        }
      })}
    >
      {/* [UPDATE DASHBOARD]
        1. Hapus 'headerShown: false' (Biar punya header kayak screen lain)
        2. Hapus 'display: none' (Biar navbar bawah muncul)
      */}
      <Tab.Screen
        name="FpsHome"
        component={FpsHomeScreen}
        options={{
          title: 'Command Center', // Judul Header
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />
        }}
      />

      <Tab.Screen name="Team" component={TacticalTeamScreen} options={{ tabBarLabel: 'Roster' }} />
      <Tab.Screen name="AgentList" component={AgentListScreen} options={{ tabBarLabel: 'Agents' }} />
      <Tab.Screen name="MapPool" component={MapPoolScreen} options={{ tabBarLabel: 'Maps' }} />
      <Tab.Screen name="TacticalMatches" component={TacticalMatchScreen} options={{ tabBarLabel: 'Schedule' }} />
    </Tab.Navigator>
  );
}

// --- TACTICAL STACK ---
function TacticalStackContainer({ onExit }) {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: theme.colors.accent.purple },
      headerTintColor: theme.colors.primary.contrast
    }}>

      {/* [UBAH BAGIAN INI] */}
      <Stack.Screen
        name="TacticalTabs"
        component={TacticalTabs}
        options={{
          headerShown: false // <--- UBAH JADI FALSE (Ini kuncinya)
        }}
      />

      {/* Screen lain biarkan false seperti sebelumnya */}
      <Stack.Screen name="AgentPickScreen" component={AgentPickScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ValorantDraft" component={ValorantDraftScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ValorantMatchSim" component={ValorantMatchSim} options={{ headerShown: false }} />
      <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AgentDetail" component={AgentDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MapTactic" component={MapTacticScreen} options={{ headerShown: false }} />

    </Stack.Navigator>
  );
}

// --- MAIN NAVIGATOR ---
function MainHubNavigator() {
  const { selectDivision } = useDivision();
  const { user } = useAuth();

  const hasTeam = user?.team_id != null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {!hasTeam ? (
        <Stack.Screen name="TeamSetup" component={TeamSetupScreen} />
      ) : (
        <Stack.Screen name="MainHub" component={MainHubScreen} />
      )}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="DivisionSelect">
        {(props) => (
          <DivisionSelectionScreen
            {...props}
            onDivisionSelect={(div) => {
              selectDivision(div);
              const target = props.route.params?.nextTarget;

              // --- LOGIKA MOBA ---
              if (div === 'moba') {
                if (target === 'Match') {
                  // [FIX] Arahkan ke Tab Schedule (Matches), BUKAN langsung simulasi
                  props.navigation.navigate('MobaStack', {
                    screen: 'MOBATabs',
                    params: { screen: 'Matches' }
                  });
                }
                else if (target === 'Team') {
                  props.navigation.navigate('MobaStack', {
                    screen: 'MOBATabs',
                    params: { screen: 'MobaRoster' }
                  });
                }
                else if (target === 'Training') {
                  props.navigation.navigate('MobaStack', {
                    screen: 'MOBATabs',
                    params: { screen: 'Heroes' }
                  });
                }
                else {
                  // Default ke Dashboard Home
                  props.navigation.navigate('MobaStack', {
                    screen: 'MOBATabs',
                    params: { screen: 'MobaHome' }
                  });
                }

                // --- LOGIKA TACTICAL (FPS) ---
              } else if (div === 'tactical' || div === 'valorant') {
                if (target === 'Match') {
                  // [FIX] Arahkan ke Tab Schedule (TacticalMatches)
                  props.navigation.navigate('TacticalStack', {
                    screen: 'TacticalTabs',
                    params: { screen: 'TacticalMatches' }
                  });
                }
                else if (target === 'Team') {
                  props.navigation.navigate('TacticalStack', {
                    screen: 'TacticalTabs',
                    params: { screen: 'Team' }
                  });
                }
                else {
                  // Default ke Dashboard Home
                  props.navigation.navigate('TacticalStack', {
                    screen: 'TacticalTabs',
                    params: { screen: 'FpsHome' }
                  });
                }
              }
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="MobaStack" component={MOBAStackContainer} />
      <Stack.Screen name="TacticalStack" component={TacticalStackContainer} />
    </Stack.Navigator>
  );
}

// --- ROOT ---
function RootNavigator() {
  const { user, loading: authLoading } = useAuth();
  const { isLoading: divLoading } = useDivision();

  if (authLoading || divLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {!user ? <AuthStack /> : <MainHubNavigator />}
    </NavigationContainer>
  );
}

// --- APP ENTRY POINT (FIXED) ---
export default function App() {
  return (
    // [FIX] SafeAreaProvider ditaruh DI LUAR SEMUA PROVIDER
    // Ini mencegah error "removeChild" di Web saat state loading berubah
    <SafeAreaProvider>
      <AuthProvider>
        <DivisionProvider>
          <WebSocketProvider>
            <StatusBar style="light" backgroundColor="#0f172a" />
            <RootNavigator />
          </WebSocketProvider>
        </DivisionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}