import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Dimensions,
  Pressable, ScrollView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
// Pastikan area map kotak sempurna
const MAP_SIZE = width - 32; 

const MARKER_TYPES = [
    { id: 'smoke', icon: 'cloud', color: '#cbd5e1', label: 'Smoke' },
    { id: 'flash', icon: 'flash', color: '#fbbf24', label: 'Flash' },
    { id: 'enemy', icon: 'close-circle', color: '#ff4655', label: 'Enemy' },
    { id: 'move', icon: 'arrow-right-thick', color: '#22c55e', label: 'Path' },
    { id: 'molly', icon: 'fire', color: '#f97316', label: 'Molly' },
];

export default function MapTacticScreen({ route, navigation }) {
  const { map } = route.params;
  const insets = useSafeAreaInsets();
  
  const [markers, setMarkers] = useState([]);
  const [selectedTool, setSelectedTool] = useState('enemy');

  const handleMapTap = (event) => {
    // Ambil koordinat dari nativeEvent
    // Gunakan fallback layerX/offsetX untuk support Web & Mobile sekaligus
    const e = event.nativeEvent;
    const x = e.locationX !== undefined ? e.locationX : e.layerX;
    const y = e.locationY !== undefined ? e.locationY : e.layerY;

    // Safety check biar gak NaN
    if (x === undefined || y === undefined) return;

    const newMarker = {
        id: Date.now(),
        x: x,
        y: y,
        type: selectedTool
    };
    setMarkers([...markers, newMarker]);
  };

  const undoLast = () => {
    setMarkers(prev => prev.slice(0, -1));
  };

  const clearAll = () => {
    setMarkers([]);
  };

  const getToolIcon = (type) => {
    const tool = MARKER_TYPES.find(t => t.id === type);
    return tool ? { icon: tool.icon, color: tool.color } : { icon: 'circle', color: '#fff' };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{map.displayName.toUpperCase()} STRAT</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        {/* Toolbar */}
        <View style={styles.toolbarContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar}>
                {MARKER_TYPES.map((tool) => (
                    <TouchableOpacity
                        key={tool.id}
                        style={[
                            styles.toolBtn, 
                            selectedTool === tool.id && styles.activeToolBtn,
                            { borderColor: selectedTool === tool.id ? tool.color : '#334155' }
                        ]}
                        onPress={() => setSelectedTool(tool.id)}
                    >
                        <MaterialCommunityIcons name={tool.icon} size={24} color={tool.color} />
                        <Text style={[styles.toolLabel, { color: tool.color }]}>{tool.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* --- MAP BOARD AREA --- */}
        <View style={styles.boardWrapper}>
            <View style={[styles.boardContainer, { width: MAP_SIZE, height: MAP_SIZE }]}>
                
                {/* LAYER 1: IMAGE (Background) */}
                <Image 
                    source={{ uri: map.displayIcon }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover" 
                />

                {/* LAYER 2: MARKERS (Visual Only) */}
                {/* pointerEvents="none" memastikan layer ini tembus pandang klik-nya */}
                <View style={[styles.markerLayer, { width: MAP_SIZE, height: MAP_SIZE }]} pointerEvents="none">
                    {markers.map((marker) => {
                        const style = getToolIcon(marker.type);
                        const ICON_SIZE = 24;
                        return (
                            <View 
                                key={marker.id}
                                style={[
                                    styles.marker,
                                    { 
                                        left: marker.x - (ICON_SIZE / 2), 
                                        top: marker.y - (ICON_SIZE / 2),
                                        width: ICON_SIZE,
                                        height: ICON_SIZE,
                                    }
                                ]}
                            >
                                <MaterialCommunityIcons name={style.icon} size={ICON_SIZE} color={style.color} />
                            </View>
                        );
                    })}
                </View>

                {/* LAYER 3: TOUCH OVERLAY (Invisible) */}
                {/* Ini layer khusus buat nangkep klik. Paling atas. */}
                <Pressable 
                    style={styles.touchOverlay}
                    onPress={handleMapTap}
                />
            
            </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={undoLast}>
                <Ionicons name="arrow-undo" size={20} color="#fff" />
                <Text style={styles.btnText}>UNDO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={clearAll}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>CLEAR</Text>
            </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>TACTICAL NOTE</Text>
            <Text style={styles.noteText}>
                Tap anywhere on the tactical map above to place a marker. 
                Use this board to plan executes or defensive setups.
            </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },
  scrollContent: { paddingBottom: 40 },

  // Toolbar
  toolbarContainer: {
    paddingVertical: 16,
    backgroundColor: '#0f172a',
  },
  toolbar: {
    paddingHorizontal: 16,
    gap: 12,
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#1e293b',
    width: 65,
    height: 65,
  },
  activeToolBtn: {
    backgroundColor: '#334155',
  },
  toolLabel: { fontSize: 9, fontWeight: 'bold', marginTop: 4 },

  // Map Board Stack
  boardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  boardContainer: {
    position: 'relative', // Penting buat absolute children
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: '#1a202c',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  // Layers
  markerLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10, // Di atas gambar
  },
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 20, // Paling atas, transparan
    // backgroundColor: 'rgba(255,0,0,0.2)' // Uncomment buat debug area klik
  },

  marker: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  clearBtn: { backgroundColor: '#be123c' },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },

  // Notes
  noteCard: {
    margin: 20,
    padding: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4655',
  },
  noteTitle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  noteText: { color: '#cbd5e1', fontSize: 12 },
});