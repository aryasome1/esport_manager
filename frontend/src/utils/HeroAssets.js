/**
 * HeroAssets.js
 * Maps Hero IDs to local asset require statements.
 * Naming convention: hero_{id}.png in assets/heroes/
 */

// Pre-define the map because Metro bundler needs static requires
// We assume IDs 1-20 based on the seed data.
// In a real app with many heroes, you might import all efficiently or use a different strategy.

const heroAssets = {
    1: require('../../assets/heroes/hero_1.png'),
    2: require('../../assets/heroes/hero_2.png'),
    3: require('../../assets/heroes/hero_3.png'),
    4: require('../../assets/heroes/hero_4.png'),
    5: require('../../assets/heroes/hero_5.png'),
    6: require('../../assets/heroes/hero_6.png'),
    7: require('../../assets/heroes/hero_7.png'),
    8: require('../../assets/heroes/hero_8.png'),
    9: require('../../assets/heroes/hero_9.png'),
    10: require('../../assets/heroes/hero_10.png'),
    11: require('../../assets/heroes/hero_11.png'),
    12: require('../../assets/heroes/hero_12.png'),
    13: require('../../assets/heroes/hero_13.png'),
    14: require('../../assets/heroes/hero_14.png'),
    15: require('../../assets/heroes/hero_15.png'),
    16: require('../../assets/heroes/hero_16.png'),
    17: require('../../assets/heroes/hero_17.png'),
    18: require('../../assets/heroes/hero_18.png'),
    19: require('../../assets/heroes/hero_19.png'),
    20: require('../../assets/heroes/hero_20.png'),
};

const DEFAULT_HERO = require('../../assets/heroes/hero_1.png'); // Fallback

/**
 * Get local asset for a hero by ID
 * @param {number} heroId 
 * @returns {number} The require ID for the image
 */
export const getHeroImage = (heroId) => {
    if (!heroId) return DEFAULT_HERO;
    return heroAssets[heroId] || DEFAULT_HERO;
};
