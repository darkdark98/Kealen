import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { avatarUrl } from '../data/characters';
import { colors, gradient, radius } from '../theme';
import { Character } from '../types';

export function Avatar({ character, size = 48 }: { character: Character; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <LinearGradient
      colors={character.colors}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
    >
      {failed ? (
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>{character.name[0]}</Text>
      ) : (
        <Image
          source={{ uri: avatarUrl(character.avatarSeed) }}
          style={{ width: size, height: size }}
          onError={() => setFailed(true)}
        />
      )}
    </LinearGradient>
  );
}

export function GradientButton({
  title,
  onPress,
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{title}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({ title, onPress, danger }: { title: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghost, { opacity: pressed ? 0.7 : 1 }]}>
      <Text style={[styles.ghostText, danger && { color: colors.danger }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }, props.style]} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

/** Renders roleplay text: *actions* in italics, the rest normal. */
export function RichText({ text, color }: { text: string; color: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <Text style={{ color, fontSize: 15.5, lineHeight: 22 }}>
      {parts.map((p, i) =>
        p.startsWith('*') && p.endsWith('*') && p.length > 2 ? (
          <Text key={i} style={{ fontStyle: 'italic', color: color === '#fff' ? '#FFE3F1' : colors.textMuted }}>
            {p.slice(1, -1)}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  btn: { height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghost: { height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  ghostText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  label: { color: colors.text, fontWeight: '700', marginBottom: 8, fontSize: 14 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  input: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
});
