-- Demo schema for Māori Words Battle.
-- Run this in the Supabase SQL editor, then configure the Expo public values.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  avatar text not null default '🦅',
  created_at timestamptz not null default now()
);

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  host_id uuid not null references public.profiles(id),
  difficulty smallint not null check (difficulty between 1 and 3),
  category text not null,
  round_count smallint not null check (round_count between 1 and 20),
  max_players smallint not null check (max_players between 2 and 8),
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  created_at timestamptz not null default now()
);

create table if not exists public.room_players (
  room_id uuid references public.game_rooms(id) on delete cascade,
  player_id uuid references public.profiles(id) on delete cascade,
  score integer not null default 0,
  combo integer not null default 0,
  correct_count integer not null default 0,
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, player_id)
);

create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  maori_word text not null,
  english_meaning text not null,
  pronunciation text,
  example_sentence text,
  category text not null,
  difficulty smallint not null check (difficulty between 1 and 3),
  region text,
  is_verified boolean not null default false
);

create table if not exists public.unfamiliar_words (
  user_id uuid references public.profiles(id) on delete cascade,
  vocabulary_id uuid references public.vocabulary(id) on delete cascade,
  miss_count integer not null default 1,
  last_missed_at timestamptz not null default now(),
  primary key (user_id, vocabulary_id)
);

alter table public.profiles enable row level security;
alter table public.game_rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.vocabulary enable row level security;
alter table public.unfamiliar_words enable row level security;

create policy "profiles are readable by signed in users"
on public.profiles for select to authenticated using (true);

create policy "users update their own profile"
on public.profiles for all to authenticated
using (auth.uid() = id) with check (auth.uid() = id);

create policy "signed in users can read rooms"
on public.game_rooms for select to authenticated using (true);

create policy "hosts manage their rooms"
on public.game_rooms for all to authenticated
using (auth.uid() = host_id) with check (auth.uid() = host_id);

create policy "signed in users can read room players"
on public.room_players for select to authenticated using (true);

create policy "users manage their room membership"
on public.room_players for all to authenticated
using (auth.uid() = player_id) with check (auth.uid() = player_id);

create policy "verified vocabulary is readable"
on public.vocabulary for select to authenticated using (is_verified = true);

create policy "users manage their unfamiliar words"
on public.unfamiliar_words for all to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.game_rooms;
alter publication supabase_realtime add table public.room_players;
