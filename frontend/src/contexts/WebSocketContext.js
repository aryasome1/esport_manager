/**
 * WebSocket Context
 * Provides real-time communication for matches
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);

  // Connect to WebSocket
  const connect = useCallback((url = null) => {
    const wsUrl = url || process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setSocket(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocket(null);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        Alert.alert('Connection Error', 'Failed to connect to match server');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      Alert.alert('Connection Error', 'Failed to establish connection');
    }
  }, []);

  // Connect to specific match
  const connectToMatch = useCallback((matchId) => {
    setCurrentMatch(matchId);
    const baseUrl = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    connect(`${baseUrl}/match/${matchId}`);
  }, [connect]);

  // Disconnect from match
  const disconnectFromMatch = useCallback(() => {
    if (socket) {
      socket.close();
      setCurrentMatch(null);
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Send message to server
  const sendMessage = useCallback((type, data) => {
    if (socket && isConnected) {
      try {
        socket.send(JSON.stringify({
          type: type,
          data: data,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket not connected');
    }
  }, [socket, isConnected]);

  // Send match message
  const sendMatchMessage = useCallback((message) => {
    sendMessage('match_update', message);
  }, [sendMessage]);

  // Handle incoming messages
  const handleMessage = (data) => {
    switch (data.type) {
      case 'match_update':
        console.log('Match update received:', data.data);
        // Handle match state updates
        break;
      case 'round_result':
        console.log('Round result:', data.data);
        // Handle round completion
        break;
      case 'timeout_called':
        console.log('Timeout called:', data.data);
        // Handle timeout notifications
        break;
      case 'agent_update':
        console.log('Agent update:', data.data);
        // Handle agent position updates
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const value = {
    socket,
    isConnected,
    currentMatch,
    connect,
    connectToMatch,
    disconnectFromMatch,
    sendMessage,
    sendMatchMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Default export for compatibility
export default WebSocketContext;