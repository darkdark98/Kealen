import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GhostButton, GradientButton, RichText, formatCount } from '../components/ui';
import { avatarUrl } from '../data/characters';
import { useNav } from '../nav';
import { useStore } from '../store';
import { colors, radius } from '../theme';

export default function CharacterProfile({ id }: { id: string }) {
  const { getCharacter, deleteCharacter, conversations } = useStore();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const c = getCharacter(id);
  if (!c) return null;
  const hasChat = (conversations[id]?.length ?? 0) > 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <LinearGradient colors={c.colors} style={{ paddingTop: insets.top + 50, alignItems: 'center' }}>
          <Image source={{ uri: avatarUrl(c.avatarSeed) }} style={{ width: 240, height: 240 }} />
          <LinearGradient colors={['transparent', colors.bg]} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90 }} />
        </LinearGradient>
        <View style={{ padding: 20 }}>
          <Text style={styles.name}>{c.name}</Text>
          <Text style={styles.tagline}>{c.tagline}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 }}>
            {c.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>#{t}</Text>
              </View>
            ))}
            <View style={styles.tag}>
              <Text style={styles.tagText}>💬 {formatCount(c.chats)}</Text>
            </View>
          </View>

          <Section title="Bối cảnh">
            <Text style={styles.body}>{c.scenario}</Text>
          </Section>
          <Section title="Tính cách">
            <Text style={styles.body}>{c.personality}</Text>
          </Section>
          <Section title="Lời chào">
            <View style={styles.greeting}>
              <RichText text={c.greeting} color={colors.text} />
            </View>
          </Section>
          {c.custom ? (
            <View style={{ marginTop: 24 }}>
              <GhostButton
                danger
                title="Xóa nhân vật này"
                onPress={() =>
                  Alert.alert('Xóa nhân vật?', 'Cuộc trò chuyện với nhân vật cũng sẽ bị xóa.', [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: () => {
                        deleteCharacter(c.id);
                        nav.back();
                      },
                    },
                  ])
                }
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Pressable onPress={nav.back} style={[styles.backBtn, { top: insets.top + 8 }]}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>‹</Text>
      </Pressable>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <GradientButton title={hasChat ? 'Tiếp tục trò chuyện' : 'Bắt đầu trò chuyện'} onPress={() => nav.replace({ name: 'chat', id: c.id })} />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={styles.section}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.text, fontSize: 30, fontWeight: '900' },
  tagline: { color: colors.textMuted, fontSize: 15, marginTop: 4 },
  tag: { backgroundColor: colors.bgElevated, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  tagText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  section: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  greeting: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14 },
  backBtn: {
    position: 'absolute',
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'rgba(14,10,26,0.95)' },
});
