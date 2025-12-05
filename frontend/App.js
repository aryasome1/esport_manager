/**
 * Main App.js for eSports Multi-Division Manager Frontend
 * Supports both MOBA and Tactical Shooter (Valorant) divisions
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

// Theme and styling
import { theme } from './src/theme/theme';
import { AuthProvider } from './src/contexts/AuthContext';
import { WebSocketProvider } from './src/contexts/WebSocketContext';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Division Selection
import DivisionSelectionScreen from './src/screens/division/DivisionSelectionScreen';

// MOBA Division Screens
import HomeScreen from './src/screens/main/HomeScreen';
import TeamScreen from './src/screens/main/TeamScreen';
import HeroesScreen from './src/screens/main/HeroesScreen';
import DraftScreen from './src/screens/main/DraftScreen';
import MatchesScreen from './src/screens/main/MatchesScreen';

// Tactical Shooter Division Screens
import ValorantDraftScreen from './src/screens/valorant/ValorantDraftScreen';
import ValorantMatchSim from './src/screens/valorant/ValorantMatchSim';
import AgentSelectScreen from './src/screens/valorant/AgentSelectScreen';
import MapPoolScreen from './src/screens/valorant/MapPoolScreen';
import TimeoutDemoScreen from './src/screens/demo/TimeoutDemoScreen';

// Universal Screens
import ProfileScreen from './src/screens/main/ProfileScreen';
import MatchReportScreen from './src/screens/main/MatchReportScreen';

// Navigation components
import TabBarIcon from './src/components/navigation/TabBarIcon';
import LoadingScreen from './src/components/common/LoadingScreen';

// Services
import { DivisionService } from './src/services/DivisionService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Auth Stack Navigator
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

// MOBA Division Stack with Exit control
function MOBAStackContainer({ onExit }) {
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
          headerShown: true,
          title: 'MOBA Division',
          headerRight: () => (
            <TouchableOpacity onPress={onExit} style={{ marginRight: 12 }}>
              <Text style={{ color: theme.colors.primary.contrast, fontWeight: 'bold' }}>Exit</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="Draft"
        component={DraftScreen}
        options={({ navigation }) => ({
          title: 'MOBA Draft',
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
    </Stack.Navigator>
  );
}

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
          backgroundColor: theme.colors.background.secondary,
          borderTopColor: theme.colors.border.light,
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
        component={HomeScreen} 
        options={{ tabBarLabel: 'MOBA Home' }}
      />
      <Tab.Screen 
        name="Team" 
        component={TeamScreen} 
        options={{ tabBarLabel: 'Team' }}
      />
      <Tab.Screen 
        name="Heroes" 
        component={HeroesScreen} 
        options={{ tabBarLabel: 'Heroes' }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen} 
        options={{ tabBarLabel: 'Matches' }}
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
        options={{ tabBarLabel: 'Tactical Home' }}
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

// Main App Navigator
function AppNavigator({ onExitDivision, selectedDivision }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {selectedDivision === 'moba' ? (
        <Stack.Screen name="MOBA">
          {() => <MOBAStackContainer onExit={onExitDivision} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Tactical">
          {() => <TacticalStackContainer onExit={onExitDivision} />}
        </Stack.Screen>
      )}
      <Stack.Screen
        name="MatchReport"
        component={MatchReportScreen}
        options={{
          headerShown: true,
          title: 'Match Report',
          headerStyle: { backgroundColor: theme.colors.background.primary },
          headerTintColor: theme.colors.text.primary,
        }}
      />
    </Stack.Navigator>
  );
}

// Root App Navigator
function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      console.log('Initializing app...');
      
      // Check authentication
      const token = await AsyncStorage.getItem('auth_token');
      console.log('Token check:', token ? 'Token found' : 'No token');
      if (token) {
        // Defer auth verification to AuthProvider (it calls /api/auth/me)
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      // Load selected division
      const savedDivision = await AsyncStorage.getItem('selectedDivision');
      console.log('Saved division:', savedDivision);
      if (savedDivision) {
        setSelectedDivision(savedDivision);
      }

    } catch (error) {
      console.error('App initialization failed:', error);
    } finally {
      console.log('App initialization complete');
      setIsLoading(false);
    }
  };

  const handleLogin = async (token) => {
    setIsAuthenticated(true);
    // Navigate to division selection after login
  };

  const handleLogout = async () => {
    try {
      // AuthContext will handle server-side logout
      await AsyncStorage.removeItem('selectedDivision');
      setIsAuthenticated(false);
      setSelectedDivision(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDivisionSelect = async (division) => {
    try {
      await AsyncStorage.setItem('selectedDivision', division);
      setSelectedDivision(division);
    } catch (error) {
      console.error('Failed to save division selection:', error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  try {
    return (
      <AuthProvider onLogin={handleLogin} onLogout={handleLogout}>
        <WebSocketProvider>
          <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
          <NavigationContainer
            onStateChange={async () => {
              // Keep selectedDivision in sync with AsyncStorage to allow exit from child screens
              const sd = await AsyncStorage.getItem('selectedDivision');
              if (!sd && selectedDivision) {
                setSelectedDivision(null);
              }
            }}
          >
            {isAuthenticated ? (
              selectedDivision ? (
                <AppNavigator
                  selectedDivision={selectedDivision}
                  onExitDivision={async () => {
                    await AsyncStorage.removeItem('selectedDivision');
                    setSelectedDivision(null);
                  }}
                />
              ) : (
                <DivisionSelectionScreen onDivisionSelect={handleDivisionSelect} />
              )
            ) : (
              <AuthStack />
            )}
          </NavigationContainer>
        </WebSocketProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error('Render error:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ color: '#000', fontSize: 16 }}>Error loading app: {error.message}</Text>
      </View>
    );
  }
}

// Register a custom animation used across the app (e.g., "slideUp")
Animatable.initializeRegistryWithDefinitions({
  slideUp: {
    from: { transform: [{ translateY: 50 }], opacity: 0 },
    to:   { transform: [{ translateY: 0 }],  opacity: 1 }
  }
});

export default function App() {
  // Add error boundary wrapper
  return (
    <ErrorBoundary>
      <RootNavigator />
    </ErrorBoundary>
  );
}

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#000' }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ backgroundColor: '#6366F1', padding: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}