import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavContext, Nav, Route, TabName } from './src/nav';
import CharacterProfile from './src/screens/CharacterProfile';
import Chat from './src/screens/Chat';
import Chats from './src/screens/Chats';
import Create from './src/screens/Create';
import Discover from './src/screens/Discover';
import Me from './src/screens/Me';
import Onboarding from './src/screens/Onboarding';
import { StoreProvider, useStore } from './src/store';
import { colors } from './src/theme';

const TABS: { key: TabName; label: string; icon: string }[] = [
  { key: 'discover', label: 'Khám phá', icon: '✦' },
  { key: 'chats', label: 'Tin nhắn', icon: '💬' },
  { key: 'create', label: 'Tạo', icon: '＋' },
  { key: 'me', label: 'Tôi', icon: '☺' },
];

function Root() {
  const { ready, profile } = useStore();
  const [stack, setStack] = useState<Route[]>([{ name: 'tabs' }]);
  const [tab, setTab] = useState<TabName>('discover');

  const nav: Nav = useMemo(
    () => ({
      push: (r) => setStack((s) => [...s, r]),
      replace: (r) => setStack((s) => [...s.slice(0, -1), r]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      setTab: (t) => {
        setStack([{ name: 'tabs' }]);
        setTab(t);
      },
    }),
    [],
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        nav.back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, nav]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!profile.onboarded) return <Onboarding />;

  const top = stack[stack.length - 1];

  return (
    <NavContext.Provider value={nav}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Tabs stay mounted underneath so their scroll position is kept. */}
        <View style={{ flex: 1, display: top.name === 'tabs' ? 'flex' : 'none' }}>
          <View style={{ flex: 1 }}>
            {tab === 'discover' && <Discover />}
            {tab === 'chats' && <Chats />}
            {tab === 'create' && <Create />}
            {tab === 'me' && <Me />}
          </View>
          <TabBar tab={tab} onChange={setTab} />
        </View>
        {top.name === 'character' && <CharacterProfile key={top.id} id={top.id} />}
        {top.name === 'chat' && <Chat key={top.id} id={top.id} />}
      </View>
    </NavContext.Provider>
  );
}

function TabBar({ tab, onChange }: { tab: TabName; onChange: (t: TabName) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((t) => {
        const active = tab === t.key;
        return (
          <Pressable key={t.key} onPress={() => onChange(t.key)} style={styles.tabItem}>
            <Text style={[styles.tabIcon, { color: active ? colors.primary : colors.textMuted, opacity: active ? 1 : 0.7 }]}>{t.icon}</Text>
            <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.textMuted }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 11, marginTop: 2, fontWeight: '600' },
});
