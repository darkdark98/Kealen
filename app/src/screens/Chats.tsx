import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, GradientButton } from '../components/ui';
import { useNav } from '../nav';
import { useStore } from '../store';
import { colors } from '../theme';

function timeLabel(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toTimeString().slice(0, 5);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function Chats() {
  const { conversations, getCharacter } = useStore();
  const nav = useNav();
  const insets = useSafeAreaInsets();

  const rows = Object.entries(conversations)
    .map(([id, msgs]) => ({ id, c: getCharacter(id), last: msgs[msgs.length - 1] }))
    .filter((r) => r.c && r.last)
    .sort((a, b) => b.last!.createdAt - a.last!.createdAt);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Text style={styles.title}>Tin nhắn</Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 48 }}>💌</Text>
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 16 }}>
              Chưa có cuộc trò chuyện nào.{'\n'}Hãy tìm một nhân vật bạn thích.
            </Text>
            <GradientButton title="Khám phá nhân vật" onPress={() => nav.setTab('discover')} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => nav.push({ name: 'chat', id: item.id })}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.bgElevated }]}
          >
            <Avatar character={item.c!} size={54} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.name}>{item.c!.name}</Text>
                <Text style={styles.time}>{timeLabel(item.last!.createdAt)}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {item.last!.role === 'user' ? 'Bạn: ' : ''}
                {item.last!.content.replace(/\*/g, '')}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '800', paddingHorizontal: 16, marginTop: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  time: { color: colors.textMuted, fontSize: 12 },
  preview: { color: colors.textMuted, marginTop: 4, fontSize: 14 },
});
