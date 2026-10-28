import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_MODEL } from './ai';
import { SEED_CHARACTERS } from './data/characters';
import { Character, Message, Profile, Settings, Wallet } from './types';

export const DAILY_FREE = 30;
export const CHECKIN_BONUS = 10;

interface State {
  profile: Profile;
  settings: Settings;
  wallet: Wallet;
  customCharacters: Character[];
  conversations: Record<string, Message[]>;
}

const today = () => new Date().toISOString().slice(0, 10);

const initialState: State = {
  profile: { name: '', onboarded: false, preferredGender: 'all' },
  settings: { apiKey: '', model: DEFAULT_MODEL, userPersona: '' },
  wallet: { credits: DAILY_FREE, lastRefill: today(), lastCheckin: '', streak: 0 },
  customCharacters: [],
  conversations: {},
};

const STORAGE_KEY = 'kealen-state-v1';

interface Ctx extends State {
  ready: boolean;
  characters: Character[];
  getCharacter: (id: string) => Character | undefined;
  setProfile: (p: Partial<Profile>) => void;
  setSettings: (s: Partial<Settings>) => void;
  setMessages: (charId: string, msgs: Message[]) => void;
  deleteConversation: (charId: string) => void;
  addCharacter: (c: Character) => void;
  deleteCharacter: (id: string) => void;
  spendCredit: () => boolean;
  checkin: () => boolean;
  resetAll: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<State>;
          setState((s) => ({
            ...s,
            ...saved,
            profile: { ...s.profile, ...saved.profile },
            settings: { ...s.settings, ...saved.settings },
            wallet: { ...s.wallet, ...saved.wallet },
          }));
        }
      } catch {}
      loaded.current = true;
      setReady(true);
    })();
  }, []);

  // Daily refill of free messages.
  useEffect(() => {
    if (!ready) return;
    setState((s) =>
      s.wallet.lastRefill === today()
        ? s
        : { ...s, wallet: { ...s.wallet, credits: Math.max(s.wallet.credits, DAILY_FREE), lastRefill: today() } },
    );
  }, [ready]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const characters = useMemo(() => [...state.customCharacters, ...SEED_CHARACTERS], [state.customCharacters]);

  const getCharacter = useCallback((id: string) => characters.find((c) => c.id === id), [characters]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const spendCredit = useCallback(() => {
    if (stateRef.current.wallet.credits <= 0) return false;
    setState((s) => ({ ...s, wallet: { ...s.wallet, credits: Math.max(0, s.wallet.credits - 1) } }));
    return true;
  }, []);

  const checkin = useCallback(() => {
    const w = stateRef.current.wallet;
    if (w.lastCheckin === today()) return false;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak = w.lastCheckin === yesterday ? w.streak + 1 : 1;
    setState((s) => ({
      ...s,
      wallet: { ...s.wallet, credits: s.wallet.credits + CHECKIN_BONUS, lastCheckin: today(), streak },
    }));
    return true;
  }, []);

  const value: Ctx = {
    ...state,
    ready,
    characters,
    getCharacter,
    setProfile: (p) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
    setSettings: (p) => setState((s) => ({ ...s, settings: { ...s.settings, ...p } })),
    setMessages: (charId, msgs) =>
      setState((s) => ({ ...s, conversations: { ...s.conversations, [charId]: msgs } })),
    deleteConversation: (charId) =>
      setState((s) => {
        const { [charId]: _, ...rest } = s.conversations;
        return { ...s, conversations: rest };
      }),
    addCharacter: (c) => setState((s) => ({ ...s, customCharacters: [c, ...s.customCharacters] })),
    deleteCharacter: (id) =>
      setState((s) => {
        const { [id]: _, ...rest } = s.conversations;
        return { ...s, customCharacters: s.customCharacters.filter((c) => c.id !== id), conversations: rest };
      }),
    spendCredit,
    checkin,
    resetAll: () => setState({ ...initialState, wallet: { ...initialState.wallet, lastRefill: today() } }),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
