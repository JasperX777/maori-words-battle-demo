import { Player, Question } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 'animal-kuri', level: 1, category: 'Animals', prompt: 'Which Māori word means “dog”?',
    promptHint: 'Choose the matching word', word: 'kurī', english: 'dog', pronunciation: 'koo-ree',
    options: ['kurī', 'ngeru', 'manu', 'ika'], example: 'He kurī pai tēnei. — This is a good dog.', emoji: '🐕',
  },
  {
    id: 'animal-manu', level: 2, category: 'Animals', prompt: 'You hear: “manu”. What does it mean?',
    promptHint: 'Listen and match the meaning', word: 'manu', english: 'bird', pronunciation: 'mah-noo',
    options: ['bird', 'fish', 'horse', 'dog'], example: 'Kei te rere te manu. — The bird is flying.', emoji: '🐦',
  },
  {
    id: 'animal-ngeru', level: 3, category: 'Animals', prompt: 'Type the Māori word for “cat”.',
    promptHint: 'Macrons count, but we will accept the plain spelling', word: 'ngeru', english: 'cat', pronunciation: 'nge-roo',
    options: [], example: 'Kei te moe te ngeru. — The cat is sleeping.', emoji: '🐈',
  },
  {
    id: 'food-kai', level: 1, category: 'Food', prompt: 'Which Māori word means “food”?',
    promptHint: 'Choose the matching word', word: 'kai', english: 'food', pronunciation: 'k-eye',
    options: ['wai', 'kai', 'miraka', 'parāoa'], example: 'He kai māu? — Would you like some food?', emoji: '🥝',
  },
  {
    id: 'food-wai', level: 2, category: 'Food', prompt: 'You hear: “wai”. What does it mean?',
    promptHint: 'Listen and match the meaning', word: 'wai', english: 'water', pronunciation: 'why',
    options: ['bread', 'milk', 'water', 'apple'], example: 'Homai he wai, koa. — Please give me some water.', emoji: '💧',
  },
  {
    id: 'food-aporo', level: 3, category: 'Food', prompt: 'Type the Māori word for “apple”.',
    promptHint: 'One word', word: 'āporo', english: 'apple', pronunciation: 'aa-poh-roh',
    options: [], example: 'He āporo whero tēnei. — This is a red apple.', emoji: '🍎',
  },
  {
    id: 'family-whaea', level: 1, category: 'Family', prompt: 'Which Māori word means “mother / aunt”?',
    promptHint: 'Choose the matching word', word: 'whaea', english: 'mother / aunt', pronunciation: 'fye-ah',
    options: ['pēpi', 'tuakana', 'whaea', 'tungāne'], example: 'Ko Mere tōku whaea. — Mere is my mother.', emoji: '👩🏽',
  },
  {
    id: 'family-whanau', level: 2, category: 'Family', prompt: 'What is the meaning of “whānau”?',
    promptHint: 'Choose the closest meaning', word: 'whānau', english: 'family', pronunciation: 'faa-now',
    options: ['friend', 'family', 'child', 'grandparent'], example: 'Ko wai tō whānau? — Who is your family?', emoji: '👨‍👩‍👧‍👦',
  },
  {
    id: 'family-tamaiti', level: 3, category: 'Family', prompt: 'Type the Māori word for “child”.',
    promptHint: 'Singular form', word: 'tamaiti', english: 'child', pronunciation: 'tah-my-tee',
    options: [], example: 'He tamaiti harikoa ia. — They are a happy child.', emoji: '🧒🏽',
  },
  {
    id: 'nature-maunga', level: 1, category: 'Nature', prompt: 'Which word matches this mountain?',
    promptHint: 'Choose the Māori word', word: 'maunga', english: 'mountain', pronunciation: 'mow-ngah',
    options: ['awa', 'moana', 'maunga', 'rākau'], example: 'He maunga tapu tēnei. — This is a sacred mountain.', emoji: '⛰️',
  },
  {
    id: 'nature-moana', level: 2, category: 'Nature', prompt: 'You hear: “moana”. What does it mean?',
    promptHint: 'Listen and match the meaning', word: 'moana', english: 'ocean', pronunciation: 'moh-ah-nah',
    options: ['river', 'forest', 'ocean', 'sky'], example: 'He kikorangi te moana. — The ocean is blue.', emoji: '🌊',
  },
  {
    id: 'nature-rakau', level: 3, category: 'Nature', prompt: 'Type the Māori word for “tree”.',
    promptHint: 'Remember the first vowel has a macron', word: 'rākau', english: 'tree', pronunciation: 'raa-kow',
    options: [], example: 'He rākau nui tēnā. — That is a big tree.', emoji: '🌳',
  },
  {
    id: 'everyday-whare', level: 1, category: 'Everyday', prompt: 'Which Māori word means “house”?',
    promptHint: 'Choose the matching word', word: 'whare', english: 'house', pronunciation: 'fah-reh',
    options: ['whare', 'tūru', 'pukapuka', 'kuaha'], example: 'Kei roto ia i te whare. — They are inside the house.', emoji: '🏠',
  },
  {
    id: 'everyday-pukapuka', level: 2, category: 'Everyday', prompt: 'What is a “pukapuka”?',
    promptHint: 'Choose the object', word: 'pukapuka', english: 'book', pronunciation: 'poo-kah-poo-kah',
    options: ['chair', 'door', 'book', 'table'], example: 'Pānuitia te pukapuka. — Read the book.', emoji: '📚',
  },
  {
    id: 'everyday-kuaha', level: 3, category: 'Everyday', prompt: 'Type the Māori word for “door”.',
    promptHint: 'One word', word: 'kuaha', english: 'door', pronunciation: 'koo-ah-hah',
    options: [], example: 'Katia te kuaha. — Close the door.', emoji: '🚪',
  },
  {
    id: 'whakatohea-opotiki', level: 1, category: 'Whakatōhea', prompt: 'Ōpōtiki is the traditional centre of which iwi?',
    promptHint: 'Choose the iwi name', word: 'Whakatōhea', english: 'iwi of the eastern Bay of Plenty', pronunciation: 'fah-kah-taw-heh-ah',
    options: ['Whakatōhea', 'Ngāpuhi', 'Ngāi Tahu', 'Waikato'], example: 'Ko Whakatōhea te iwi. — Whakatōhea is the iwi.', emoji: '🌀',
  },
  {
    id: 'whakatohea-opape', level: 2, category: 'Whakatōhea', prompt: '“Ōpape” is associated with which area?',
    promptHint: 'Regional knowledge bonus', word: 'Ōpape', english: 'a coastal settlement east of Ōpōtiki', pronunciation: 'aw-pah-peh',
    options: ['East of Ōpōtiki', 'Central Auckland', 'South of Dunedin', 'West of Taupō'], example: 'Kei te rāwhiti a Ōpape i Ōpōtiki. — Ōpape is east of Ōpōtiki.', emoji: '🌅',
  },
  {
    id: 'whakatohea-iwi', level: 3, category: 'Whakatōhea', prompt: 'Complete: “Ko Whakatōhea te ___.”',
    promptHint: 'Type the word meaning tribal people', word: 'iwi', english: 'tribe / people', pronunciation: 'ee-wee',
    options: [], example: 'Ko Whakatōhea te iwi. — Whakatōhea is the iwi.', emoji: '🤝',
  },
];

export const INITIAL_PLAYERS: Player[] = [
  { id: 'me', name: 'Kahu', avatar: '🦅', score: 0, combo: 0, correct: 0, ready: true, isMe: true },
  { id: 'ana', name: 'Ana', avatar: '🌺', score: 0, combo: 0, correct: 0, ready: true },
  { id: 'tama', name: 'Tama', avatar: '🐋', score: 0, combo: 0, correct: 0, ready: true },
  { id: 'mia', name: 'Mia', avatar: '🌿', score: 0, combo: 0, correct: 0, ready: false },
];

export const DAILY_WORD = {
  word: 'manaakitanga',
  meaning: 'hospitality, kindness, generosity',
  pronunciation: 'mah-nah-ah-kee-tah-ngah',
};
