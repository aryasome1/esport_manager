/**
 * Main App.js for eSports Multi-Division Manager Frontend
 * Supports both MOBA and Tactical Shooter (Valorant) divisions
 * FULL VERSION: Restored all routes + Integrated DivisionContext
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

// Theme and styling
import { theme } from './src/theme/theme';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WebSocketProvider } from './src/contexts/WebSocketContext';
import { DivisionProvider, useDivision } from './src/contexts/DivisionContext'; // [NEW] Context Navigasi

// Screens - Auth
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Division Selection
import DivisionSelectionScreen from './src/screens/division/DivisionSelectionScreen';

// MOBA Division Screens (NEW UPDATED)
import MobaHomeScreen from './src/screens/moba/MobaHomeScreen';
import MobaDraftScreen from './src/screens/moba/MobaDraftScreen';
import MobaMatchSim from './src/screens/moba/MobaMatchSim';
// MOBA Screens (Legacy/Shared)
import TeamScreen from './src/screens/main/TeamScreen';
import HeroesScreen from './src/screens/main/HeroesScreen';
import MatchesScreen from './src/screens/main/MatchesScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';

// Tactical Shooter Division Screens
import HomeScreen from './src/screens/main/HomeScreen'; // Generic home used for Tactical
import ValorantDraftScreen from './src/screens/valorant/ValorantDraftScreen';
import ValorantMatchSim from './src/screens/valorant/ValorantMatchSim';
import AgentSelectScreen from './src/screens/valorant/AgentSelectScreen';
import MapPoolScreen from './src/screens/valorant/MapPoolScreen';
import TimeoutDemoScreen from './src/screens/demo/TimeoutDemoScreen';

// Universal Screens
import MatchReportScreen from './src/screens/main/MatchReportScreen';

// Navigation components
import TabBarIcon from './src/components/navigation/TabBarIcon';
import LoadingScreen from './src/components/common/LoadingScreen';

// Ignore specific warnings
LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ====================================================================
// [FIX] REGISTRASI ANIMASI CUSTOM (Wajib ada)
// ====================================================================
Animatable.initializeRegistryWithDefinitions({
  slideUp: {
    from: { translateY: 50, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
  },
});

// --- AUTH STACK NAVIGATOR ---
function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background.primary }
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// --- MOBA DIVISION NAVIGATOR ---

// MOBA Tab Navigator
function MOBATabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon
            routeName={route.name}
            focused={focused}
            color={color}
            size={size}
          />
        ),
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: '#1a1a2e', // Dark theme untuk eSports vibe
          borderTopColor: '#334155',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary.main,
        },
        headerTintColor: theme.colors.primary.contrast,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 2
        }
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={MobaHomeScreen} // Gunakan Screen Baru
        options={{ headerShown: false, tabBarLabel: 'Base' }}
      />
      <Tab.Screen 
        name="Team" 
        component={TeamScreen} 
        options={{ tabBarLabel: 'Roster' }}
      />
      <Tab.Screen 
        name="Heroes" 
        component={HeroesScreen} 
        options={{ tabBarLabel: 'Heroes' }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen} 
        options={{ tabBarLabel: 'Schedule' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Manager' }}
      />
    </Tab.Navigator>
  );
}

// MOBA Division Stack (Tidak butuh onExit prop karena dihandle di dalam screen via Context)
function MOBAStackContainer() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary.main },
        headerTintColor: theme.colors.primary.contrast,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="MOBATabs"
        component={MOBATabs}
        options={{
          headerShown: false, // Header dimatikan karena MobaHomeScreen punya header sendiri
        }}
      />
      {/* Layar Fullscreen Baru */}
      <Stack.Screen
        name="MobaDraft"
        component={MobaDraftScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MobaMatch"
        component={MobaMatchSim}
        options={{ headerShown: false }}
      />
      
      {/* Legacy Draft (untuk referensi/backup) */}
      <Stack.Screen
        name="LegacyDraft"
        component={DraftScreen} // Import DraftScreen lama Anda di sini jika perlu
        options={{ title: 'Draft Legacy' }}
      />
    </Stack.Navigator>
  );
}

// --- TACTICAL SHOOTER DIVISION NAVIGATOR ---

