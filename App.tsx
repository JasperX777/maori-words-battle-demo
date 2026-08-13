import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import Storage from 'expo-sqlite/kv-store';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DAILY_WORD, INITIAL_PLAYERS, QUESTIONS } from './src/gameData';
import {
  HOME_THEMES,
  PROFILE_STORAGE_KEY,
  SCORE_PER_POINT,
  SHOP_ITEMS,
  STARTING_POINTS,
} from './src/rewards';
import { Category, Difficulty, Player, Question, RoomSettings, Screen, ShopItem, ThemeId } from './src/types';

const COLORS = {
  ink: '#173B36',
  muted: '#6B7D78',
  cream: '#FFF9EF',
  paper: '#FFFFFF',
  green: '#0D725A',
  greenDark: '#075344',
  greenSoft: '#DDF2E9',
  coral: '#F26B4B',
  coralSoft: '#FFF0EA',
  gold: '#F5B73B',
  goldSoft: '#FFF3CF',
  line: '#DFE8E4',
  red: '#C74435',
};

const CATEGORIES: { value: Category; icon: string }[] = [
  { value: 'All topics', icon: '✨' },
  { value: 'Animals', icon: '🐾' },
  { value: 'Food', icon: '🥝' },
  { value: 'Family', icon: '👨‍👩‍👧' },
  { value: 'Nature', icon: '🌿' },
  { value: 'Everyday', icon: '🏠' },
  { value: 'Whakatōhea', icon: '🌀' },
];

const DIFFICULTIES: { value: Difficulty; label: string; detail: string }[] = [
  { value: 1, label: 'Kākano · Beginner', detail: 'Pictures + choices' },
  { value: 2, label: 'Tipu · Intermediate', detail: 'Sound + meaning' },
  { value: 3, label: 'Rākau · Advanced', detail: 'Type the answer' },
];

const HOW_TO_PLAY_STEPS = [
  { icon: '🚪', title: 'Create, join, get ready', detail: 'Choose your level and topic, invite friends with the room code, then mark yourself ready in the lobby.' },
  { icon: '⏱️', title: 'Answer together', detail: 'Everyone sees the same question. Correct and faster answers score more.' },
  { icon: '🔥', title: 'Build a combo', detail: 'Correct answers in a row unlock combo bonuses. The final round is worth extra.' },
  { icon: '🌱', title: 'Learn every word', detail: 'After each answer, review the meaning, pronunciation, and an example sentence.' },
  { icon: '🪙', title: 'Earn Koru Points', detail: `At the end, every ${SCORE_PER_POINT} battle score becomes 1 Koru Point to spend in the shop.` },
];

const stripMacrons = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const makeRoundQuestions = (settings: RoomSettings) => {
  let pool = QUESTIONS.filter(
    (question) =>
      question.level <= settings.difficulty &&
      (settings.category === 'All topics' || question.category === settings.category),
  );

  if (!pool.length) pool = QUESTIONS.filter((question) => question.level <= settings.difficulty);

  return Array.from({ length: settings.rounds }, (_, index) => pool[index % pool.length]);
};

