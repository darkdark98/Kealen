export type Gender = 'male' | 'female' | 'other';

export interface Character {
  id: string;
  name: string;
  gender: Gender;
  tagline: string;
  personality: string;
  scenario: string;
  greeting: string;
  tags: string[];
  colors: [string, string];
  avatarSeed: string;
  chats: number;
  custom?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface Settings {
  apiKey: string;
  model: string;
  userPersona: string;
}

export interface Wallet {
  credits: number;
  lastRefill: string; // YYYY-MM-DD
  lastCheckin: string; // YYYY-MM-DD
  streak: number;
}

export interface Profile {
  name: string;
  onboarded: boolean;
  preferredGender: Gender | 'all';
}
