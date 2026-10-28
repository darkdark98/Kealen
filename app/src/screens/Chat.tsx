import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateReply } from '../ai';
import { Avatar, RichText } from '../components/ui';
import { useNav } from '../nav';
import { uid, useStore } from '../store';
import { colors, radius } from '../theme';
import { Message } from '../types';

export default function Chat({ id }: { id: string }) {
  const store = useStore();
  const { getCharacter, conversations, setMessages, settings, profile, wallet, spendCredit, deleteConversation } = store;
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const c = getCharacter(id);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messages = conversations[id] ?? [];
  const msgsRef = useRef(messages);
  msgsRef.current = messages;

  useEffect(() => {
    if (c && messages.length === 0) {
      setMessages(id, [{ id: uid(), role: 'assistant', content: c.greeting, createdAt: Date.now() }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, c]);

  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  if (!c) return null;

  const outOfCredits = () =>
    Alert.alert('Hết lượt trò chuyện', 'Bạn đã dùng hết lượt hôm nay. Điểm danh ở tab "Tôi" để nhận thêm lượt, hoặc quay lại vào ngày mai.', [
      { text: 'Để sau', style: 'cancel' },
      {
        text: 'Đi điểm danh',
        onPress: () => {
          nav.back();
          nav.setTab('me');
        },
      },
    ]);

  async function requestReply(history: Message[]) {
    setBusy(true);
    setError(null);
    try {
      const reply = await generateReply(c!, history, settings, profile.name);
      setMessages(id, [...msgsRef.current, { id: uid(), role: 'assistant', content: reply, createdAt: Date.now() }]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (e: any) {
      setError(e?.message ?? 'Không gửi được tin nhắn.');
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    if (!spendCredit()) return outOfCredits();
    const next = [...messages, { id: uid(), role: 'user' as const, content: text, createdAt: Date.now() }];
    setMessages(id, next);
    setInput('');
    await requestReply(next);
  }

  async function regenerate() {
    if (busy) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant' || messages.length < 2) return;
    if (!spendCredit()) return outOfCredits();
    const history = messages.slice(0, -1);
    setMessages(id, history);
    await requestReply(history);
  }

  async function retry() {
    if (busy) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'user') await requestReply(messages);
  }

  function onLongPress(m: Message) {
    Alert.alert('Tin nhắn', undefined, [
      {
        text: 'Xóa tin nhắn này',
        style: 'destructive',
        onPress: () => setMessages(id, messages.filter((x) => x.id !== m.id)),
      },
      { text: 'Hủy', style: 'cancel' },
    ]);
  }

  function menu() {
    Alert.alert(c!.name, undefined, [
      { text: 'Xem hồ sơ nhân vật', onPress: () => nav.push({ name: 'character', id }) },
      {
        text: 'Bắt đầu lại cuộc trò chuyện',
        style: 'destructive',
        onPress: () => {
          deleteConversation(id);
          setMessages(id, [{ id: uid(), role: 'assistant', content: c!.greeting, createdAt: Date.now() }]);
        },
      },
      { text: 'Đóng', style: 'cancel' },
    ]);
  }

  const lastId = messages[messages.length - 1]?.id;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={[c.colors[0] + '55', colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={nav.back} hitSlop={12} style={styles.iconBtn}>
          <Text style={styles.icon}>‹</Text>
        </Pressable>
        <Pressable onPress={() => nav.push({ name: 'character', id })} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Avatar character={c} size={38} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>
              {c.name}
            </Text>
            <Text style={styles.headerSub}>{busy ? 'đang nhập...' : 'đang hoạt động'}</Text>
          </View>
        </Pressable>
        <Text style={styles.credits}>💬 {wallet.credits}</Text>
        <Pressable onPress={menu} hitSlop={12} style={styles.iconBtn}>
          <Text style={[styles.icon, { fontSize: 22 }]}>⋯</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          inverted
          data={reversed}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 14 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              {busy ? (
                <View style={[styles.bubble, styles.ai, { flexDirection: 'row', alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, marginLeft: 8 }}>{c.name} đang nhập...</Text>
                </View>
              ) : null}
              {error ? (
                <Pressable onPress={retry} style={styles.error}>
                  <Text style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>
                  <Text style={{ color: colors.text, fontSize: 13, marginTop: 4, fontWeight: '700' }}>Chạm để thử lại</Text>
                </Pressable>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.role === 'user';
            return (
              <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                <Pressable onLongPress={() => onLongPress(item)} style={[styles.bubble, mine ? styles.me : styles.ai]}>
                  <RichText text={item.content} color={mine ? '#fff' : colors.text} />
                </Pressable>
                {!mine && item.id === lastId && messages.length > 1 && !busy ? (
                  <Pressable onPress={regenerate} hitSlop={8}>
                    <Text style={styles.regen}>↻ Tạo câu trả lời khác</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          }}
        />

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={`Nhắn cho ${c.name}...`}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            maxLength={1000}
          />
          <Pressable onPress={send} disabled={!input.trim() || busy} style={{ opacity: !input.trim() || busy ? 0.4 : 1 }}>
            <LinearGradient colors={[colors.primary, colors.primary2]} style={styles.sendBtn}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>↑</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(14,10,26,0.7)',
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  icon: { color: colors.text, fontSize: 30, fontWeight: '600', marginTop: -2 },
  headerName: { color: colors.text, fontWeight: '800', fontSize: 16 },
  headerSub: { color: colors.success, fontSize: 12 },
  credits: { color: colors.text, fontWeight: '700', marginRight: 4, fontSize: 13 },
  bubble: { maxWidth: '84%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  me: { backgroundColor: colors.bubbleMe, borderBottomRightRadius: 6 },
  ai: { backgroundColor: colors.bubbleAi, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: colors.border },
  regen: { color: colors.textMuted, fontSize: 12, marginTop: 6, marginLeft: 6 },
  error: { backgroundColor: colors.card, borderRadius: radius.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.danger },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: colors.bgElevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.text,
    backgroundColor: colors.bg,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 15,
    maxHeight: 120,
    marginRight: 8,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