function ChoiceChip({
  label,
  selected,
  onPress,
  wide = false,
  selectedBackgroundColor,
  selectedBorderColor,
  selectedTextColor,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  wide?: boolean;
  selectedBackgroundColor?: string;
  selectedBorderColor?: string;
  selectedTextColor?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choiceChip,
        wide && styles.choiceChipWide,
        selected && styles.choiceChipSelected,
        selected && selectedBackgroundColor ? { backgroundColor: selectedBackgroundColor } : null,
        selected && selectedBorderColor ? { borderColor: selectedBorderColor } : null,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[
        styles.choiceChipText,
        selected && styles.choiceChipTextSelected,
        selected && selectedTextColor ? { color: selectedTextColor } : null,
      ]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({
  label,
  onPress,
  icon,
  disabled = false,
  backgroundColor,
}: {
  label: string;
  onPress: () => void;
  icon?: string;
  disabled?: boolean;
  backgroundColor?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        backgroundColor ? { backgroundColor } : null,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{icon ? `${icon}  ` : ''}{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function AppHeader({ title, onBack, trailing }: { title: string; onBack?: () => void; trailing?: string }) {
  return (
    <View style={styles.appHeader}>
      {onBack ? (
        <Pressable accessibilityLabel="Go back" onPress={onBack} style={styles.headerIcon}>
          <Text style={styles.headerIconText}>‹</Text>
        </Pressable>
      ) : <View style={styles.headerIcon} />}
      <Text style={styles.appHeaderTitle}>{title}</Text>
      <View style={styles.headerIcon}>{trailing ? <Text style={styles.headerTrailing}>{trailing}</Text> : null}</View>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [settings, setSettings] = useState<RoomSettings>({ difficulty: 1, rounds: 5, category: 'All topics', maxPlayers: 4 });
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [roundQuestions, setRoundQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);
  const [unfamiliarWords, setUnfamiliarWords] = useState<Question[]>([QUESTIONS[1], QUESTIONS[9]]);
  const [roomCode, setRoomCode] = useState('KORU24');
  const [joinCode, setJoinCode] = useState('');
  const [nickname, setNickname] = useState('Kahu');
  const [koruPoints, setKoruPoints] = useState(STARTING_POINTS);
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [themeId, setThemeId] = useState<ThemeId>('forest');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [earnedKoruPoints, setEarnedKoruPoints] = useState(0);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [shopMessage, setShopMessage] = useState('');
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);
  const [editingLobbySettings, setEditingLobbySettings] = useState(false);
  const [lobbyBackScreen, setLobbyBackScreen] = useState<'setup' | 'join'>('setup');
  const [isRoomHost, setIsRoomHost] = useState(true);
  const [selectedLobbyPlayerId, setSelectedLobbyPlayerId] = useState<string | null>(null);

  const me = players.find((player) => player.isMe) ?? players[0];
  const question = roundQuestions[questionIndex];
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const activeTheme = HOME_THEMES.find((theme) => theme.id === themeId) ?? HOME_THEMES[0];
  const themedChipProps = {
    selectedBackgroundColor: activeTheme.hero,
    selectedBorderColor: activeTheme.heroButton,
    selectedTextColor: 'white',
  };

  useEffect(() => {
    let active = true;

    Storage.getItem(PROFILE_STORAGE_KEY)
      .then((savedProfile) => {
        if (!active || !savedProfile) return;
        const parsed = JSON.parse(savedProfile) as {
          koruPoints?: number;
          ownedItemIds?: string[];
          themeId?: ThemeId;
        };
        if (typeof parsed.koruPoints === 'number' && parsed.koruPoints >= 0) setKoruPoints(parsed.koruPoints);
        if (Array.isArray(parsed.ownedItemIds)) setOwnedItemIds(parsed.ownedItemIds);
        if (parsed.themeId && HOME_THEMES.some((theme) => theme.id === parsed.themeId)) setThemeId(parsed.themeId);
      })
      .catch(() => undefined)
      .finally(() => active && setProfileLoaded(true));

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!profileLoaded) return;
    Storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ koruPoints, ownedItemIds, themeId })).catch(() => undefined);
  }, [koruPoints, ownedItemIds, profileLoaded, themeId]);

  const submitAnswer = (answer: string) => {
    if (!question || screen !== 'question') return;

    const correct = question.level === 3
      ? stripMacrons(answer) === stripMacrons(question.word)
      : answer === question.word || answer === question.english;
    const nextCombo = correct ? me.combo + 1 : 0;
    const comboBonus = nextCombo === 3 ? 10 : nextCombo === 5 ? 20 : 0;
    const finalBonus = questionIndex === roundQuestions.length - 1 ? 50 : 0;
    const points = correct ? 100 + timeLeft * 5 + comboBonus + finalBonus : 0;

    setLastCorrect(correct);
    setLastPoints(points);
    setPlayers((current) => current.map((player) => {
      if (player.isMe) {
        return {
          ...player,
          score: player.score + points,
          combo: correct ? player.combo + 1 : 0,
          correct: player.correct + (correct ? 1 : 0),
        };
      }

      const rivalCorrect = Math.random() > 0.28;
      return {
        ...player,
        score: player.score + (rivalCorrect ? 75 + Math.floor(Math.random() * 85) + finalBonus : 0),
        combo: rivalCorrect ? player.combo + 1 : 0,
        correct: player.correct + (rivalCorrect ? 1 : 0),
      };
    }));

    if (!correct && !unfamiliarWords.some((item) => item.id === question.id)) {
      setUnfamiliarWords((current) => [...current, question]);
    }
    setScreen('feedback');
  };

  useEffect(() => {
    if (screen !== 'question') return;
    if (timeLeft <= 0) {
      submitAnswer('');
      return;
    }
    const timer = setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [screen, timeLeft]);

  const openLobby = (joined = false) => {
    const cleanNickname = nickname.trim() || 'Kahu';
    setPlayers(INITIAL_PLAYERS.map((player) => player.isMe ? { ...player, name: cleanNickname } : player));
    setRoomCode(joined ? joinCode.trim().toUpperCase() || 'KORU24' : `KORU${Math.floor(10 + Math.random() * 89)}`);
    setRoomCodeCopied(false);
    setEditingLobbySettings(false);
    setLobbyBackScreen(joined ? 'join' : 'setup');
    setIsRoomHost(!joined);
    setSelectedLobbyPlayerId(null);
    setScreen('lobby');
  };

  const startGame = () => {
    setPlayers((current) => current.map((player) => ({ ...player, score: 0, combo: 0, correct: 0 })));
    setRoundQuestions(makeRoundQuestions(settings));
    setQuestionIndex(0);
    setSelectedAnswer('');
    setTypedAnswer('');
    setTimeLeft(15);
    setEarnedKoruPoints(0);
    setPointsAwarded(false);
    setScreen('question');
  };

  const advanceRound = () => {
    if (questionIndex >= roundQuestions.length - 1) {
      if (!pointsAwarded) {
        const reward = Math.floor(me.score / SCORE_PER_POINT);
        setEarnedKoruPoints(reward);
        setKoruPoints((current) => current + reward);
        setPointsAwarded(true);
      }
      setScreen('results');
      return;
    }
    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);
    setSelectedAnswer('');
    setTypedAnswer('');
    setTimeLeft(15);
    setScreen(nextIndex % 3 === 0 ? 'leaderboard' : 'question');
  };

  const continueFromLeaderboard = () => {
    setSelectedAnswer('');
    setTypedAnswer('');
    setTimeLeft(15);
    setScreen('question');
  };

  const resetToHome = () => {
    setQuestionIndex(0);
    setRoundQuestions([]);
    setPlayers(INITIAL_PLAYERS);
    setScreen('home');
  };

  const redeemItem = (item: ShopItem) => {
    if (ownedItemIds.includes(item.id)) return;
    if (koruPoints < item.price) {
      setShopMessage(`You need ${item.price - koruPoints} more Koru Points.`);
      return;
    }
    setKoruPoints((current) => current - item.price);
    setOwnedItemIds((current) => [...current, item.id]);
    setShopMessage(`${item.name} added to your collection!`);
  };

  const chooseTheme = (nextThemeId: ThemeId) => {
    setThemeId(nextThemeId);
  };

  const toggleReady = () => {
    setPlayers((current) => current.map((player) => (
      player.isMe ? { ...player, ready: !player.ready } : player
    )));
  };

  const copyRoomCode = async () => {
    await Clipboard.setStringAsync(roomCode);
    setRoomCodeCopied(true);
  };

  const removePlayer = (playerId: string) => {
    setPlayers((current) => current.filter((player) => player.isMe || player.id !== playerId));
    setSelectedLobbyPlayerId(null);
  };

  const renderLogin = () => (
    <ScrollView
      style={{ backgroundColor: activeTheme.background }}
      contentContainerStyle={styles.loginContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.loginBrandMark}><Text style={styles.loginBrandText}>M</Text></View>
      <Text style={styles.loginKicker}>NAU MAI · WELCOME</Text>
      <Text style={styles.loginTitle}>Māori Words{`\n`}Battle</Text>
      <Text style={styles.loginSubtitle}>Learn te reo Māori through friendly battles, daily kupu, and shared progress.</Text>

      <View style={[styles.loginArt, { backgroundColor: activeTheme.hero }]}>
        <View style={[styles.loginArtOrbOne, { backgroundColor: activeTheme.heroAccent }]} />
        <View style={[styles.loginArtOrbTwo, { borderColor: activeTheme.heroRing }]} />
        <Text style={styles.loginArtIcon}>🌀</Text>
        <Text style={styles.loginArtText}>He waka eke noa</Text>
      </View>

      <View style={styles.loginCard}>
        <Text style={styles.loginCardTitle}>Sign in to begin</Text>
        <Text style={styles.loginCardSubtitle}>Choose an account to continue your learning journey.</Text>
        <Pressable accessibilityRole="button" onPress={() => setScreen('home')} style={({ pressed }) => [styles.googleLoginButton, pressed && styles.pressed]}>
          <View style={styles.googleLoginIcon}><Text style={styles.googleLoginIconText}>G</Text></View>
          <Text style={styles.googleLoginText}>Continue with Google</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setScreen('home')} style={({ pressed }) => [styles.facebookLoginButton, pressed && styles.pressed]}>
          <View style={styles.facebookLoginIcon}><Text style={styles.facebookLoginIconText}>f</Text></View>
          <Text style={styles.facebookLoginText}>Continue with Facebook</Text>
        </Pressable>
        <Text style={styles.loginDemoNote}>Demo sign-in only · No account data or password is requested.</Text>
      </View>
      <Text style={styles.loginCulturalNote}>Ako tahi · Learn together</Text>
    </ScrollView>
  );

  const renderHome = () => (
    <ScrollView
      style={{ backgroundColor: activeTheme.background }}
      contentContainerStyle={styles.homeContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.homeTopBar}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
        <View style={styles.homeTopText}>
          <Text style={styles.kicker}>KIA ORA, KAHU</Text>
          <Text style={styles.homeTitle}>Ready to learn?</Text>
        </View>
        <Pressable onPress={() => setScreen('shop')} style={styles.walletPill}>
          <Text style={styles.walletValue}>🪙 {koruPoints}</Text>
          <Text style={styles.walletLabel}>KORU POINTS</Text>
        </Pressable>
      </View>

      <View style={styles.homeUtilityRow}>
        <Pressable onPress={() => setScreen('howToPlay')} style={styles.homeUtilityButton}>
          <Text style={styles.homeUtilityIcon}>?</Text>
          <Text style={styles.homeUtilityText}>How to play</Text>
        </Pressable>
        <Pressable onPress={() => setScreen('shop')} style={styles.homeUtilityButton}>
          <Text style={styles.homeUtilityIcon}>🛍️</Text>
          <Text style={styles.homeUtilityText}>Shop</Text>
        </Pressable>
        <Pressable onPress={() => setScreen('themes')} style={styles.homeUtilityButton}>
          <Text style={styles.homeUtilityIcon}>{activeTheme.icon}</Text>
          <Text style={styles.homeUtilityText}>Home style</Text>
        </Pressable>
      </View>

      <View style={[styles.heroCard, { backgroundColor: activeTheme.hero }]}>
        <View style={[styles.heroOrbOne, { backgroundColor: activeTheme.heroAccent }]} />
        <View style={[styles.heroOrbTwo, { borderColor: activeTheme.heroRing }]} />
        <Text style={styles.heroEyebrow}>LIVE CHALLENGE</Text>
        <Text style={styles.heroTitle}>Māori Words{`\n`}Battle</Text>
        <Text style={styles.heroSubtitle}>Learn together. Battle kindly. Grow your reo.</Text>
        <View style={styles.heroActions}>
          <PrimaryButton label="Create a battle" icon="⚔️" backgroundColor={activeTheme.heroButton} onPress={() => setScreen('setup')} />
          <Pressable onPress={() => setScreen('join')} style={styles.heroJoinButton}>
            <Text style={styles.heroJoinText}>Join with room code</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>Today’s kupu</Text>
        <Text style={styles.sectionLink}>DAILY MĀORI</Text>
      </View>
      <View style={styles.dailyCard}>
        <View style={styles.dailyIcon}><Text style={styles.dailyIconText}>🌿</Text></View>
        <View style={styles.dailyCopy}>
          <Text style={styles.dailyWord}>{DAILY_WORD.word}</Text>
          <Text style={styles.dailyMeaning}>{DAILY_WORD.meaning}</Text>
          <Text style={styles.pronunciation}>/{DAILY_WORD.pronunciation}/</Text>
        </View>
        <Pressable style={styles.soundButton}><Text style={styles.soundButtonText}>♪</Text></Pressable>
      </View>

      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>Your learning</Text>
        <Pressable onPress={() => setScreen('unfamiliar')}><Text style={styles.sectionLink}>SEE ALL</Text></Pressable>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>◎</Text><Text style={styles.statValue}>72%</Text><Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>✦</Text><Text style={styles.statValue}>46</Text><Text style={styles.statLabel}>Words learned</Text>
        </View>
        <Pressable onPress={() => setScreen('unfamiliar')} style={[styles.statCard, styles.statCardAccent]}>
          <Text style={styles.statIcon}>↻</Text><Text style={styles.statValue}>{unfamiliarWords.length}</Text><Text style={styles.statLabel}>To review</Text>
        </Pressable>
      </View>

      <View style={styles.learnBanner}>
        <View><Text style={styles.learnBannerKicker}>LEARN MODE</Text><Text style={styles.learnBannerTitle}>Stories of the moana</Text><Text style={styles.learnBannerMeta}>4 min · Beginner</Text></View>
        <Text style={styles.learnBannerArt}>🌊</Text>
      </View>
      <Text style={styles.culturalNote}>He waka eke noa · We are all in this together</Text>
    </ScrollView>
  );

  const renderHowToPlay = () => (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <AppHeader title="How to play" onBack={() => setScreen('home')} />
      <View style={styles.guideHero}>
        <Text style={styles.guideHeroIcon}>⚔️</Text>
        <Text style={styles.guideHeroTitle}>Learn, battle, remember</Text>
        <Text style={styles.guideHeroText}>Answer Māori vocabulary questions with friends. Accuracy matters, and speed gives you an extra edge.</Text>
      </View>

      <Text style={styles.fieldLabel}>YOUR BATTLE JOURNEY</Text>
      <View style={styles.guideSteps}>
        {HOW_TO_PLAY_STEPS.map((step, index) => (
          <View key={step.title} style={styles.guideStep}>
            <View style={styles.guideStepIcon}><Text style={styles.guideStepEmoji}>{step.icon}</Text></View>
            <View style={styles.guideStepCopy}>
              <Text style={styles.guideStepNumber}>STEP {index + 1}</Text>
              <Text style={styles.guideStepTitle}>{step.title}</Text>
              <Text style={styles.guideStepDetail}>{step.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.guideRulesCard}>
        <Text style={styles.guideRulesTitle}>Three ways to play</Text>
        <Text style={styles.guideRule}><Text style={styles.guideRuleStrong}>Level 1:</Text> choose the right Māori word.</Text>
        <Text style={styles.guideRule}><Text style={styles.guideRuleStrong}>Level 2:</Text> match a word or pronunciation to its meaning.</Text>
        <Text style={styles.guideRule}><Text style={styles.guideRuleStrong}>Level 3:</Text> type the word with fewer hints.</Text>
      </View>
      <PrimaryButton label="Create your first battle" icon="⚔️" backgroundColor={activeTheme.heroButton} onPress={() => setScreen('setup')} />
      <SecondaryButton label="Join with a room code" onPress={() => setScreen('join')} />
    </ScrollView>
  );

  const renderShop = () => (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <AppHeader title="Koru Shop" onBack={() => { setShopMessage(''); setScreen('home'); }} />
      <View style={styles.shopBalanceCard}>
        <View>
          <Text style={styles.shopBalanceLabel}>YOUR BALANCE</Text>
          <Text style={styles.shopBalanceValue}>🪙 {koruPoints}</Text>
        </View>
        <View style={styles.shopRatePill}><Text style={styles.shopRateText}>{SCORE_PER_POINT} score = 1 point</Text></View>
      </View>
      <Text style={styles.pageTitle}>Reward your learning</Text>
      <Text style={styles.pageSubtitle}>Finish battles to earn Koru Points, then exchange them for items in your collection.</Text>
      {shopMessage ? <View style={styles.shopMessage}><Text style={styles.shopMessageText}>{shopMessage}</Text></View> : null}

      <View style={styles.shopGrid}>
        {SHOP_ITEMS.map((item) => {
          const owned = ownedItemIds.includes(item.id);
          const canAfford = koruPoints >= item.price;
          return (
            <View key={item.id} style={[styles.shopItemCard, owned && styles.shopItemOwned]}>
              <View style={styles.shopItemTopRow}>
                <View style={styles.shopItemIcon}><Text style={styles.shopItemEmoji}>{item.icon}</Text></View>
                <Text style={styles.shopItemCategory}>{item.category.toUpperCase()}</Text>
              </View>
              <Text style={styles.shopItemName}>{item.name}</Text>
              <Text style={styles.shopItemDescription}>{item.description}</Text>
              <Pressable
                disabled={owned}
                onPress={() => redeemItem(item)}
                style={[
                  styles.redeemButton,
                  owned && styles.redeemButtonOwned,
                  !owned && !canAfford && styles.redeemButtonShort,
                ]}
              >
                <Text style={[styles.redeemButtonText, owned && styles.redeemButtonTextOwned]}>
                  {owned ? '✓ Owned' : `🪙 ${item.price}`}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <Text style={styles.demoHint}>Shop items are saved locally in this demo. Equipping cosmetics is reserved for the profile milestone.</Text>
    </ScrollView>
  );

  const renderThemes = () => (
    <ScrollView
      style={{ backgroundColor: activeTheme.background }}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <AppHeader title="Home style" onBack={() => setScreen('home')} />
      <Text style={styles.pageTitle}>Choose your atmosphere</Text>
      <Text style={styles.pageSubtitle}>Change the colours used across the home screen, room setup, lobby, and battle flow. Your choice is saved on this device.</Text>
      <View style={styles.themeList}>
        {HOME_THEMES.map((theme) => {
          const selected = theme.id === themeId;
          return (
            <Pressable
              key={theme.id}
              onPress={() => chooseTheme(theme.id)}
              style={[styles.themeCard, selected && styles.themeCardSelected]}
            >
              <View style={[styles.themePreview, { backgroundColor: theme.hero }]}>
                <View style={[styles.themePreviewOrb, { backgroundColor: theme.heroAccent }]} />
                <Text style={styles.themePreviewIcon}>{theme.icon}</Text>
              </View>
              <View style={styles.themeCopy}>
                <Text style={styles.themeName}>{theme.name}</Text>
                <Text style={styles.themeDescription}>{theme.description}</Text>
              </View>
              <Text style={[styles.themeState, selected && styles.themeStateSelected]}>{selected ? '✓ USING' : 'USE'}</Text>
            </Pressable>
          );
        })}
      </View>
      <PrimaryButton label="Back to home" backgroundColor={activeTheme.heroButton} onPress={() => setScreen('home')} />
    </ScrollView>
  );

  const renderSetup = () => (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <AppHeader title="Create a battle" onBack={() => setScreen('home')} />
      <Text style={styles.pageTitle}>Set up your room</Text>
      <Text style={styles.pageSubtitle}>Choose a challenge that works for your group.</Text>

      <Text style={styles.fieldLabel}>DIFFICULTY</Text>
      <View style={styles.optionStack}>
        {DIFFICULTIES.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setSettings({ ...settings, difficulty: item.value })}
            style={[
              styles.levelCard,
              settings.difficulty === item.value && styles.levelCardSelected,
              settings.difficulty === item.value && { borderColor: activeTheme.heroButton, backgroundColor: activeTheme.background },
            ]}
          >
            <View style={[
              styles.levelNumber,
              settings.difficulty === item.value && styles.levelNumberSelected,
              settings.difficulty === item.value && { backgroundColor: activeTheme.heroButton },
            ]}>
              <Text style={[styles.levelNumberText, settings.difficulty === item.value && styles.levelNumberTextSelected]}>{item.value}</Text>
            </View>
            <View style={styles.levelCopy}>
              <Text style={styles.levelTitle}>{item.label}</Text>
              <Text style={styles.levelDetail}>{item.detail}</Text>
            </View>
            <Text style={[styles.levelCheck, { color: activeTheme.heroButton }]}>{settings.difficulty === item.value ? '●' : '○'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>CATEGORY</Text>
      <View style={styles.chipWrap}>
        {CATEGORIES.map((item) => (
          <ChoiceChip
            {...themedChipProps}
            key={item.value}
            label={`${item.icon} ${item.value}`}
            selected={settings.category === item.value}
            onPress={() => setSettings({ ...settings, category: item.value })}
          />
        ))}
      </View>

      <Text style={styles.fieldLabel}>ROUNDS</Text>
      <View style={styles.segmentedControl}>
        {[5, 8, 10].map((rounds) => (
          <ChoiceChip {...themedChipProps} key={rounds} label={`${rounds}`} selected={settings.rounds === rounds} onPress={() => setSettings({ ...settings, rounds })} wide />
        ))}
      </View>

      <Text style={styles.fieldLabel}>MAX PLAYERS</Text>
      <View style={styles.segmentedControl}>
        {[2, 4, 6].map((maxPlayers) => (
          <ChoiceChip {...themedChipProps} key={maxPlayers} label={`${maxPlayers}`} selected={settings.maxPlayers === maxPlayers} onPress={() => setSettings({ ...settings, maxPlayers })} wide />
        ))}
      </View>

      <PrimaryButton label="Create room" backgroundColor={activeTheme.heroButton} onPress={() => openLobby()} icon="＋" />
    </ScrollView>
  );

  const renderJoin = () => (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <AppHeader title="Join a battle" onBack={() => setScreen('home')} />
        <View style={styles.joinIllustration}><Text style={styles.joinIllustrationText}>🌀</Text></View>
        <Text style={[styles.pageTitle, styles.centerText]}>Enter your room code</Text>
        <Text style={[styles.pageSubtitle, styles.centerText]}>Ask the host for the six-character code.</Text>
        <Text style={styles.fieldLabel}>ROOM CODE</Text>
        <TextInput
          autoCapitalize="characters"
          maxLength={6}
          placeholder="KORU24"
          placeholderTextColor="#A9B5B1"
          value={joinCode}
          onChangeText={setJoinCode}
          style={[styles.textInput, styles.codeInput]}
        />
        <Text style={styles.fieldLabel}>YOUR NICKNAME</Text>
        <TextInput
          maxLength={14}
          placeholder="Kahu"
          placeholderTextColor="#A9B5B1"
          value={nickname}
          onChangeText={setNickname}
          style={styles.textInput}
        />
        <PrimaryButton label="Join room" backgroundColor={activeTheme.heroButton} onPress={() => openLobby(true)} disabled={joinCode.trim().length < 4} />
        <Text style={styles.demoHint}>Demo tip: enter any 4–6 characters to join the simulated room.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderLobby = () => {
    const lobbyPlayers = players.slice(0, settings.maxPlayers);
    const lobbySeats = Array.from(
      { length: settings.maxPlayers },
      (_, index) => lobbyPlayers[index] ?? null,
    );
    const waitingCount = lobbyPlayers.filter((player) => !player.ready).length;
    const everyoneReady = waitingCount === 0;

    return (
      <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <AppHeader title="Game lobby" onBack={() => setScreen(lobbyBackScreen)} trailing="•••" />
      <View style={[styles.roomCodeCard, { backgroundColor: activeTheme.hero }]}>
        <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
        <Text style={styles.roomCode}>{roomCode}</Text>
        <Pressable onPress={copyRoomCode} style={styles.copyCodeButton}>
          <Text style={[styles.copyCodeButtonText, { color: activeTheme.heroButton }]}>{roomCodeCopied ? '✓ Copied' : '⧉  Copy room code'}</Text>
        </Pressable>
        <Text style={styles.roomCodeHelp}>Copy and send this code to invite friends</Text>
      </View>

      <View style={styles.lobbyHeading}>
        <Text style={styles.sectionTitle}>Players</Text>
        <Text style={styles.playerCount}>{lobbyPlayers.length}/{settings.maxPlayers}</Text>
      </View>
      <View style={styles.playerList}>
        {lobbySeats.map((player, seatIndex) => player ? (
          <View key={player.id} style={styles.playerRow}>
            <View style={styles.playerAvatarAction}>
              <Pressable
                accessibilityLabel={isRoomHost && !player.isMe ? `Manage ${player.name}` : `${player.name} avatar`}
                onPress={() => {
                  if (!isRoomHost || player.isMe) return;
                  setSelectedLobbyPlayerId((current) => current === player.id ? null : player.id);
                }}
                style={styles.playerAvatar}
              >
                <Text style={styles.playerAvatarText}>{player.avatar}</Text>
              </Pressable>
              {isRoomHost && !player.isMe && selectedLobbyPlayerId === player.id ? (
                <Pressable accessibilityLabel={`Remove ${player.name}`} onPress={() => removePlayer(player.id)} style={styles.removePlayerButton}>
                  <Text style={styles.removePlayerText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.playerNameWrap}>
              <Text style={styles.playerName}>{player.name}{player.isMe ? '  (you)' : ''}</Text>
              <Text style={styles.playerStatus}>{player.ready ? 'Ready to battle' : player.isMe ? 'Tap I’m ready below' : 'Getting ready…'}</Text>
            </View>
            <Text style={[styles.readyState, !player.ready && styles.waitingState]}>{player.ready ? '✓ READY' : 'WAITING'}</Text>
          </View>
        ) : (
          <View key={`empty-seat-${seatIndex}`} style={[styles.playerRow, styles.emptyPlayerRow]}>
            <View style={[styles.playerAvatar, styles.emptyPlayerAvatar]}><Text style={styles.emptyPlayerAvatarText}>+</Text></View>
            <View style={styles.playerNameWrap}>
              <Text style={styles.emptyPlayerName}>Waiting for a player</Text>
              <Text style={styles.playerStatus}>Invite someone with the room code</Text>
            </View>
            <Text style={styles.openSeatState}>OPEN</Text>
          </View>
        ))}
      </View>

      <View style={styles.settingsSummary}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Battle settings</Text>
          <Pressable onPress={() => setEditingLobbySettings((current) => !current)} style={styles.editSettingsButton}>
            <Text style={styles.editSettingsText}>{editingLobbySettings ? '✓ Done' : 'Edit'}</Text>
          </Pressable>
        </View>
        {editingLobbySettings ? (
          <View>
            <Text style={styles.inlineSettingLabel}>DIFFICULTY</Text>
            <View style={styles.segmentedControl}>
              {[1, 2, 3].map((difficulty) => (
                <ChoiceChip {...themedChipProps} key={difficulty} label={`Level ${difficulty}`} wide selected={settings.difficulty === difficulty} onPress={() => setSettings({ ...settings, difficulty: difficulty as Difficulty })} />
              ))}
            </View>
            <Text style={styles.inlineSettingLabel}>CATEGORY</Text>
            <View style={styles.chipWrap}>
              {CATEGORIES.map((item) => (
                <ChoiceChip {...themedChipProps} key={item.value} label={item.value} selected={settings.category === item.value} onPress={() => setSettings({ ...settings, category: item.value })} />
              ))}
            </View>
            <Text style={styles.inlineSettingLabel}>ROUNDS</Text>
            <View style={styles.segmentedControl}>
              {[5, 8, 10].map((rounds) => (
                <ChoiceChip {...themedChipProps} key={rounds} label={`${rounds}`} wide selected={settings.rounds === rounds} onPress={() => setSettings({ ...settings, rounds })} />
              ))}
            </View>
            <Text style={styles.inlineSettingLabel}>MAX PLAYERS</Text>
            <View style={styles.segmentedControl}>
              {[2, 4, 6].map((maxPlayers) => (
                <ChoiceChip {...themedChipProps} key={maxPlayers} label={`${maxPlayers}`} wide selected={settings.maxPlayers === maxPlayers} onPress={() => setSettings({ ...settings, maxPlayers })} />
              ))}
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Difficulty</Text><Text style={styles.summaryValue}>Level {settings.difficulty}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Category</Text><Text style={styles.summaryValue}>{settings.category}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Rounds</Text><Text style={styles.summaryValue}>{settings.rounds}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Max players</Text><Text style={styles.summaryValue}>{settings.maxPlayers}</Text></View>
          </View>
        )}
      </View>

      <View style={[
        styles.readyPanel,
        me.ready && styles.readyPanelActive,
        me.ready && { borderColor: activeTheme.heroButton, backgroundColor: activeTheme.background },
      ]}>
        <View style={styles.readyPanelCopy}>
          <Text style={styles.readyPanelTitle}>{me.ready ? 'You are ready!' : 'Ready to battle?'}</Text>
          <Text style={styles.readyPanelText}>{everyoneReady ? 'Everyone is ready. The battle can begin.' : `${waitingCount} player${waitingCount === 1 ? '' : 's'} still need to get ready.`}</Text>
        </View>
        {me.ready
          ? <SecondaryButton label="Cancel ready" onPress={toggleReady} />
          : <PrimaryButton label="I’m ready" backgroundColor={activeTheme.heroButton} onPress={toggleReady} />}
      </View>

      <PrimaryButton
        label={editingLobbySettings ? 'Finish editing settings' : everyoneReady ? 'Start battle' : 'Waiting for players'}
        icon="⚔️"
        backgroundColor={activeTheme.heroButton}
        onPress={startGame}
        disabled={!everyoneReady || editingLobbySettings}
      />
      <Text style={styles.demoHint}>This demo fills the room with simulated players.</Text>
      </ScrollView>
    );
  };

  const renderQuestion = () => {
    if (!question) return null;
    const isFinal = questionIndex === roundQuestions.length - 1;
    const answerValue = question.level === 3 ? typedAnswer : selectedAnswer;
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.gameContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.gameHeader}>
            <View><Text style={[styles.gameRound, { color: activeTheme.heroButton }]}>{isFinal ? 'FINAL ROUND' : `ROUND ${questionIndex + 1} OF ${roundQuestions.length}`}</Text><Text style={styles.gameCategory}>{question.category}</Text></View>
            <View style={styles.scorePill}><Text style={styles.scorePillText}>★ {me.score}</Text></View>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { backgroundColor: activeTheme.hero, width: `${((questionIndex + 1) / roundQuestions.length) * 100}%` }]} /></View>

          <View style={[styles.timerRing, { borderColor: activeTheme.heroRing }, timeLeft <= 5 && styles.timerRingUrgent]}>
            <Text style={[styles.timerValue, timeLeft <= 5 && styles.timerValueUrgent]}>{timeLeft}</Text>
          </View>
          {me.combo >= 2 ? <Text style={styles.comboText}>🔥 {me.combo} answer combo</Text> : <View style={styles.comboSpacer} />}

          <View style={[styles.questionCard, isFinal && styles.finalQuestionCard]}>
            {isFinal ? <Text style={styles.finalBadge}>⚡ DOUBLE CHANCE</Text> : null}
            <Text style={styles.questionEmoji}>{question.emoji}</Text>
            <Text style={styles.questionPrompt}>{question.prompt}</Text>
            <Text style={styles.questionHint}>{question.promptHint}</Text>
            {question.level === 2 ? (
              <Pressable style={styles.listenButton}><Text style={styles.listenButtonText}>♪  Play pronunciation</Text></Pressable>
            ) : null}
          </View>

          {question.level === 3 ? (
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Type your answer…"
              placeholderTextColor="#9BA9A5"
              value={typedAnswer}
              onChangeText={setTypedAnswer}
              onSubmitEditing={() => answerValue.trim() && submitAnswer(answerValue)}
              style={[styles.answerInput, { borderColor: activeTheme.heroButton }]}
            />
          ) : (
            <View style={styles.answerGrid}>
              {question.options.map((option, index) => (
                <Pressable
                  key={option}
                  onPress={() => setSelectedAnswer(option)}
                  style={[
                    styles.answerOption,
                    selectedAnswer === option && styles.answerOptionSelected,
                    selectedAnswer === option && { borderColor: activeTheme.heroButton, backgroundColor: activeTheme.background },
                  ]}
                >
                  <View style={[
                    styles.answerLetter,
                    selectedAnswer === option && styles.answerLetterSelected,
                    selectedAnswer === option && { backgroundColor: activeTheme.heroButton },
                  ]}>
                    <Text style={[styles.answerLetterText, selectedAnswer === option && styles.answerLetterTextSelected]}>{String.fromCharCode(65 + index)}</Text>
                  </View>
                  <Text style={[
                    styles.answerText,
                    selectedAnswer === option && styles.answerTextSelected,
                    selectedAnswer === option && { color: activeTheme.heroButton },
                  ]}>{option}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <PrimaryButton label="Lock in answer" backgroundColor={activeTheme.heroButton} onPress={() => submitAnswer(answerValue)} disabled={!answerValue.trim()} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderFeedback = () => {
    if (!question) return null;
    return (
      <ScrollView contentContainerStyle={styles.feedbackContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.feedbackBurst, lastCorrect && { backgroundColor: activeTheme.hero }]}>{lastCorrect ? '✓' : '↻'}</Text>
        <Text style={[styles.feedbackTitle, !lastCorrect && styles.feedbackTitleWrong]}>{lastCorrect ? 'Ka mau te wehi!' : 'Kia kaha!'}</Text>
        <Text style={styles.feedbackSubtitle}>{lastCorrect ? 'Awesome work!' : 'Keep going — this one is saved to review.'}</Text>
        <View style={styles.learningCard}>
          <Text style={styles.learningEmoji}>{question.emoji}</Text>
          <Text style={styles.learningWord}>{question.word}</Text>
          <Text style={styles.learningMeaning}>{question.english}</Text>
          <View style={[styles.pronunciationPill, { backgroundColor: activeTheme.background }]}><Text style={[styles.pronunciationPillText, { color: activeTheme.heroButton }]}>♪  /{question.pronunciation}/</Text></View>
          <View style={styles.learningDivider} />
          <Text style={styles.exampleLabel}>IN A SENTENCE</Text>
          <Text style={styles.exampleText}>{question.example}</Text>
        </View>
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>{lastCorrect ? 'POINTS EARNED' : 'LEARNING MOMENT'}</Text>
          <Text style={styles.pointsValue}>{lastCorrect ? `+${lastPoints}` : '+1 word to review'}</Text>
        </View>
        <PrimaryButton label={questionIndex === roundQuestions.length - 1 ? 'See final results' : 'Next question'} backgroundColor={activeTheme.heroButton} onPress={advanceRound} />
      </ScrollView>
    );
  };

  const renderLeaderboard = () => (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <AppHeader title="Leaderboard" />
      <Text style={styles.leaderboardEyebrow}>AFTER ROUND {questionIndex}</Text>
      <Text style={[styles.pageTitle, styles.centerText]}>The battle is close!</Text>
      <Text style={[styles.pageSubtitle, styles.centerText]}>Every kupu counts. Keep your combo alive.</Text>
      <View style={styles.podiumArt}><Text style={styles.podiumText}>🌺  🦅  🐋</Text></View>
      <View style={styles.rankingList}>
        {sortedPlayers.map((player, index) => (
          <View key={player.id} style={[styles.rankRow, player.isMe && styles.rankRowMe]}>
            <Text style={styles.rankNumber}>{index + 1}</Text>
            <Text style={styles.rankAvatar}>{player.avatar}</Text>
            <View style={styles.rankCopy}><Text style={styles.rankName}>{player.name}{player.isMe ? '  (you)' : ''}</Text><Text style={styles.rankMeta}>{player.correct}/{questionIndex} correct · {player.combo} combo</Text></View>
            <Text style={styles.rankScore}>{player.score}</Text>
          </View>
        ))}
      </View>
      <PrimaryButton label="Keep battling" backgroundColor={activeTheme.heroButton} onPress={continueFromLeaderboard} />
    </ScrollView>
  );

  const renderResults = () => {
    const myRank = sortedPlayers.findIndex((player) => player.isMe) + 1;
    const accuracy = Math.round((me.correct / Math.max(roundQuestions.length, 1)) * 100);
    return (
      <ScrollView contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.confetti}>✦  ·  🌿  ·  ✦</Text>
        <View style={styles.trophyCircle}><Text style={styles.trophy}>🏆</Text></View>
        <Text style={styles.resultsKicker}>BATTLE COMPLETE</Text>
        <Text style={styles.resultsTitle}>{myRank === 1 ? 'You won!' : `You placed #${myRank}`}</Text>
        <Text style={styles.resultsSubtitle}>Ka rawe, {me.name}! Your reo is growing stronger.</Text>

        <View style={styles.finalScoreCard}>
          <Text style={styles.finalScoreLabel}>FINAL SCORE</Text>
          <Text style={styles.finalScore}>{me.score}</Text>
          <View style={styles.resultStatsRow}>
            <View style={styles.resultStat}><Text style={styles.resultStatValue}>{me.correct}/{roundQuestions.length}</Text><Text style={styles.resultStatLabel}>Correct</Text></View>
            <View style={styles.resultStatDivider} />
            <View style={styles.resultStat}><Text style={styles.resultStatValue}>{accuracy}%</Text><Text style={styles.resultStatLabel}>Accuracy</Text></View>
            <View style={styles.resultStatDivider} />
            <View style={styles.resultStat}><Text style={styles.resultStatValue}>{unfamiliarWords.length}</Text><Text style={styles.resultStatLabel}>To review</Text></View>
          </View>
        </View>

        <View style={styles.koruRewardCard}>
          <View style={styles.koruRewardIcon}><Text style={styles.koruRewardEmoji}>🪙</Text></View>
          <View style={styles.koruRewardCopy}>
            <Text style={styles.koruRewardLabel}>KORU POINTS EARNED</Text>
            <Text style={styles.koruRewardValue}>+{earnedKoruPoints}</Text>
            <Text style={styles.koruRewardDetail}>{me.score} battle score ÷ {SCORE_PER_POINT}</Text>
          </View>
          <View style={styles.koruBalanceMini}>
            <Text style={styles.koruBalanceMiniLabel}>BALANCE</Text>
            <Text style={styles.koruBalanceMiniValue}>{koruPoints}</Text>
          </View>
        </View>

        <View style={styles.miniRanking}>
          {sortedPlayers.map((player, index) => (
            <View key={player.id} style={styles.miniRankRow}>
              <Text style={styles.miniRankNumber}>#{index + 1}</Text><Text style={styles.miniRankAvatar}>{player.avatar}</Text><Text style={styles.miniRankName}>{player.name}</Text><Text style={styles.miniRankScore}>{player.score}</Text>
            </View>
          ))}
        </View>
        <SecondaryButton label="Visit Koru Shop" onPress={() => setScreen('shop')} />
        <PrimaryButton label="Review unfamiliar words" icon="↻" backgroundColor={activeTheme.heroButton} onPress={() => setScreen('unfamiliar')} />
        <SecondaryButton label="Play again with this group" onPress={startGame} />
        <Pressable onPress={resetToHome}><Text style={styles.textButton}>Return to home</Text></Pressable>
      </ScrollView>
    );
  };

  const renderUnfamiliar = () => (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <AppHeader title="Unfamiliar words" onBack={() => setScreen(roundQuestions.length ? 'results' : 'home')} />
      <Text style={styles.pageTitle}>Your review list</Text>
      <Text style={styles.pageSubtitle}>Words you miss are saved here and can appear more often in future practice.</Text>
      <View style={styles.reviewSummary}>
        <Text style={styles.reviewSummaryIcon}>↻</Text>
        <View><Text style={styles.reviewSummaryValue}>{unfamiliarWords.length} kupu</Text><Text style={styles.reviewSummaryLabel}>ready to practise</Text></View>
      </View>
      <View style={styles.reviewList}>
        {unfamiliarWords.map((item) => (
          <View key={item.id} style={styles.reviewCard}>
            <Text style={styles.reviewEmoji}>{item.emoji}</Text>
            <View style={styles.reviewCopy}>
              <Text style={styles.reviewWord}>{item.word}</Text>
              <Text style={styles.reviewMeaning}>{item.english}</Text>
              <Text style={styles.reviewPronunciation}>/{item.pronunciation}/ · {item.category}</Text>
            </View>
            <Text style={styles.reviewSound}>♪</Text>
          </View>
        ))}
      </View>
      <PrimaryButton label="Start a quick review" backgroundColor={activeTheme.heroButton} onPress={() => { setSettings({ ...settings, category: 'All topics', difficulty: 3, rounds: 5 }); setScreen('setup'); }} />
    </ScrollView>
  );

  const content: Record<Screen, () => React.ReactNode> = {
    login: renderLogin,
    home: renderHome,
    setup: renderSetup,
    join: renderJoin,
    lobby: renderLobby,
    question: renderQuestion,
    feedback: renderFeedback,
    leaderboard: renderLeaderboard,
    results: renderResults,
    unfamiliar: renderUnfamiliar,
    howToPlay: renderHowToPlay,
    shop: renderShop,
    themes: renderThemes,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: activeTheme.background }]}>
      <StatusBar style="dark" />
      {content[screen]()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  flex: { flex: 1 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  centerText: { textAlign: 'center' },
  homeContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 48, gap: 18 },
  screenContent: { paddingHorizontal: 20, paddingBottom: 48 },
  gameContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 42 },
  feedbackContent: { paddingHorizontal: 20, paddingTop: 34, paddingBottom: 48, alignItems: 'center' },
  resultsContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48, alignItems: 'stretch' },
  loginContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 30, paddingBottom: 36, alignItems: 'center' },
  loginBrandMark: { width: 66, height: 66, borderRadius: 22, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  loginBrandText: { color: 'white', fontSize: 36, fontWeight: '900', fontStyle: 'italic' },
  loginKicker: { color: COLORS.green, fontSize: 10, fontWeight: '900', letterSpacing: 2.1, marginTop: 18 },
  loginTitle: { color: COLORS.ink, fontSize: 40, lineHeight: 44, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  loginSubtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 360, marginTop: 12 },
  loginArt: { width: '100%', height: 150, borderRadius: 28, marginTop: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  loginArtOrbOne: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: -30, top: -60 },
  loginArtOrbTwo: { position: 'absolute', width: 115, height: 115, borderRadius: 58, borderWidth: 18, left: -28, bottom: -45 },
  loginArtIcon: { fontSize: 52 },
  loginArtText: { color: 'white', fontSize: 13, fontWeight: '800', marginTop: 8 },
  loginCard: { width: '100%', backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 24, padding: 20, marginTop: 20 },
  loginCardTitle: { color: COLORS.ink, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  loginCardSubtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6, marginBottom: 6 },
  googleLoginButton: { minHeight: 54, borderWidth: 1.5, borderColor: COLORS.line, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, backgroundColor: 'white' },
  googleLoginIcon: { width: 27, height: 27, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  googleLoginIconText: { color: '#4285F4', fontSize: 16, fontWeight: '900' },
  googleLoginText: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  facebookLoginButton: { minHeight: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 11, backgroundColor: '#1877F2' },
  facebookLoginIcon: { width: 27, height: 27, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  facebookLoginIconText: { color: '#1877F2', fontSize: 20, lineHeight: 24, fontWeight: '900' },
  facebookLoginText: { color: 'white', fontSize: 14, fontWeight: '800' },
  loginDemoNote: { color: COLORS.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 14 },
  loginCulturalNote: { color: COLORS.muted, fontSize: 11, fontStyle: 'italic', marginTop: 20 },
  homeTopBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  brandMark: { width: 44, height: 44, borderRadius: 15, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: 'white', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  homeTopText: { flex: 1, marginLeft: 12 },
  kicker: { color: COLORS.green, fontSize: 10, letterSpacing: 1.7, fontWeight: '800' },
  homeTitle: { color: COLORS.ink, fontSize: 22, fontWeight: '800', marginTop: 2 },
  walletPill: { backgroundColor: COLORS.goldSoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, alignItems: 'center' },
  walletValue: { color: '#8A5800', fontWeight: '900', fontSize: 14 },
  walletLabel: { color: '#A2782A', fontWeight: '900', fontSize: 7, letterSpacing: 0.7, marginTop: 1 },
  homeUtilityRow: { flexDirection: 'row', gap: 8 },
  homeUtilityButton: { flex: 1, minHeight: 70, backgroundColor: COLORS.paper, borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  homeUtilityIcon: { color: COLORS.green, fontSize: 19, fontWeight: '900' },
  homeUtilityText: { color: COLORS.ink, fontSize: 10, fontWeight: '800', marginTop: 5, textAlign: 'center' },
  heroCard: { backgroundColor: COLORS.green, borderRadius: 28, padding: 24, overflow: 'hidden', minHeight: 350 },
  heroOrbOne: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#16866B', right: -45, top: -45 },
  heroOrbTwo: { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 24, borderColor: '#3E9B84', right: -16, bottom: 78, opacity: 0.46 },
  heroEyebrow: { color: '#A9E5D2', fontSize: 11, letterSpacing: 2, fontWeight: '900', marginTop: 2 },
  heroTitle: { color: 'white', fontSize: 39, lineHeight: 42, fontWeight: '900', marginTop: 10, letterSpacing: -1 },
  heroSubtitle: { color: '#D6F0E8', fontSize: 15, lineHeight: 21, maxWidth: 270, marginTop: 12 },
  heroActions: { marginTop: 'auto' },
  heroJoinButton: { paddingTop: 13, alignItems: 'center' },
  heroJoinText: { color: 'white', fontWeight: '800', textDecorationLine: 'underline' },
  primaryButton: { minHeight: 54, borderRadius: 17, backgroundColor: COLORS.coral, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 16, shadowColor: '#8E3524', shadowOpacity: 0.16, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '900' },
  secondaryButton: { minHeight: 52, borderRadius: 17, borderWidth: 1.5, borderColor: COLORS.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 12 },
  secondaryButtonText: { color: COLORS.green, fontSize: 15, fontWeight: '800' },
  buttonDisabled: { backgroundColor: '#D6DCD9', shadowOpacity: 0 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  sectionTitle: { color: COLORS.ink, fontSize: 19, fontWeight: '900' },
  sectionLink: { color: COLORS.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  dailyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line },
  dailyIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: COLORS.greenSoft, alignItems: 'center', justifyContent: 'center' },
  dailyIconText: { fontSize: 29 },
  dailyCopy: { flex: 1, paddingHorizontal: 14 },
  dailyWord: { color: COLORS.ink, fontSize: 19, fontWeight: '900' },
  dailyMeaning: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  pronunciation: { color: COLORS.green, fontSize: 11, fontStyle: 'italic', marginTop: 4 },
  soundButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.coralSoft, alignItems: 'center', justifyContent: 'center' },
  soundButtonText: { color: COLORS.coral, fontSize: 19, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 9 },
  statCard: { flex: 1, backgroundColor: COLORS.paper, padding: 13, minHeight: 112, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line },
  statCardAccent: { backgroundColor: COLORS.goldSoft, borderColor: '#F4D981' },
  statIcon: { color: COLORS.green, fontSize: 18 },
  statValue: { color: COLORS.ink, fontWeight: '900', fontSize: 20, marginTop: 8 },
  statLabel: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  learnBanner: { backgroundColor: '#183F4B', borderRadius: 21, padding: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  learnBannerKicker: { color: '#79CDB8', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  learnBannerTitle: { color: 'white', fontSize: 17, fontWeight: '800', marginTop: 6 },
  learnBannerMeta: { color: '#B5CBC9', fontSize: 11, marginTop: 5 },
  learnBannerArt: { fontSize: 55, marginLeft: 'auto' },
  culturalNote: { textAlign: 'center', color: '#879691', fontSize: 11, fontStyle: 'italic', marginTop: 2 },
  appHeader: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appHeaderTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '900' },
  headerIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerIconText: { color: COLORS.ink, fontSize: 38, fontWeight: '300', marginTop: -5 },
  headerTrailing: { color: COLORS.ink, fontWeight: '900', letterSpacing: 2 },
  pageTitle: { color: COLORS.ink, fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 15 },
  pageSubtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 25 },
  fieldLabel: { color: COLORS.ink, fontSize: 11, letterSpacing: 1.4, fontWeight: '900', marginBottom: 10, marginTop: 18 },
  optionStack: { gap: 10, marginBottom: 8 },
  levelCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderWidth: 1.5, borderColor: COLORS.line, borderRadius: 18, padding: 14 },
  levelCardSelected: { borderColor: COLORS.green, backgroundColor: '#F5FBF8' },
  levelNumber: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EEF3F1', alignItems: 'center', justifyContent: 'center' },
  levelNumberSelected: { backgroundColor: COLORS.green },
  levelNumberText: { color: COLORS.ink, fontWeight: '900', fontSize: 17 },
  levelNumberTextSelected: { color: 'white' },
  levelCopy: { flex: 1, marginLeft: 13 },
  levelTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  levelDetail: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  levelCheck: { color: COLORS.green, fontSize: 17 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segmentedControl: { flexDirection: 'row', gap: 9 },
  choiceChip: { borderWidth: 1.5, borderColor: COLORS.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: COLORS.paper },
  choiceChipWide: { flex: 1, alignItems: 'center' },
  choiceChipSelected: { borderColor: COLORS.green, backgroundColor: COLORS.greenSoft },
  choiceChipText: { color: COLORS.ink, fontWeight: '700', fontSize: 12 },
  choiceChipTextSelected: { color: COLORS.greenDark },
  joinIllustration: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.greenSoft, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  joinIllustrationText: { fontSize: 51 },
  textInput: { backgroundColor: COLORS.paper, borderWidth: 1.5, borderColor: COLORS.line, borderRadius: 16, paddingHorizontal: 18, minHeight: 56, color: COLORS.ink, fontSize: 17 },
  codeInput: { textAlign: 'center', fontSize: 26, letterSpacing: 7, fontWeight: '900' },
  demoHint: { color: COLORS.muted, textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 12 },
  roomCodeCard: { alignItems: 'center', backgroundColor: COLORS.green, borderRadius: 24, padding: 22, marginTop: 12 },
  roomCodeLabel: { color: '#A9E5D2', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  roomCode: { color: 'white', fontSize: 35, letterSpacing: 8, fontWeight: '900', marginTop: 8 },
  copyCodeButton: { backgroundColor: 'white', borderRadius: 13, paddingHorizontal: 18, paddingVertical: 10, marginTop: 12 },
  copyCodeButtonText: { color: COLORS.green, fontSize: 12, fontWeight: '900' },
  roomCodeHelp: { color: '#D5EEE7', fontSize: 11, marginTop: 10 },
  lobbyHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 10 },
  playerCount: { color: COLORS.green, fontWeight: '900', fontSize: 13 },
  playerList: { backgroundColor: COLORS.paper, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden' },
  playerRow: { flexDirection: 'row', alignItems: 'center', padding: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.line },
  emptyPlayerRow: { minHeight: 72, backgroundColor: '#FBFDFC' },
  playerAvatarAction: { width: 62, alignItems: 'center' },
  playerAvatar: { width: 45, height: 45, borderRadius: 15, backgroundColor: COLORS.greenSoft, alignItems: 'center', justifyContent: 'center' },
  playerAvatarText: { fontSize: 23 },
  emptyPlayerAvatar: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.line, backgroundColor: COLORS.cream },
  emptyPlayerAvatarText: { color: COLORS.muted, fontSize: 23, fontWeight: '500' },
  playerNameWrap: { flex: 1, marginLeft: 12 },
  playerName: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  emptyPlayerName: { color: COLORS.muted, fontSize: 13, fontWeight: '800' },
  playerStatus: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  readyState: { color: COLORS.green, fontWeight: '900', fontSize: 9 },
  waitingState: { color: '#AA7A26' },
  openSeatState: { color: COLORS.muted, fontWeight: '900', fontSize: 9, letterSpacing: 0.8 },
  removePlayerButton: { backgroundColor: '#FFF0EC', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4, marginTop: 5 },
  removePlayerText: { color: COLORS.red, fontSize: 8, fontWeight: '900' },
  settingsSummary: { backgroundColor: COLORS.coralSoft, borderRadius: 18, padding: 16, marginTop: 17 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  summaryTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '900' },
  editSettingsButton: { backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  editSettingsText: { color: COLORS.green, fontSize: 10, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryLabel: { color: COLORS.muted, fontSize: 12 },
  summaryValue: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  inlineSettingLabel: { color: COLORS.ink, fontSize: 9, letterSpacing: 1.1, fontWeight: '900', marginTop: 11, marginBottom: 7 },
  readyPanel: { backgroundColor: COLORS.paper, borderWidth: 1.5, borderColor: COLORS.line, borderRadius: 18, padding: 16, marginTop: 17 },
  readyPanelActive: { backgroundColor: COLORS.greenSoft, borderColor: COLORS.green },
  readyPanelCopy: { marginBottom: 12 },
  readyPanelTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '900' },
  readyPanelText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gameRound: { color: COLORS.green, fontSize: 10, letterSpacing: 1.5, fontWeight: '900' },
  gameCategory: { color: COLORS.ink, fontSize: 16, fontWeight: '900', marginTop: 3 },
  scorePill: { backgroundColor: COLORS.goldSoft, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16 },
  scorePillText: { color: '#8C5C00', fontWeight: '900' },
  progressTrack: { height: 7, backgroundColor: '#DDE7E3', borderRadius: 4, marginTop: 17, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 4 },
  timerRing: { alignSelf: 'center', width: 58, height: 58, borderRadius: 29, borderWidth: 5, borderColor: COLORS.gold, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  timerRingUrgent: { borderColor: COLORS.coral },
  timerValue: { color: COLORS.ink, fontSize: 20, fontWeight: '900' },
  timerValueUrgent: { color: COLORS.red },
  comboText: { textAlign: 'center', color: COLORS.coral, fontWeight: '900', fontSize: 12, marginTop: 8, height: 18 },
  comboSpacer: { height: 26 },
  questionCard: { backgroundColor: COLORS.paper, borderRadius: 26, borderWidth: 1, borderColor: COLORS.line, padding: 23, alignItems: 'center', minHeight: 238, justifyContent: 'center' },
  finalQuestionCard: { borderColor: COLORS.gold, backgroundColor: '#FFFDF5' },
  finalBadge: { color: '#9A6500', backgroundColor: COLORS.goldSoft, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 11, fontSize: 9, letterSpacing: 1.2, fontWeight: '900', marginBottom: 8 },
  questionEmoji: { fontSize: 57, marginBottom: 13 },
  questionPrompt: { color: COLORS.ink, fontSize: 22, lineHeight: 29, fontWeight: '900', textAlign: 'center' },
  questionHint: { color: COLORS.muted, fontSize: 12, marginTop: 8, textAlign: 'center' },
  listenButton: { backgroundColor: COLORS.greenSoft, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 14, marginTop: 14 },
  listenButtonText: { color: COLORS.green, fontWeight: '800', fontSize: 12 },
  answerGrid: { gap: 10, marginTop: 15 },
  answerOption: { minHeight: 58, borderWidth: 1.5, borderColor: COLORS.line, backgroundColor: COLORS.paper, borderRadius: 17, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  answerOptionSelected: { borderColor: COLORS.green, backgroundColor: COLORS.greenSoft },
  answerLetter: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF3F2', alignItems: 'center', justifyContent: 'center' },
  answerLetterSelected: { backgroundColor: COLORS.green },
  answerLetterText: { color: COLORS.muted, fontSize: 12, fontWeight: '900' },
  answerLetterTextSelected: { color: 'white' },
  answerText: { color: COLORS.ink, marginLeft: 13, fontSize: 15, fontWeight: '700' },
  answerTextSelected: { color: COLORS.greenDark },
  answerInput: { minHeight: 62, backgroundColor: COLORS.paper, borderWidth: 2, borderColor: COLORS.green, borderRadius: 17, marginTop: 16, paddingHorizontal: 18, fontSize: 19, color: COLORS.ink, textAlign: 'center' },
  feedbackBurst: { width: 74, height: 74, borderRadius: 37, backgroundColor: COLORS.green, color: 'white', textAlign: 'center', textAlignVertical: 'center', lineHeight: Platform.OS === 'ios' ? 74 : undefined, fontSize: 38, fontWeight: '900', overflow: 'hidden' },
  feedbackTitle: { color: COLORS.green, fontSize: 30, fontWeight: '900', marginTop: 15 },
  feedbackTitleWrong: { color: COLORS.coral },
  feedbackSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 5, textAlign: 'center' },
  learningCard: { width: '100%', backgroundColor: COLORS.paper, borderRadius: 25, borderWidth: 1, borderColor: COLORS.line, padding: 22, alignItems: 'center', marginTop: 23 },
  learningEmoji: { fontSize: 47 },
  learningWord: { color: COLORS.ink, fontSize: 31, fontWeight: '900', marginTop: 7 },
  learningMeaning: { color: COLORS.muted, fontSize: 15, marginTop: 3 },
  pronunciationPill: { backgroundColor: COLORS.greenSoft, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 8, marginTop: 13 },
  pronunciationPillText: { color: COLORS.green, fontSize: 12, fontWeight: '700' },
  learningDivider: { height: 1, width: '100%', backgroundColor: COLORS.line, marginVertical: 18 },
  exampleLabel: { alignSelf: 'flex-start', color: COLORS.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  exampleText: { alignSelf: 'flex-start', color: COLORS.ink, fontSize: 13, lineHeight: 20, marginTop: 7 },
  pointsCard: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.goldSoft, padding: 15, borderRadius: 17, marginTop: 13 },
  pointsLabel: { color: '#8A651C', fontSize: 9, letterSpacing: 1, fontWeight: '900' },
  pointsValue: { color: '#8A5800', fontSize: 16, fontWeight: '900' },
  leaderboardEyebrow: { color: COLORS.green, fontWeight: '900', fontSize: 10, letterSpacing: 1.8, textAlign: 'center', marginTop: 15 },
  podiumArt: { alignItems: 'center', marginBottom: 17 },
  podiumText: { fontSize: 40, letterSpacing: 12 },
  rankingList: { gap: 9 },
  rankRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, padding: 13 },
  rankRowMe: { borderColor: COLORS.green, backgroundColor: COLORS.greenSoft },
  rankNumber: { color: COLORS.ink, width: 26, fontSize: 15, fontWeight: '900' },
  rankAvatar: { fontSize: 27 },
  rankCopy: { flex: 1, marginLeft: 12 },
  rankName: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  rankMeta: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  rankScore: { color: COLORS.green, fontSize: 17, fontWeight: '900' },
  confetti: { color: COLORS.green, fontSize: 22, textAlign: 'center' },
  trophyCircle: { alignSelf: 'center', width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.goldSoft, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  trophy: { fontSize: 52 },
  resultsKicker: { color: COLORS.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, textAlign: 'center', marginTop: 16 },
  resultsTitle: { color: COLORS.ink, fontSize: 32, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  resultsSubtitle: { color: COLORS.muted, fontSize: 13, textAlign: 'center', marginTop: 7 },
  finalScoreCard: { backgroundColor: COLORS.green, borderRadius: 24, padding: 20, marginTop: 21, alignItems: 'center' },
  finalScoreLabel: { color: '#A9E5D2', fontSize: 9, letterSpacing: 1.8, fontWeight: '900' },
  finalScore: { color: 'white', fontSize: 44, fontWeight: '900', marginTop: 2 },
  resultStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, width: '100%' },
  resultStat: { flex: 1, alignItems: 'center' },
  resultStatValue: { color: 'white', fontWeight: '900', fontSize: 16 },
  resultStatLabel: { color: '#B9DED3', fontSize: 9, marginTop: 4 },
  resultStatDivider: { width: 1, height: 32, backgroundColor: '#3A8B76' },
  miniRanking: { backgroundColor: COLORS.paper, borderRadius: 19, borderWidth: 1, borderColor: COLORS.line, marginTop: 14, paddingVertical: 5 },
  miniRankRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 9 },
  miniRankNumber: { width: 31, color: COLORS.muted, fontSize: 11, fontWeight: '900' },
  miniRankAvatar: { fontSize: 21 },
  miniRankName: { flex: 1, color: COLORS.ink, fontSize: 13, fontWeight: '700', marginLeft: 10 },
  miniRankScore: { color: COLORS.ink, fontSize: 13, fontWeight: '900' },
  textButton: { color: COLORS.green, textAlign: 'center', fontWeight: '800', paddingVertical: 17 },
  koruRewardCard: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.goldSoft, borderWidth: 1, borderColor: '#EBD079', borderRadius: 20, padding: 15, marginTop: 14 },
  koruRewardIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFE19A', alignItems: 'center', justifyContent: 'center' },
  koruRewardEmoji: { fontSize: 26 },
  koruRewardCopy: { flex: 1, marginLeft: 12 },
  koruRewardLabel: { color: '#8A651C', fontSize: 8, letterSpacing: 1, fontWeight: '900' },
  koruRewardValue: { color: '#8A5800', fontSize: 24, fontWeight: '900', marginTop: 1 },
  koruRewardDetail: { color: '#9A7B3D', fontSize: 9, marginTop: 1 },
  koruBalanceMini: { alignItems: 'center', paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#E6CD87' },
  koruBalanceMiniLabel: { color: '#9A7B3D', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  koruBalanceMiniValue: { color: '#77500A', fontSize: 18, fontWeight: '900', marginTop: 3 },
  reviewSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.goldSoft, padding: 17, borderRadius: 19, marginBottom: 16 },
  reviewSummaryIcon: { color: '#9B6A08', fontSize: 28, marginRight: 13 },
  reviewSummaryValue: { color: COLORS.ink, fontWeight: '900', fontSize: 17 },
  reviewSummaryLabel: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  reviewList: { gap: 10 },
  reviewCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 14 },
  reviewEmoji: { fontSize: 31, width: 45 },
  reviewCopy: { flex: 1, marginLeft: 9 },
  reviewWord: { color: COLORS.ink, fontSize: 17, fontWeight: '900' },
  reviewMeaning: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  reviewPronunciation: { color: COLORS.green, fontSize: 9, marginTop: 4 },
  reviewSound: { color: COLORS.coral, fontSize: 18, fontWeight: '900' },
  guideHero: { backgroundColor: COLORS.green, borderRadius: 25, padding: 23, alignItems: 'center', marginTop: 12 },
  guideHeroIcon: { fontSize: 45 },
  guideHeroTitle: { color: 'white', fontSize: 24, fontWeight: '900', marginTop: 10 },
  guideHeroText: { color: '#D6F0E8', textAlign: 'center', fontSize: 13, lineHeight: 20, marginTop: 8 },
  guideSteps: { gap: 10 },
  guideStep: { flexDirection: 'row', backgroundColor: COLORS.paper, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 14 },
  guideStepIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.greenSoft, alignItems: 'center', justifyContent: 'center' },
  guideStepEmoji: { fontSize: 23 },
  guideStepCopy: { flex: 1, marginLeft: 13 },
  guideStepNumber: { color: COLORS.green, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  guideStepTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '900', marginTop: 2 },
  guideStepDetail: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  guideRulesCard: { backgroundColor: COLORS.coralSoft, borderRadius: 19, padding: 17, marginTop: 17 },
  guideRulesTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  guideRule: { color: COLORS.muted, fontSize: 12, lineHeight: 19, marginTop: 3 },
  guideRuleStrong: { color: COLORS.ink, fontWeight: '900' },
  shopBalanceCard: { backgroundColor: COLORS.goldSoft, borderRadius: 21, borderWidth: 1, borderColor: '#EBD079', padding: 18, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shopBalanceLabel: { color: '#8A651C', fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  shopBalanceValue: { color: '#77500A', fontSize: 28, fontWeight: '900', marginTop: 3 },
  shopRatePill: { backgroundColor: '#FFE8AD', borderRadius: 13, paddingHorizontal: 10, paddingVertical: 8 },
  shopRateText: { color: '#8A651C', fontSize: 9, fontWeight: '800' },
  shopMessage: { backgroundColor: COLORS.greenSoft, borderRadius: 14, padding: 12, marginTop: -10, marginBottom: 14 },
  shopMessageText: { color: COLORS.greenDark, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  shopGrid: { gap: 11 },
  shopItemCard: { backgroundColor: COLORS.paper, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, padding: 16 },
  shopItemOwned: { borderColor: COLORS.green, backgroundColor: '#F6FBF9' },
  shopItemTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  shopItemIcon: { width: 55, height: 55, borderRadius: 17, backgroundColor: COLORS.greenSoft, alignItems: 'center', justifyContent: 'center' },
  shopItemEmoji: { fontSize: 29 },
  shopItemCategory: { color: COLORS.green, backgroundColor: COLORS.greenSoft, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, fontSize: 8, letterSpacing: 1, fontWeight: '900' },
  shopItemName: { color: COLORS.ink, fontSize: 17, fontWeight: '900', marginTop: 12 },
  shopItemDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  redeemButton: { minHeight: 42, borderRadius: 13, backgroundColor: COLORS.coral, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  redeemButtonOwned: { backgroundColor: COLORS.greenSoft },
  redeemButtonShort: { backgroundColor: '#C8CEC9' },
  redeemButtonText: { color: 'white', fontSize: 12, fontWeight: '900' },
  redeemButtonTextOwned: { color: COLORS.greenDark },
  themeList: { gap: 11 },
  themeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.paper, borderRadius: 19, borderWidth: 1.5, borderColor: COLORS.line, padding: 12 },
  themeCardSelected: { borderColor: COLORS.green },
  themePreview: { width: 74, height: 70, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  themePreviewOrb: { position: 'absolute', width: 60, height: 60, borderRadius: 30, right: -18, top: -18 },
  themePreviewIcon: { fontSize: 31 },
  themeCopy: { flex: 1, marginLeft: 13 },
  themeName: { color: COLORS.ink, fontSize: 16, fontWeight: '900' },
  themeDescription: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  themeState: { color: COLORS.muted, fontSize: 8, letterSpacing: 0.8, fontWeight: '900', paddingHorizontal: 7 },
  themeStateSelected: { color: COLORS.green },
});
