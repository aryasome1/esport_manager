import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DivisionContext = createContext();

export const useDivision = () => {
  const context = useContext(DivisionContext);
  if (!context) {
    throw new Error('useDivision must be used within a DivisionProvider');
  }
  return context;
};

export const DivisionProvider = ({ children }) => {
  const [division, setDivision] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load divisi yang tersimpan saat aplikasi dibuka
  useEffect(() => {
    const loadDivision = async () => {
      try {
        const savedDivision = await AsyncStorage.getItem('selectedDivision');
        console.log('[DivisionContext] Loaded division:', savedDivision);
        if (savedDivision) setDivision(savedDivision);
      } catch (e) {
        console.error('[DivisionContext] Error loading division:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadDivision();
  }, []);

  // Fungsi Masuk Divisi
  const selectDivision = async (div) => {
    try {
      console.log('[DivisionContext] Selecting division:', div);
      await AsyncStorage.setItem('selectedDivision', div);
      setDivision(div);
    } catch (e) {
      console.error('[DivisionContext] Error selecting division:', e);
    }
  };

  // Fungsi Keluar Divisi (Back to Menu)
  const exitDivision = async () => {
    try {
      console.log('[DivisionContext] Exiting division...');
      await AsyncStorage.removeItem('selectedDivision');
      setDivision(null); // State menjadi null -> App.js akan otomatis merender ulang ke layar seleksi
    } catch (e) {
      console.error('[DivisionContext] Error exiting division:', e);
    }
  };

  return (
    <DivisionContext.Provider value={{ division, isLoading, selectDivision, exitDivision }}>
      {children}
    </DivisionContext.Provider>
  );
};