/**
 * Division Service
 * Handles division-related operations and management
 */
import { apiClient } from './ApiClient';

export class DivisionService {
  constructor() {
    this.baseUrl = '/api/divisions';
  }

  // Get all available divisions
  async getAllDivisions() {
    // Use external APIs as the data sources for division availability
    // We don't need the backend route here; return a static list that references the APIs
    return [
      {
        id: 'moba',
        name: 'MOBA Division',
        description: 'Mobile Legends style MOBA gameplay',
        icon: '⚔️',
        color: '#10B981',
        games: ['Mobile Legends'],
        externalApi: {
          name: 'api-mobilelegends',
          repo: 'https://github.com/ridwaanhall/api-mobilelegends'
        },
        isActive: true
      },
      {
        id: 'valorant',
        name: 'Valorant Division',
        description: 'Tactical FPS gameplay (Valorant)',
        icon: '🎯',
        color: '#8B5CF6',
        games: ['Valorant'],
        externalApi: {
          name: 'valorant-api',
          repo: 'https://github.com/Grenish/valorant-api'
        },
        isActive: true
      }
    ];
  }

  // Static method to get available divisions (for compatibility)
  static async getAvailableDivisions() {
    const service = new DivisionService();
    const divisions = await service.getAllDivisions();
    // Transform to match expected format
    return divisions.map(div => ({
      id: div.id,
      type: div.id === 'moba' ? 'moba' : 'tactical',
      name: div.name,
      description: div.description,
      summary: div.description,
      features: [
        { name: 'Team Management', enabled: true },
        { name: 'Match Simulation', enabled: true },
        { name: 'Draft System', enabled: true },
        { name: 'Player Stats', enabled: true },
      ],
      stats: {
        players_online: 0,
        active_matches: 0,
        avg_match_duration: '30 min',
      },
      game_modes: div.games || [],
    }));
  }

  // Get division by ID
  async getDivisionById(divisionId) {
    try {
      // Use backend overview endpoint
      const response = await apiClient.get(`${this.baseUrl}/${divisionId}/overview`);
      return response.data;
    } catch (error) {
      console.error('Failed to get division:', error);
      throw error;
    }
  }

  // Create new division
  async createDivision(divisionData) {
    try {
      const response = await apiClient.post(this.baseUrl, divisionData);
      return response.data;
    } catch (error) {
      console.error('Failed to create division:', error);
      throw error;
    }
  }

  // Update division
  async updateDivision(divisionId, divisionData) {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/${divisionId}`, divisionData);
      return response.data;
    } catch (error) {
      console.error('Failed to update division:', error);
      throw error;
    }
  }

  // Delete division
  async deleteDivision(divisionId) {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/${divisionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete division:', error);
      throw error;
    }
  }

  // Get user's selected division
  async getUserDivision() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/user/selected`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user division:', error);
      // Return null if no division selected
      return null;
    }
  }

  // Set user's selected division
  async setUserDivision(divisionId) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/user/select`, {
        division_id: divisionId
      });
      return response.data;
    } catch (error) {
      console.error('Failed to set user division:', error);
      throw error;
    }
  }

  // Get division stats
  async getDivisionStats(divisionId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${divisionId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get division stats:', error);
      // Return fallback stats
      return {
        totalPlayers: 0,
        activeMatches: 0,
        totalMatches: 0,
        averageRating: 0,
        recentActivity: []
      };
    }
  }

  // Get division leaderboard
  async getDivisionLeaderboard(divisionId, limit = 10) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${divisionId}/leaderboard?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      // Return fallback data
      return [];
    }
  }

  // Get division games
  async getDivisionGames(divisionId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${divisionId}/games`);
      return response.data;
    } catch (error) {
      console.error('Failed to get division games:', error);
      throw error;
    }
  }

  // Join division
  async joinDivision(divisionId) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${divisionId}/join`);
      return response.data;
    } catch (error) {
      console.error('Failed to join division:', error);
      throw error;
    }
  }

  // Leave division
  async leaveDivision(divisionId) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/${divisionId}/leave`);
      return response.data;
    } catch (error) {
      console.error('Failed to leave division:', error);
      throw error;
    }
  }

  // Get division tournaments
  async getDivisionTournaments(divisionId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${divisionId}/tournaments`);
      return response.data;
    } catch (error) {
      console.error('Failed to get tournaments:', error);
      // Return fallback data
      return [];
    }
  }

  // Check if division is active
  async isDivisionActive(divisionId) {
    try {
      const divisions = await this.getAllDivisions();
      const division = divisions.find(d => d.id === divisionId);
      return division ? division.isActive : false;
    } catch (error) {
      console.error('Failed to check division status:', error);
      return false;
    }
  }

  // Get division settings
  async getDivisionSettings(divisionId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${divisionId}/settings`);
      return response.data;
    } catch (error) {
      console.error('Failed to get division settings:', error);
      // Return default settings
      return {
        maxTeamSize: 5,
        minTeamSize: 1,
        allowedGameModes: ['ranked', 'casual', 'tournament'],
        skillRatingEnabled: true,
        divisionTiers: ['bronze', 'silver', 'gold', 'platinum', 'diamond']
      };
    }
  }
}