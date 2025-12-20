/**
 * PlayerAvatars.js
 * Centralized utility to map Player Roles to Avatar Images.
 * Supports both MOBA and TACTICAL divisions.
 */

// Import semua gambar secara statis (React Native requirement)
const avatarImages = {
  // --- MOBA DIVISION ---
  'jungle': require('../../assets/avatars/avatar_jungle.jpg'),
  'mid': require('../../assets/avatars/avatar_mid.jpg'),
  'roam': require('../../assets/avatars/avatar_roam.jpg'),
  'gold': require('../../assets/avatars/avatar_gold.jpg'),
  'exp': require('../../assets/avatars/avatar_exp.jpg'),

  // --- TACTICAL DIVISION ---
  // Pastikan file-file ini ada di folder assets/avatars/
  'duelist': require('../../assets/avatars/avatar_duelist.jpg'),
  'initiator': require('../../assets/avatars/avatar_initiator.jpg'),
  'sentinel': require('../../assets/avatars/avatar_sentinel.jpg'),
  'controller': require('../../assets/avatars/avatar_controller.jpg'),
  
  // --- DEFAULT / FALLBACK ---
  // Gunakan favicon atau gambar placeholder profile default
  'default': require('../../assets/favicon.png'), 
};

/**
 * Returns the require() object for an avatar based on role string.
 * Case-insensitive and handles partial matches (e.g., "Mid Laner" -> mid).
 * * @param {string} roleRaw - The role string from database (e.g., "Jungler", "Duelist")
 * @returns {number} - The image source ID
 */
export const getPlayerAvatar = (roleRaw) => {
  if (!roleRaw) return avatarImages['default'];

  // 1. Normalisasi string: lowercase & hilangkan spasi berlebih
  const roleKey = roleRaw.toString().toLowerCase().trim();

  // 2. Logic Mapping (Priority Check)
  
  // --- MOBA CHECKS ---
  if (roleKey.includes('jung')) return avatarImages['jungle']; // Matches: Jungler, Jungle
  if (roleKey.includes('mid')) return avatarImages['mid'];     // Matches: Midlane, Mid Laner
  if (roleKey.includes('roam')) return avatarImages['roam'];   // Matches: Roamer, Roaming
  if (roleKey.includes('gold')) return avatarImages['gold'];   // Matches: Goldlane, Gold Laner
  if (roleKey.includes('exp')) return avatarImages['exp'];     // Matches: Explane, Exp Laner

  // --- TACTICAL CHECKS ---
  if (roleKey.includes('duel')) return avatarImages['duelist'];     // Matches: Duelist
  if (roleKey.includes('init')) return avatarImages['initiator'];   // Matches: Initiator
  if (roleKey.includes('sent')) return avatarImages['sentinel'];    // Matches: Sentinel
  if (roleKey.includes('cont')) return avatarImages['controller'];  // Matches: Controller, Smoker

  // 3. Fallback jika tidak ada yang cocok
  return avatarImages['default'];
};