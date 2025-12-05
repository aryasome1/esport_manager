/**
 * Valorant Service
 * Handles Valorant-specific match operations and API calls
 */
import { apiClient } from './ApiClient';

export class ValorantService {
  constructor() {
    this.baseUrl = '/api/valorant';
  }

  // Create timeout call
  async createTimeoutCall(matchId, teamId, round, reason, tacticData = null) {
    try {
      const timeoutData = {
        match_id: matchId,
        team_id: teamId,
        round: round,
        reason: reason,
        tactic_data: tacticData,
        timestamp: new Date().toISOString()
      };

      const response = await apiClient.post(`${this.baseUrl}/timeouts`, timeoutData);
      return response.data;
    } catch (error) {
      console.error('Failed to create timeout:', error);
      throw error;
    }
  }

  // Simulate round outcome
  async simulateRoundOutcome(matchId, team1Agents, team2Agents, decisions = {}) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/simulate-round`, {
        match_id: matchId,
        team1_agents: team1Agents,
        team2_agents: team2Agents,
        decisions: decisions
      });
      return response.data;
    } catch (error) {
      console.error('Failed to simulate round:', error);
      // Return fallback data
      return {
        winner: Math.random() > 0.5 ? 'team1' : 'team2',
        roundTime: Math.floor(Math.random() * 60) + 30,
        kills: { 
          team1: Math.floor(Math.random() * 3), 
          team2: Math.floor(Math.random() * 3) 
        },
        economy: 'full_buy'
      };
    }
  }

  // Get match data
  async getMatch(matchId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/matches/${matchId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get match:', error);
      throw error;
    }
  }

  // Update match state
  async updateMatchState(matchId, state) {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/matches/${matchId}`, {
        state: state
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update match state:', error);
      throw error;
    }
  }
}