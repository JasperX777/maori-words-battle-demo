export type Screen =
  | 'login'
  | 'home'
  | 'setup'
  | 'join'
  | 'lobby'
  | 'question'
  | 'feedback'
  | 'leaderboard'
  | 'results'
  | 'unfamiliar'
  | 'howToPlay'
  | 'shop'
  | 'themes';

export type Difficulty = 1 | 2 | 3;

export type Category =
  | 'All topics'
  | 'Animals'
  | 'Food'
  | 'Family'
  | 'Nature'
  | 'Everyday'
  | 'Whakatōhea';

export type Question = {
  id: string;
  level: Difficulty;
  category: Exclude<Category, 'All topics'>;
  prompt: string;
  promptHint: string;
  word: string;
  english: string;
  pronunciation: string;
  options: string[];
  example: string;
  emoji: string;
};

export type Player = {
  id: string;
  name: string;
  avatar: string;
  score: number;
  combo: number;
  correct: number;
  ready: boolean;
  isMe?: boolean;
};

export type RoomSettings = {
  difficulty: Difficulty;
  rounds: number;
  category: Category;
  maxPlayers: number;
};

export type ThemeId = 'forest' | 'ocean' | 'sunset' | 'night';

export type HomeTheme = {
  id: ThemeId;
  name: string;
  icon: string;
  description: string;
  background: string;
  hero: string;
  heroButton: string;
  heroAccent: string;
  heroRing: string;
};

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  category: 'Avatar' | 'Profile' | 'Celebration' | 'Sticker';
};
