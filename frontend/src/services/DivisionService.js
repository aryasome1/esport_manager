/**
 * Division Service
 * Handles division-related operations and management
 */
import { apiClient } from './ApiClient';

export class DivisionService {
  constructor() {
    this.baseUrl = '/api/divisions';
  }

  // --- CORE METHODS ---

  /**
   * Get all available divisions with complete UI data (Images, Colors, Stats)
   * This is a STATIC method called directly by the UI
   */
  static async getAvailableDivisions() {
    // Kita return data statis langsung biar cepat dan tidak error dependency
    return [
      {
        id: 'moba',
        type: 'moba',
        name: 'MOBA DIVISION',
        description: '5v5 Strategic Battle Arena',
        summary: 'Classic 5v5 battlefield focusing on team synergy and objective control.',
        // Gambar Fantasi/Peta untuk MOBA
        image: 'https://img.freepik.com/free-vector/hand-drawn-fantasy-map-mountains_23-2149506472.jpg?w=1060', 
        primaryColor: '#3b82f6',
        features: [
          { name: 'Hero Drafting', enabled: true },
          { name: 'Lane Strategy', enabled: true },
          { name: 'Coach System', enabled: true },
          { name: 'Ranked Ladder', enabled: true },
        ],
        game_modes: ['Ranked', 'Classic', 'Brawl'],
        stats: { 
          players_online: 1250, 
          active_matches: 45,
          avg_match_duration: '18 min' 
        },
        isActive: true
      },
      {
        id: 'valorant',
        type: 'tactical', // Backend uses 'tactical', Frontend UI calls it 'FPS DIVISION'
        name: 'FPS DIVISION',
        description: '5v5 Tactical Shooter',
        summary: 'High-stakes tactical shooter emphasizing aim, utility usage, and map control.',
        // Gambar Sci-fi/Cyberpunk untuk FPS
        image: 'https://img.freepik.com/free-vector/cyberpunk-futuristic-city-background_23-2148798939.jpg?w=1060',
        primaryColor: '#8b5cf6',
        features: [
          { name: 'Agent Selection', enabled: true },
          { name: 'Map Control', enabled: true },
          { name: 'Economy System', enabled: true },
          { name: 'Tactical Timeouts', enabled: true },
        ],
        game_modes: ['Competitive', 'Unrated', 'Spike Rush'],
        stats: { 
          players_online: 2100, 
          active_matches: 80,
          avg_match_duration: '35 min'
        },
        isActive: true
      }
    ];
  }

  // --- API METHODS (Untuk interaksi ke Backend nanti) ---

  // Get division by ID
  async getDivisionById(divisionId) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${divisionId}/overview`);
      return response.data;
    } catch (error) {
      console.error('Failed to get division:', error);
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
}