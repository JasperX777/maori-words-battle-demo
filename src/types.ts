export type Screen =
  | 'home'
  | 'setup'
  | 'join'
  | 'lobby'
  | 'question'
  | 'feedback'
  | 'leaderboard'
  | 'results'
  | 'unfamiliar';

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
