# Māori Words Battle Demo

A polished React Native prototype for learning te reo Māori through friendly multiplayer vocabulary battles. Built with Expo, TypeScript, and a Supabase-ready data layer.

## Demo scope

The local demo works without an account or cloud project and includes:

- create-room and join-by-code flows;
- lobby settings for level, topic, rounds, and player count;
- beginner multiple choice, intermediate listening/matching, and advanced typed answers;
- shared timed rounds, speed scoring, combos, and a final-round bonus;
- immediate word, meaning, pronunciation, and example feedback;
- simulated opponents, mid-game leaderboard, and final results;
- automatic unfamiliar-word tracking;
- Māori and Whakatōhea-oriented starter content.

Simulated players are used so the full experience can be demonstrated on one device. Google/Facebook login, real cross-device rooms, audio playback, and production content review are the next integration steps; they are not represented as finished features in this repository.

## Run locally

Requirements: Node.js 20+ and Expo Go (SDK 54) or an Android/iOS simulator.

```bash
npm install
npm start
```

Then scan the QR code with Expo Go, or press `a` for Android / `i` for iOS.

Type-check the app with:

```bash
npm run typecheck
```

## Optional Supabase setup

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add the project URL and **publishable** key. Never add a service-role key to a mobile app.
5. Use `src/lib/supabase.ts` from the future auth and room repository modules.

The schema enables RLS and prepares Realtime for rooms and players. Before a public release, add server-authoritative scoring (for example, an Edge Function), stricter room membership policies, content moderation, abuse/rate controls, and verified cultural review for regional vocabulary.

## Suggested next milestone

Connect the existing screens to Supabase Auth and Realtime in this order:

1. Google/Apple/Facebook authentication and profile creation.
2. Room create/join subscriptions and ready state.
3. Server-owned question order, timer, answer validation, and scoring.
4. Persistent progress and spaced repetition for unfamiliar words.
5. Native pronunciation audio and educator-reviewed Whakatōhea content.
