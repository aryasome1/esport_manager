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

// Tactical Screens
import HomeScreen from './src/screens/main/HomeScreen'; 
import ValorantDraftScreen from './src/screens/valorant/ValorantDraftScreen';
import ValorantMatchSim from './src/screens/valorant/ValorantMatchSim';
import AgentSelectScreen from './src/screens/valorant/AgentSelectScreen';
import MapPoolScreen from './src/screens/valorant/MapPoolScreen';
import TimeoutDemoScreen from './src/screens/demo/TimeoutDemoScreen';

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
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: { backgroundColor: theme.colors.primary.main },
        headerTintColor: theme.colors.primary.contrast,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 2 }
      })}
    >
      <Tab.Screen name="Team" component={TeamScreen} options={{ tabBarLabel: 'Roster' }} />
      <Tab.Screen name="Heroes" component={HeroesScreen} options={{ tabBarLabel: 'Heroes' }} />
      <Tab.Screen name="Matches" component={MatchesScreen} options={{ tabBarLabel: 'Schedule' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Manager' }} />
    </Tab.Navigator>
  );
}

// --- MOBA STACK ---
function MOBAStackContainer() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.primary.main }, headerTintColor: theme.colors.primary.contrast }}>
      <Stack.Screen name="MOBATabs" component={MOBATabs} options={{ headerShown: false }} />
      <Stack.Screen name="MobaDraft" component={MobaDraftScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MobaMatch" component={MobaMatchSim} options={{ headerShown: false }} />
      <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} options={{ headerShown: false }} />
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
        tabBarActiveTintColor: theme.colors.accent.purple,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: { backgroundColor: theme.colors.background.secondary, borderTopColor: theme.colors.border.light, height: 60 },
        headerStyle: { backgroundColor: theme.colors.accent.purple },
        headerTintColor: theme.colors.primary.contrast,
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Team" component={TeamScreen} options={{ tabBarLabel: 'Roster' }} />
      <Tab.Screen name="AgentSelect" component={AgentSelectScreen} options={{ tabBarLabel: 'Agents' }} />
      <Tab.Screen name="MapPool" component={MapPoolScreen} options={{ tabBarLabel: 'Maps' }} />
      <Tab.Screen name="TacticalMatches" component={MatchesScreen} options={{ tabBarLabel: 'Matches' }} />
      <Tab.Screen name="TimeoutDemo" component={TimeoutDemoScreen} options={{ tabBarLabel: 'Demo' }} />
    </Tab.Navigator>
  );
}

// --- TACTICAL STACK ---
function TacticalStackContainer({ onExit }) {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.accent.purple }, headerTintColor: theme.colors.primary.contrast }}>
      <Stack.Screen name="TacticalTabs" component={TacticalTabs} options={{ headerShown: true, title: 'Tactical Division', headerRight: () => (
        <TouchableOpacity onPress={onExit} style={{ marginRight: 12 }}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Exit</Text></TouchableOpacity>
      )}} />
      <Stack.Screen name="ValorantDraft" component={ValorantDraftScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ValorantMatchSim" component={ValorantMatchSim} options={{ headerShown: false }} />
      <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// --- MAIN NAVIGATOR ---
function MainHubNavigator() {
  const { selectDivision } = useDivision();
  const { user } = useAuth();

  // DEBUG LOG
  console.log("Rendering MainHubNavigator. User:", user?.username, "TeamID:", user?.team_id);

  const hasTeam = user?.team_id != null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      {!hasTeam ? (
        <Stack.Screen name="TeamSetup" component={TeamSetupScreen} />
      ) : (
        <Stack.Screen name="MainHub" component={MainHubScreen} />
      )}

      <Stack.Screen name="DivisionSelect">
        {(props) => (
          <DivisionSelectionScreen 
            {...props} 
            onDivisionSelect={(div) => {
                selectDivision(div);
                const target = props.route.params?.nextTarget;
                
                if (div === 'moba') {
                    if (target === 'Match') props.navigation.navigate('MobaStack', { screen: 'MobaMatch' });
                    else if (target === 'Team') props.navigation.navigate('MobaStack', { screen: 'MOBATabs', params: { screen: 'Team' } });
                    else if (target === 'Training') props.navigation.navigate('MobaStack', { screen: 'MOBATabs', params: { screen: 'Heroes' } });
                    else props.navigation.navigate('MobaStack', { screen: 'MOBATabs', params: { screen: 'Team' } });
                } else if (div === 'valorant') {
                    if (target === 'Match') props.navigation.navigate('TacticalStack', { screen: 'ValorantMatchSim' });
                    else props.navigation.navigate('TacticalStack', { screen: 'TacticalTabs', params: { screen: 'Team' } });
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