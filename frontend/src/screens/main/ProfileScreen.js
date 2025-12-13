import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform // Pastikan Platform diimport
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext'; 
import { useDivision } from '../../contexts/DivisionContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { currentDivision } = useDivision();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // [LOGIC] Fungsi Inti Logout
  const performLogout = async () => {
    console.log('[PROFILE] Executing Logout...');
    try {
      setIsLoggingOut(true);
      await logout();
      // AuthContext akan otomatis melempar ke Login screen karena user jadi null
    } catch (error) {
      console.error("[PROFILE] Logout Error:", error);
    } finally {
      if (mounted) setIsLoggingOut(false);
    }
  };
  
  // Variable untuk mencegah memory leak saat unmount
  let mounted = true;
  React.useEffect(() => {
    return () => { mounted = false };
  }, []);

  // [FIX] Handle Logout Sesuai Platform
  const handleLogout = () => {
    console.log('[PROFILE] Logout button pressed');

    if (Platform.OS === 'web') {
      // --- KHUSUS WEB: Gunakan window.confirm ---
      // Alert.alert sering macet di web
      if (window.confirm("Are you sure you want to sign out?")) {
        performLogout();
      }
    } else {
      // --- KHUSUS MOBILE: Gunakan Alert Native ---
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Sign Out", 
            style: "destructive", 
            onPress: performLogout
          }
        ]
      );
    }
  };

  const handleRosterNavigation = () => {
    if (currentDivision === 'moba') {
      navigation.navigate('MobaStack', { 
        screen: 'MOBATabs', 
        params: { screen: 'MobaRoster' } 
      });
    } else {
      navigation.navigate('TacticalStack', { 
        screen: 'TacticalTabs', 
        params: { screen: 'Team' } 
      });
    }
  };

  const MenuItem = ({ icon, title, subtitle, onPress, isDestructive }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, isDestructive && styles.destructiveIconContainer]}>
        <Ionicons name={icon} size={22} color={isDestructive ? '#ef4444' : '#facc15'} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, isDestructive && styles.destructiveText]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {isLoggingOut && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#facc15" />
          <Text style={styles.loadingText}>Signing out...</Text>
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Settings</Text>
          <View style={{width: 24}} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(30, 41, 59, 0.8)', 'rgba(30, 41, 59, 0.4)']}
              style={styles.profileGradient}
            >
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  style={styles.avatarCircle}
                >
                  <Text style={styles.avatarText}>
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'M'}
                  </Text>
                </LinearGradient>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.userName}>
                  {user?.username || 'Guest Manager'}
                </Text>
                <Text style={styles.userEmail}>
                  {user?.email || 'manager@esports.gg'}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>HEAD COACH</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.sectionHeader}>TEAM MANAGEMENT</Text>
          <View style={styles.menuContainer}>
            <MenuItem 
              icon="people-outline" 
              title="My Roster" 
              subtitle={`Manage ${currentDivision ? currentDivision.toUpperCase() : 'Active'} Team`}
              onPress={handleRosterNavigation}
            />
            <MenuItem 
              icon="trophy-outline" 
              title="Achievements" 
              subtitle="Trophies & Awards"
              onPress={() => {}}
            />
          </View>

          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <View style={styles.menuContainer}>
            <MenuItem 
              icon="notifications-outline" 
              title="Notifications" 
              subtitle="Match alerts"
              onPress={() => {}}
            />
            <MenuItem 
              icon="shield-checkmark-outline" 
              title="Security" 
              subtitle="Password & 2FA"
              onPress={() => {}}
            />
            
            <MenuItem 
              icon="log-out-outline" 
              title="Sign Out" 
              isDestructive
              onPress={handleLogout}
            />
          </View>

          <Text style={styles.versionText}>Esport Manager v1.0.4</Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  safeArea: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    padding: 5,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  profileCard: {
    borderRadius: 20,
    marginBottom: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  roleText: {
    color: '#facc15',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 10,
    marginLeft: 5,
    letterSpacing: 1,
  },
  menuContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  destructiveIconContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  destructiveText: {
    color: '#ef4444',
  },
  versionText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 30,
  }
});

export default ProfileScreen;