// Tactical Shooter Tab Navigator
function TacticalTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon
            routeName={route.name}
            focused={focused}
            color={color}
            size={size}
          />
        ),
        tabBarActiveTintColor: theme.colors.accent.purple,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.secondary,
          borderTopColor: theme.colors.border.light,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.accent.purple,
        },
        headerTintColor: theme.colors.primary.contrast,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 2
        }
      })}
    >
      <Tab.Screen 
        name="TacticalHome" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'HQ' }}
      />
      <Tab.Screen 
        name="AgentSelect" 
        component={AgentSelectScreen} 
        options={{ tabBarLabel: 'Agents' }}
      />
      <Tab.Screen 
        name="MapPool" 
        component={MapPoolScreen} 
        options={{ tabBarLabel: 'Maps' }}
      />
      <Tab.Screen 
        name="TacticalMatches" 
        component={MatchesScreen} 
        options={{ tabBarLabel: 'Matches' }}
      />
      <Tab.Screen 
        name="TimeoutDemo" 
        component={TimeoutDemoScreen} 
        options={{ tabBarLabel: 'Demo' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Tactical Shooter Division Stack with Exit control
function TacticalStackContainer({ onExit }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.accent.purple },
        headerTintColor: theme.colors.primary.contrast,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="TacticalTabs"
        component={TacticalTabs}
        options={{
          headerShown: true,
          title: 'Tactical Division',
          headerRight: () => (
            <TouchableOpacity onPress={onExit} style={{ marginRight: 12 }}>
              <Text style={{ color: theme.colors.primary.contrast, fontWeight: 'bold' }}>Exit</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="ValorantDraft"
        component={ValorantDraftScreen}
        options={({ navigation }) => ({
          title: 'Agent Selection',
          headerRight: () => (
            <TouchableOpacity onPress={onExit} style={{ marginRight: 12 }}>
              <Text style={{ color: theme.colors.primary.contrast, fontWeight: 'bold' }}>Exit</Text>
            </TouchableOpacity>
          ),
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 12 }}>
              <Text style={{ color: theme.colors.primary.contrast }}>Back</Text>
            </TouchableOpacity>
          )
        })}
      />
      <Stack.Screen name="ValorantMatchSim" component={ValorantMatchSim} options={{ title: 'Match Simulation', headerShown: false }} />
      <Stack.Screen name="AgentSelect" component={AgentSelectScreen} options={{ title: 'Agent Selection' }} />
      <Stack.Screen name="MapPool" component={MapPoolScreen} options={{ title: 'Map Pool' }} />
      <Stack.Screen name="TimeoutDemo" component={TimeoutDemoScreen} options={{ title: 'Timeout Feature Demo' }} />
    </Stack.Navigator>
  );
}

// --- ROOT NAVIGATOR (The Logic Center) ---
function RootNavigator() {
  const { user, loading: authLoading } = useAuth();
  
  // MENGGUNAKAN GLOBAL STATE DARI CONTEXT
  // Ini menggantikan logika manual AsyncStorage yang ada di kode lama
  const { division, isLoading: divLoading, selectDivision, exitDivision } = useDivision();

  if (authLoading || divLoading) {
    return <LoadingScreen />;
  }

  // Debugging log untuk memastikan state berubah
  console.log("Current User:", user ? "Logged In" : "Guest");
  console.log("Current Division:", division);

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : division === 'moba' ? (
        // MOBA tidak butuh prop onExit karena tombolnya ada di MobaHomeScreen yang pakai Context langsung
        <MOBAStackContainer />
      ) : division === 'valorant' ? (
        // Tactical masih butuh onExit karena tombolnya ada di Header StackContainer
        <TacticalStackContainer onExit={exitDivision} />
      ) : (
        // Kalau belum pilih, atau setelah tekan Exit, kembali ke sini
        <DivisionSelectionScreen onDivisionSelect={selectDivision} />
      )}
      
      {/* Universal Screen (di luar stack divisi agar bisa diakses global jika perlu) */}
      {/* Tapi untuk struktur yang benar, MatchReport biasanya ada di dalam stack masing-masing */}
    </NavigationContainer>
  );
}

// --- APP ENTRY POINT ---
export default function App() {
  return (
    <AuthProvider>
      {/* WRAPPER BARU: DivisionProvider */}
      {/* Ini wajib ada agar MobaHomeScreen bisa berkomunikasi dengan RootNavigator */}
      <DivisionProvider>
        <WebSocketProvider>
          <StatusBar style="light" backgroundColor="#0f172a" />
          <RootNavigator />
        </WebSocketProvider>
      </DivisionProvider>
    </AuthProvider>
  );
}