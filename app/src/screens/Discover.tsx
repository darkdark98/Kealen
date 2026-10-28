import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, formatCount } from '../components/ui';
import { TAGS, avatarUrl } from '../data/characters';
import { useNav } from '../nav';
import { useStore } from '../store';
import { colors, radius } from '../theme';
import { Character } from '../types';

export default function Discover() {
  const { characters, profile, wallet } = useStore();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [tag, setTag] = useState('Tất cả');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return characters
      .filter((c) => profile.preferredGender === 'all' || c.gender === profile.preferredGender || c.custom)
      .filter((c) => tag === 'Tất cả' || c.tags.includes(tag))
      .filter((c) => !query || c.name.toLowerCase().includes(query) || c.tagline.toLowerCase().includes(query));
  }, [characters, profile.preferredGender, tag, q]);

  const featured = characters.find((c) => c.id === 'kael') ?? characters[0];
  const cardW = (Math.min(width, 700) - 16 * 2 - 12) / 2;

  const header = (
    <View>
      <View style={styles.topRow}>
        <Text style={styles.title}>Khám phá</Text>
        <View style={styles.credit}>
          <Text style={styles.creditText}>💬 {wallet.credits}</Text>
        </View>
      </View>
      <TextInput
        placeholder="Tìm nhân vật..."
        placeholderTextColor={colors.textMuted}
        value={q}
        onChangeText={setQ}
        style={styles.search}
      />
      {featured && !q ? (
        <Pressable onPress={() => nav.push({ name: 'character', id: featured.id })}>
          <LinearGradient colors={featured.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerBadge}>🔥 Nổi bật tuần này</Text>
              <Text style={styles.bannerName}>{featured.name}</Text>
              <Text style={styles.bannerTag} numberOfLines={2}>
                {featured.tagline}
              </Text>
            </View>
            <Image source={{ uri: avatarUrl(featured.avatarSeed) }} style={{ width: 110, height: 110 }} />
          </LinearGradient>
        </Pressable>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 16 }}>
        {TAGS.map((t) => (
          <Chip key={t} label={t} active={tag === t} onPress={() => setTag(t)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        numColumns={2}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, maxWidth: 700, width: '100%', alignSelf: 'center' }}
        columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
        ListEmptyComponent={<Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>Không tìm thấy nhân vật.</Text>}
        renderItem={({ item }) => <CharacterCard c={item} width={cardW} onPress={() => nav.push({ name: 'character', id: item.id })} />}
      />
    </View>
  );
}

function CharacterCard({ c, width, onPress }: { c: Character; width: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ width, opacity: pressed ? 0.85 : 1 }]}>
      <LinearGradient colors={c.colors} style={[styles.card, { height: width * 1.35 }]}>
        <Text style={[styles.cardInitial, { fontSize: width * 0.55, top: width * 0.12 }]}>{c.name[0]}</Text>
        <Image source={{ uri: avatarUrl(c.avatarSeed) }} style={{ width: width * 0.9, height: width * 0.9, alignSelf: 'center', marginTop: 8 }} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardShade}>
          <Text style={styles.cardName} numberOfLines={1}>
            {c.name} {c.custom ? '✎' : ''}
          </Text>
          <Text style={styles.cardTag} numberOfLines={2}>
            {c.tagline}
          </Text>
          <Text style={styles.cardCount}>💬 {formatCount(c.chats)}</Text>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 12 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  credit: { backgroundColor: colors.bgElevated, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  creditText: { color: colors.text, fontWeight: '700' },
  search: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    marginBottom: 16,
  },
  banner: { borderRadius: radius.lg, padding: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  bannerBadge: { color: '#fff', fontSize: 12, fontWeight: '700', opacity: 0.9 },
  bannerName: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4 },
  bannerTag: { color: '#fff', opacity: 0.9, marginTop: 4, fontSize: 13 },
  card: { borderRadius: radius.md, overflow: 'hidden' },
  cardInitial: { position: 'absolute', alignSelf: 'center', color: 'rgba(255,255,255,0.25)', fontWeight: '900' },
  cardShade: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, paddingTop: 30 },
  cardName: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cardTag: { color: '#eee', fontSize: 12, marginTop: 2 },
  cardCount: { color: '#ddd', fontSize: 11, marginTop: 4 },
});
