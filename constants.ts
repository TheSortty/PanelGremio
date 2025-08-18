import { Item, Ability } from './types';

// Placeholder function to generate realistic item icons from Albion's CDN
const getItemIconUrl = (itemName: string) => `https://render.albiononline.com/v1/sprite/${itemName}?quality=4&size=128`;
const getSpellIconUrl = (iconName: string) => `https://render.albiononline.com/v1/sprite/${iconName}`;


// Static categories, as these are unlikely to change often.
// Could also be fetched from the backend if desired.
export const BUILD_CATEGORIES = [
    "PvE", "PvP", "ZvZ", "GvG", "Ganking", "Avaloniano", "Escape"
];
