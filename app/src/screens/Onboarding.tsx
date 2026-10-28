import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, Field, GradientButton } from '../components/ui';
import { useStore } from '../store';
import { colors } from '../theme';
import { Profile } from '../types';

const GENDERS: { key: Profile['preferredGender']; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'male', label: 'Nam' },
  { key: 'female', label: 'Nữ' },
];

export default function Onboarding() {
  const { setProfile } = useStore();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Profile['preferredGender']>('all');
  const [agree, setAgree] = useState(false);

  return (
    <LinearGradient colors={['#2A0F3D', colors.bg]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}>
          <Text style={styles.logo}>Kealen</Text>
          <Text style={styles.subtitle}>Trò chuyện và nhập vai cùng những nhân vật AI có cá tính riêng.</Text>

          <View style={{ height: 40 }} />
          <Field label="Bạn muốn được gọi là gì?" placeholder="Ví dụ: Linh" value={name} onChangeText={setName} maxLength={24} />

          <Text style={styles.label}>Bạn thích trò chuyện với nhân vật</Text>
          <View style={{ flexDirection: 'row', marginBottom: 24 }}>
            {GENDERS.map((g) => (
              <Chip key={g.key} label={g.label} active={gender === g.key} onPress={() => setGender(g.key)} />
            ))}
          </View>

          <Chip
            label={agree ? '✓  Tôi đủ 17 tuổi và đồng ý điều khoản' : '○  Tôi đủ 17 tuổi và đồng ý điều khoản'}
            active={agree}
            onPress={() => setAgree(!agree)}
          />
          <Text style={styles.note}>
            Nhân vật là AI, nội dung do AI tạo ra và có thể không chính xác. Bản thử nghiệm, dữ liệu chỉ lưu trên máy bạn.
          </Text>

          <GradientButton
            title="Bắt đầu"
            disabled={!name.trim() || !agree}
            onPress={() => setProfile({ name: name.trim(), preferredGender: gender, onboarded: true })}
            style={{ marginTop: 32 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  logo: { color: colors.text, fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.textMuted, fontSize: 16, marginTop: 8, lineHeight: 22 },
  label: { color: colors.text, fontWeight: '700', marginBottom: 10, fontSize: 14 },
  note: { color: colors.textMuted, fontSize: 12, marginTop: 12, lineHeight: 18 },
});
