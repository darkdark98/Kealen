import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Chip, Field, GradientButton } from '../components/ui';
import { CARD_COLORS, TAGS } from '../data/characters';
import { useNav } from '../nav';
import { uid, useStore } from '../store';
import { colors } from '../theme';
import { Character, Gender } from '../types';

// Hard rules checked before saving. A real app needs server-side moderation as well.
const BANNED = [/trẻ em/i, /\bbé gái\b/i, /\bbé trai\b/i, /học sinh tiểu học/i, /\b(1[0-7]|[1-9]) tuổi\b/i, /child/i, /minor/i, /loli/i, /shota/i];

const GENDERS: { key: Gender; label: string }[] = [
  { key: 'female', label: 'Nữ' },
  { key: 'male', label: 'Nam' },
  { key: 'other', label: 'Khác' },
];

export default function Create() {
  const { addCharacter } = useStore();
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [tagline, setTagline] = useState('');
  const [personality, setPersonality] = useState('');
  const [scenario, setScenario] = useState('');
  const [greeting, setGreeting] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [colorIdx, setColorIdx] = useState(0);

  const preview: Character = {
    id: 'preview',
    name: name || '?',
    gender,
    tagline,
    personality,
    scenario,
    greeting,
    tags,
    colors: CARD_COLORS[colorIdx],
    avatarSeed: name || 'preview',
    chats: 0,
  };

  const valid = name.trim() && tagline.trim() && personality.trim() && greeting.trim();

  function save() {
    const all = [name, tagline, personality, scenario, greeting].join(' ');
    if (BANNED.some((r) => r.test(all))) {
      Alert.alert('Không thể tạo nhân vật', 'Nhân vật phải từ 18 tuổi trở lên và không được liên quan đến trẻ vị thành niên.');
      return;
    }
    const c: Character = { ...preview, id: uid(), name: name.trim(), avatarSeed: name.trim() + Date.now(), custom: true };
    addCharacter(c);
    setName('');
    setTagline('');
    setPersonality('');
    setScenario('');
    setGreeting('');
    setTags([]);
    nav.push({ name: 'character', id: c.id });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tạo nhân vật</Text>
        <Text style={styles.sub}>Thiết kế một nhân vật AI của riêng bạn.</Text>

        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Avatar character={preview} size={110} />
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            {CARD_COLORS.map((cc, i) => (
              <Text key={i} onPress={() => setColorIdx(i)} style={[styles.swatch, { backgroundColor: cc[0], borderColor: i === colorIdx ? '#fff' : 'transparent' }]} />
            ))}
          </View>
          <Text style={styles.hint}>Ảnh đại diện được tạo tự động theo tên</Text>
        </View>

        <Field label="Tên nhân vật *" value={name} onChangeText={setName} placeholder="Ví dụ: Hạo Thiên" maxLength={30} />
        <Text style={styles.label}>Giới tính</Text>
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          {GENDERS.map((g) => (
            <Chip key={g.key} label={g.label} active={gender === g.key} onPress={() => setGender(g.key)} />
          ))}
        </View>
        <Field label="Mô tả ngắn *" value={tagline} onChangeText={setTagline} placeholder="Một câu giới thiệu hấp dẫn" maxLength={80} />
        <Field
          label="Tính cách *"
          value={personality}
          onChangeText={setPersonality}
          multiline
          placeholder="Lạnh lùng, ít nói nhưng rất quan tâm..."
          maxLength={800}
        />
        <Field
          label="Bối cảnh"
          value={scenario}
          onChangeText={setScenario}
          multiline
          placeholder="Hai người gặp nhau ở đâu, trong hoàn cảnh nào..."
          maxLength={800}
        />
        <Field
          label="Lời chào đầu tiên *"
          value={greeting}
          onChangeText={setGreeting}
          multiline
          placeholder="*mỉm cười* Cuối cùng bạn cũng đến rồi."
          hint="Dùng *dấu sao* để mô tả hành động."
          maxLength={600}
        />
        <Text style={styles.label}>Thể loại</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24, rowGap: 8 }}>
          {TAGS.slice(1).map((t) => (
            <Chip key={t} label={t} active={tags.includes(t)} onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} />
          ))}
        </View>

        <GradientButton title="Tạo nhân vật" disabled={!valid} onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  sub: { color: colors.textMuted, marginTop: 4 },
  label: { color: colors.text, fontWeight: '700', marginBottom: 8, fontSize: 14 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
  swatch: { width: 28, height: 28, borderRadius: 14, marginHorizontal: 5, borderWidth: 2, overflow: 'hidden' },
});
