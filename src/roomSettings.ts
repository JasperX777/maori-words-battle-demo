import type { RoomSettings } from './types';

export const QUESTION_TIME_OPTIONS = [10, 15, 20, 30] as const;

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  difficulty: 1,
  rounds: 5,
  category: 'All topics',
  maxPlayers: 4,
  questionTime: 15,
};

export const getQuestionTime = ({ questionTime }: Pick<RoomSettings, 'questionTime'>) => questionTime;
