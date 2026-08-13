import { HomeTheme, ShopItem } from './types';

export const PROFILE_STORAGE_KEY = 'maori-words-battle-profile-v1';
export const STARTING_POINTS = 120;
export const SCORE_PER_POINT = 20;

export const HOME_THEMES: HomeTheme[] = [
  {
    id: 'forest',
    name: 'Ngahere',
    icon: '🌿',
    description: 'Native forest greens',
    background: '#FFF9EF',
    hero: '#0D725A',
    heroButton: '#06483A',
    heroAccent: '#16866B',
    heroRing: '#3E9B84',
  },
  {
    id: 'ocean',
    name: 'Moana',
    icon: '🌊',
    description: 'Calm coastal blues',
    background: '#EEF9FC',
    hero: '#176B82',
    heroButton: '#0B4353',
    heroAccent: '#2687A0',
    heroRing: '#66B8C9',
  },
  {
    id: 'sunset',
    name: 'Tōnga rā',
    icon: '🌅',
    description: 'Warm evening light',
    background: '#FFF4ED',
    hero: '#A84F3F',
    heroButton: '#713229',
    heroAccent: '#C86850',
    heroRing: '#E79A77',
  },
  {
    id: 'night',
    name: 'Pō',
    icon: '✨',
    description: 'Stars over the whenua',
    background: '#F1F2F8',
    hero: '#374267',
    heroButton: '#202944',
    heroAccent: '#4D5981',
    heroRing: '#7885AC',
  },
];

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'tui-avatar',
    name: 'Tūī avatar',
    description: 'Add a playful tūī to your collection.',
    icon: '🐦‍⬛',
    price: 45,
    category: 'Avatar',
  },
  {
    id: 'koru-frame',
    name: 'Koru profile frame',
    description: 'A green koru frame for your player card.',
    icon: '🌀',
    price: 70,
    category: 'Profile',
  },
  {
    id: 'haka-burst',
    name: 'Victory burst',
    description: 'A special celebration for your next win.',
    icon: '⚡',
    price: 90,
    category: 'Celebration',
  },
  {
    id: 'whare-stickers',
    name: 'Whare sticker pack',
    description: 'Four friendly stickers for future rooms.',
    icon: '🏡',
    price: 120,
    category: 'Sticker',
  },
];
