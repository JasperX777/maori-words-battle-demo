# Current Functionality

This document describes what is implemented in the current Māori Words Battle Demo. It intentionally separates working local-demo behaviour from planned cloud and release functionality.

## Technology and runtime

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- `expo-sqlite/kv-store` for local profile persistence
- optional Supabase client and database schema for a later cloud milestone

The app runs in Expo Go without Supabase credentials. Multiplayer participants and opponent scores are simulated locally so one phone can demonstrate the full game flow.

## Mock sign-in

The app opens on a sign-in page with **Continue with Google** and **Continue with Facebook**. Both buttons simulate a successful sign-in and open the home screen. This page does not contact Google or Facebook, request account data, store tokens, or create a cloud session. Real OAuth and user profiles remain part of the Supabase authentication milestone.

## Home screen

The home screen provides these entry points:

- **How to play** — explains room setup, timed questions, scoring, combos, feedback, and Koru Point rewards.
- **Shop** — shows the current Koru Point balance and redeemable collection items.
- **Home style** — switches between four app-wide colour themes.
- **Create a battle** — opens host room configuration.
- **Join with room code** — accepts any 4–6 character code in the local demo.
- **Daily Māori** — displays the current example daily word.
- **Your learning** — displays example progress and links to unfamiliar words.
- **Learn Mode** — currently a visual preview card only.

The available home styles are:

| Theme | Visual direction |
| --- | --- |
| Ngahere | Native forest greens |
| Moana | Coastal blues |
| Tōnga rā | Warm sunset colours |
| Pō | Night-sky colours |

The selected style supplies the background, primary-button, selection, room-code, progress, and answer-state colours across the home screen, room setup, lobby, and battle flow.

## How to play

The guide presents the working flow:

1. Create a room or join using a code.
2. Answer the same timed question as the other players.
3. Earn more battle score for correct, faster answers.
4. Build a combo through consecutive correct answers.
5. Review the correct word, meaning, pronunciation guide, and example sentence.
6. Finish the game to convert battle score into Koru Points.

## Room and lobby

A host can configure:

- difficulty level 1, 2, or 3;
- category;
- 5, 8, or 10 rounds;
- 2, 4, or 6 maximum players.

New rooms default to **Level 1 — Kākano (Beginner)**, five rounds, all topics, and four maximum players.

The lobby displays a generated room code, simulated players, readiness state, and the selected battle settings. The room code can be copied to the device clipboard for inviting friends. A room created from **Create a battle** makes the current player the host. The host can:

- edit difficulty, category, rounds, and maximum players without leaving the lobby;
- tap another player's avatar to reveal the **Remove** control, then remove that player;
- copy the room code;
- select **I’m ready** or **Cancel ready**.

The number of seat rows always matches the room capacity. Removing a player lowers the occupied count and turns one row into an **Open** waiting slot instead of visually shrinking the room. Players who join by room code do not receive host removal controls.

The battle start button remains disabled while settings are being edited or until every occupied player is ready. Simulated players are preset as ready so this rule can be demonstrated on one device. Real cross-device host permissions and invitations are reserved for the Supabase multiplayer milestone.

## Question levels

### Level 1 — Kākano

- picture or English prompt;
- multiple-choice Māori answers.

### Level 2 — Tipu

- Māori word or pronunciation prompt;
- matching English meaning.

The pronunciation button is currently visual only; recorded audio is not included yet.

### Level 3 — Rākau

- typed Māori answer;
- fewer hints;
- typed answers accept the correct spelling with or without macrons.

## Battle scoring

For a correct answer:

```text
100 base score + 5 × remaining seconds
```

Additional bonuses:

- third consecutive correct answer: `+10`;
- fifth consecutive correct answer: `+20`;
- correct answer in the final round: `+50`.

An incorrect answer scores `0` and resets the combo. Simulated opponents receive locally generated scores.

## Learning feedback

After every answer, the player sees:

- whether the answer was correct;
- Māori word;
- English meaning;
- pronunciation guide;
- example sentence;
- battle score earned.

Incorrect words are added to the in-memory unfamiliar-word list for the current app session.

## Leaderboard and results

The app displays an intermediate leaderboard after every three completed questions. The final results page includes:

- player placement;
- final battle score;
- correct-answer count;
- accuracy;
- unfamiliar-word count;
- final simulated ranking;
- Koru Points earned and new balance.

## Koru Points

Koru Points are the shop currency.

```text
20 battle score = 1 Koru Point
```

Conversion uses whole points only. For example, a final score of `437` earns `21` Koru Points. A result is awarded once per completed game, so revisiting the results page cannot claim the reward again.

New local profiles start with `120` Koru Points as a demo welcome balance.

## Koru Shop

The current collection contains:

| Item | Category | Price |
| --- | --- | ---: |
| Tūī avatar | Avatar | 45 |
| Koru profile frame | Profile | 70 |
| Victory burst | Celebration | 90 |
| Whare sticker pack | Sticker | 120 |

Redeeming an item deducts its price and marks it as owned. Owned items cannot be purchased twice. The current milestone stores collection ownership; equipping cosmetics in profiles and rooms is planned but not implemented.

## Local persistence

These values persist across app restarts on the same device:

- Koru Point balance;
- owned shop item IDs;
- selected home theme.

They are stored through `expo-sqlite/kv-store` under the key:

```text
maori-words-battle-profile-v1
```

Room state, match results, and unfamiliar words are currently held in React state and reset when the app process restarts.

## Supabase-ready components

The repository includes:

- `src/lib/supabase.ts` — optional client initialisation using Expo public environment variables;
- `supabase/schema.sql` — starter tables, RLS policies, and Realtime publication settings.

The current UI is not yet connected to those tables. The following features remain planned:

- Google/Facebook/Apple authentication;
- real cross-device rooms and presence;
- server-authoritative timers, answers, and scoring;
- cloud profile, points, shop, and progress persistence;
- friend requests;
- native pronunciation audio;
- production moderation and anti-cheat controls;
- educator and iwi review of Māori and Whakatōhea content;
- store-ready Android and iOS release builds.

## Manual verification checklist

1. Cold-start the app, select each mock sign-in provider, and confirm both open the home screen.
2. Open **How to play** from the home screen and return.
3. Select each home style, restart the app, and confirm the last choice remains selected.
4. Open the shop and redeem an affordable item.
5. Restart the app and confirm the balance and owned state remain.
6. Create a five-round room and finish the game.
7. Copy the room code and confirm the button displays **Copied**.
8. Edit each battle setting in the lobby and confirm the summary updates after selecting **Done**.
9. As the host, tap a simulated player's avatar, select **Remove**, and confirm the player count decreases while the same number of seat rows remains visible.
10. Confirm **Start battle** is disabled in the lobby, select **I’m ready**, and confirm it becomes enabled.
11. Confirm the results page shows the battle-score conversion and updated balance.
12. Open unfamiliar words, return to results, and confirm points are not awarded twice.
