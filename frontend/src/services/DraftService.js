/**
 * Draft Service
 * Handles draft-related API calls
 */
import { apiClient } from './ApiClient';

export class DraftService {
  // Get draft state
  static async getDraftState(sessionToken) {
    try {
      const response = await apiClient.get(`/api/draft/state/${sessionToken}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get draft state:', error);
      // Return mock data for development
      return {
        session: {
          id: 1,
          phase: 'pick',
          current_team_id: 1,
        },
        available_heroes: [],
        banned_heroes: [],
        team1_lineup: {},
        team2_lineup: {},
      };
    }
  }

  // Make a pick or ban
  static async makePick(pickData, sessionToken) {
    try {
      const response = await apiClient.post(`/api/draft/pick/${sessionToken}`, pickData);
      return response.data;
    } catch (error) {
      console.error('Failed to make pick:', error);
      throw error;
    }
  }
}

