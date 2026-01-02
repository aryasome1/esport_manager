/**
 * PlayerAvatars.js
 * Centralized utility to map Player Roles to Avatar Images.
 * Supports both MOBA and TACTICAL divisions.
 */

// Import semua gambar secara statis (React Native requirement)
const avatarImages = [
  // --- MOBA DIVISION ---
  require('../../assets/avatars/avatar_jungle.jpg'),
  require('../../assets/avatars/avatar_mid.jpg'),
  require('../../assets/avatars/avatar_roam.jpg'),
  require('../../assets/avatars/avatar_gold.jpg'),
  require('../../assets/avatars/avatar_exp.jpg'),

  // --- TACTICAL DIVISION ---
  require('../../assets/avatars/avatar_duelist.jpg'),
  require('../../assets/avatars/avatar_initiator.jpg'),
  require('../../assets/avatars/avatar_sentinel.jpg'),
  require('../../assets/avatars/avatar_controller.jpg'),
];

const defaultAvatar = require('../../assets/favicon.png');

/**
 * Returns the require() object for an avatar based on Player ID.
 * Assigns avatars deterministically using Modulo.
 * @param {number|string} playerId - The unique ID of the player
 * @returns {number} - The image source ID
 */
export const getPlayerAvatar = (playerId) => {
  if (!playerId) return defaultAvatar;

  // Ensure numeric ID
  const id = parseInt(playerId, 10);

  if (isNaN(id)) {
    // Fallback for non-numeric IDs (hashed string or simple fallback)
    return defaultAvatar;
  }

  // Modulo assignment: ID % TotalImages
  const index = Math.abs(id) % avatarImages.length;
  return avatarImages[index];
};