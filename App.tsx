import { StatusBar } from 'expo-status-bar';
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
import { Category, Difficulty, Player, Question, RoomSettings, Screen } from './src/types';

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
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  wide?: boolean;
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
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress, icon, disabled = false }: { label: string; onPress: () => void; icon?: string; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, disabled && styles.buttonDisabled, pressed && !disabled && styles.pressed]}
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
  const [screen, setScreen] = useState<Screen>('home');
  const [settings, setSettings] = useState<RoomSettings>({ difficulty: 2, rounds: 5, category: 'All topics', maxPlayers: 4 });
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

  const me = players.find((player) => player.isMe) ?? players[0];
  const question = roundQuestions[questionIndex];
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);

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
    setScreen('lobby');
  };

  const startGame = () => {
    setPlayers((current) => current.map((player) => ({ ...player, score: 0, combo: 0, correct: 0 })));
    setRoundQuestions(makeRoundQuestions(settings));
    setQuestionIndex(0);
    setSelectedAnswer('');
    setTypedAnswer('');
    setTimeLeft(15);
    setScreen('question');
  };

  const advanceRound = () => {
    if (questionIndex >= roundQuestions.length - 1) {
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

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      <View style={styles.homeTopBar}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
        <View style={styles.homeTopText}>
          <Text style={styles.kicker}>KIA ORA, KAHU</Text>
          <Text style={styles.homeTitle}>Ready to learn?</Text>
        </View>
        <View style={styles.streakPill}><Text style={styles.streakText}>🔥 7</Text></View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroOrbOne} />
        <View style={styles.heroOrbTwo} />
        <Text style={styles.heroEyebrow}>LIVE CHALLENGE</Text>
        <Text style={styles.heroTitle}>Māori Words{`\n`}Battle</Text>
        <Text style={styles.heroSubtitle}>Learn together. Battle kindly. Grow your reo.</Text>
        <View style={styles.heroPlayers}>
          <Text style={styles.heroAvatars}>🦅  🌺  🐋</Text>
          <Text style={styles.heroPlayersText}>128 learners online</Text>
        </View>
        <PrimaryButton label="Create a battle" icon="⚔️" onPress={() => setScreen('setup')} />
        <Pressable onPress={() => setScreen('join')} style={styles.heroJoinButton}>
          <Text style={styles.heroJoinText}>Join with room code</Text>
        </Pressable>
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
            style={[styles.levelCard, settings.difficulty === item.value && styles.levelCardSelected]}
          >
            <View style={[styles.levelNumber, settings.difficulty === item.value && styles.levelNumberSelected]}>
              <Text style={[styles.levelNumberText, settings.difficulty === item.value && styles.levelNumberTextSelected]}>{item.value}</Text>
            </View>
            <View style={styles.levelCopy}>
              <Text style={styles.levelTitle}>{item.label}</Text>
              <Text style={styles.levelDetail}>{item.detail}</Text>
            </View>
            <Text style={styles.levelCheck}>{settings.difficulty === item.value ? '●' : '○'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>CATEGORY</Text>
      <View style={styles.chipWrap}>
        {CATEGORIES.map((item) => (
          <ChoiceChip
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
          <ChoiceChip key={rounds} label={`${rounds}`} selected={settings.rounds === rounds} onPress={() => setSettings({ ...settings, rounds })} wide />
        ))}
      </View>

      <Text style={styles.fieldLabel}>MAX PLAYERS</Text>
      <View style={styles.segmentedControl}>
        {[2, 4, 6].map((maxPlayers) => (
          <ChoiceChip key={maxPlayers} label={`${maxPlayers}`} selected={settings.maxPlayers === maxPlayers} onPress={() => setSettings({ ...settings, maxPlayers })} wide />
        ))}
      </View>

      <PrimaryButton label="Create room" onPress={() => openLobby()} icon="＋" />
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
        <PrimaryButton label="Join room" onPress={() => openLobby(true)} disabled={joinCode.trim().length < 4} />
        <Text style={styles.demoHint}>Demo tip: enter any 4–6 characters to join the simulated room.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderLobby = () => (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <AppHeader title="Game lobby" onBack={() => setScreen('home')} trailing="•••" />
      <View style={styles.roomCodeCard}>
        <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
        <Text style={styles.roomCode}>{roomCode}</Text>
        <Text style={styles.roomCodeHelp}>Share this code with your friends</Text>
      </View>

      <View style={styles.lobbyHeading}>
        <Text style={styles.sectionTitle}>Players</Text>
        <Text style={styles.playerCount}>{players.length}/{settings.maxPlayers}</Text>
      </View>
      <View style={styles.playerList}>
        {players.slice(0, settings.maxPlayers).map((player) => (
          <View key={player.id} style={styles.playerRow}>
            <View style={styles.playerAvatar}><Text style={styles.playerAvatarText}>{player.avatar}</Text></View>
            <View style={styles.playerNameWrap}>
              <Text style={styles.playerName}>{player.name}{player.isMe ? '  (you)' : ''}</Text>
              <Text style={styles.playerStatus}>{player.ready ? 'Ready to battle' : 'Choosing an avatar…'}</Text>
            </View>
            <Text style={[styles.readyState, !player.ready && styles.waitingState]}>{player.ready ? '✓ READY' : 'WAITING'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.settingsSummary}>
        <Text style={styles.summaryTitle}>Battle settings</Text>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Difficulty</Text><Text style={styles.summaryValue}>Level {settings.difficulty}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Category</Text><Text style={styles.summaryValue}>{settings.category}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Rounds</Text><Text style={styles.summaryValue}>{settings.rounds}</Text></View>
      </View>
      <PrimaryButton label="Start battle" icon="⚔️" onPress={startGame} />
      <Text style={styles.demoHint}>This demo fills the room with simulated players.</Text>
    </ScrollView>
  );

  const renderQuestion = () => {
    if (!question) return null;
    const isFinal = questionIndex === roundQuestions.length - 1;
    const answerValue = question.level === 3 ? typedAnswer : selectedAnswer;
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.gameContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.gameHeader}>
            <View><Text style={styles.gameRound}>{isFinal ? 'FINAL ROUND' : `ROUND ${questionIndex + 1} OF ${roundQuestions.length}`}</Text><Text style={styles.gameCategory}>{question.category}</Text></View>
            <View style={styles.scorePill}><Text style={styles.scorePillText}>★ {me.score}</Text></View>
          </View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((questionIndex + 1) / roundQuestions.length) * 100}%` }]} /></View>

          <View style={[styles.timerRing, timeLeft <= 5 && styles.timerRingUrgent]}>
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
              style={styles.answerInput}
            />
          ) : (
            <View style={styles.answerGrid}>
              {question.options.map((option, index) => (
                <Pressable
                  key={option}
                  onPress={() => setSelectedAnswer(option)}
                  style={[styles.answerOption, selectedAnswer === option && styles.answerOptionSelected]}
                >
                  <View style={[styles.answerLetter, selectedAnswer === option && styles.answerLetterSelected]}>
                    <Text style={[styles.answerLetterText, selectedAnswer === option && styles.answerLetterTextSelected]}>{String.fromCharCode(65 + index)}</Text>
                  </View>
                  <Text style={[styles.answerText, selectedAnswer === option && styles.answerTextSelected]}>{option}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <PrimaryButton label="Lock in answer" onPress={() => submitAnswer(answerValue)} disabled={!answerValue.trim()} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderFeedback = () => {
    if (!question) return null;
    return (
      <ScrollView contentContainerStyle={styles.feedbackContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.feedbackBurst}>{lastCorrect ? '✓' : '↻'}</Text>
        <Text style={[styles.feedbackTitle, !lastCorrect && styles.feedbackTitleWrong]}>{lastCorrect ? 'Ka mau te wehi!' : 'Kia kaha!'}</Text>
        <Text style={styles.feedbackSubtitle}>{lastCorrect ? 'Awesome work!' : 'Keep going — this one is saved to review.'}</Text>
        <View style={styles.learningCard}>
          <Text style={styles.learningEmoji}>{question.emoji}</Text>
          <Text style={styles.learningWord}>{question.word}</Text>
          <Text style={styles.learningMeaning}>{question.english}</Text>
          <View style={styles.pronunciationPill}><Text style={styles.pronunciationPillText}>♪  /{question.pronunciation}/</Text></View>
          <View style={styles.learningDivider} />
          <Text style={styles.exampleLabel}>IN A SENTENCE</Text>
          <Text style={styles.exampleText}>{question.example}</Text>
        </View>
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>{lastCorrect ? 'POINTS EARNED' : 'LEARNING MOMENT'}</Text>
          <Text style={styles.pointsValue}>{lastCorrect ? `+${lastPoints}` : '+1 word to review'}</Text>
        </View>
        <PrimaryButton label={questionIndex === roundQuestions.length - 1 ? 'See final results' : 'Next question'} onPress={advanceRound} />
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
      <PrimaryButton label="Keep battling" onPress={continueFromLeaderboard} />
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

        <View style={styles.miniRanking}>
          {sortedPlayers.map((player, index) => (
            <View key={player.id} style={styles.miniRankRow}>
              <Text style={styles.miniRankNumber}>#{index + 1}</Text><Text style={styles.miniRankAvatar}>{player.avatar}</Text><Text style={styles.miniRankName}>{player.name}</Text><Text style={styles.miniRankScore}>{player.score}</Text>
            </View>
          ))}
        </View>
        <PrimaryButton label="Review unfamiliar words" icon="↻" onPress={() => setScreen('unfamiliar')} />
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
      <PrimaryButton label="Start a quick review" onPress={() => { setSettings({ ...settings, category: 'All topics', difficulty: 3, rounds: 5 }); setScreen('setup'); }} />
    </ScrollView>
  );

  const content: Record<Screen, () => React.ReactNode> = {
    home: renderHome,
    setup: renderSetup,
    join: renderJoin,
    lobby: renderLobby,
    question: renderQuestion,
    feedback: renderFeedback,
    leaderboard: renderLeaderboard,
    results: renderResults,
    unfamiliar: renderUnfamiliar,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
  homeTopBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  brandMark: { width: 44, height: 44, borderRadius: 15, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: 'white', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  homeTopText: { flex: 1, marginLeft: 12 },
  kicker: { color: COLORS.green, fontSize: 10, letterSpacing: 1.7, fontWeight: '800' },
  homeTitle: { color: COLORS.ink, fontSize: 22, fontWeight: '800', marginTop: 2 },
  streakPill: { backgroundColor: COLORS.goldSoft, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18 },
  streakText: { color: '#935E00', fontWeight: '800' },
  heroCard: { backgroundColor: COLORS.green, borderRadius: 28, padding: 24, overflow: 'hidden', minHeight: 382 },
  heroOrbOne: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#16866B', right: -45, top: -45 },
  heroOrbTwo: { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 24, borderColor: '#3E9B84', right: -16, bottom: 78, opacity: 0.46 },
  heroEyebrow: { color: '#A9E5D2', fontSize: 11, letterSpacing: 2, fontWeight: '900', marginTop: 2 },
  heroTitle: { color: 'white', fontSize: 39, lineHeight: 42, fontWeight: '900', marginTop: 10, letterSpacing: -1 },
  heroSubtitle: { color: '#D6F0E8', fontSize: 15, lineHeight: 21, maxWidth: 270, marginTop: 12 },
  heroPlayers: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 18 },
  heroAvatars: { fontSize: 18 },
  heroPlayersText: { color: '#D6F0E8', marginLeft: 10, fontSize: 12, fontWeight: '600' },
  heroJoinButton: { paddingVertical: 13, alignItems: 'center' },
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
  roomCodeHelp: { color: '#D5EEE7', fontSize: 11, marginTop: 7 },
  lobbyHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 10 },
  playerCount: { color: COLORS.green, fontWeight: '900', fontSize: 13 },
  playerList: { backgroundColor: COLORS.paper, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden' },
  playerRow: { flexDirection: 'row', alignItems: 'center', padding: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.line },
  playerAvatar: { width: 45, height: 45, borderRadius: 15, backgroundColor: COLORS.greenSoft, alignItems: 'center', justifyContent: 'center' },
  playerAvatarText: { fontSize: 23 },
  playerNameWrap: { flex: 1, marginLeft: 12 },
  playerName: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  playerStatus: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  readyState: { color: COLORS.green, fontWeight: '900', fontSize: 9 },
  waitingState: { color: '#AA7A26' },
  settingsSummary: { backgroundColor: COLORS.coralSoft, borderRadius: 18, padding: 16, marginTop: 17 },
  summaryTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '900', marginBottom: 7 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryLabel: { color: COLORS.muted, fontSize: 12 },
  summaryValue: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
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
});
