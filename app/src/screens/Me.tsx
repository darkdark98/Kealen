import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_MODEL } from '../ai';
import { Field, GhostButton, GradientButton } from '../components/ui';
import { CHECKIN_BONUS, DAILY_FREE, useStore } from '../store';
import { colors, radius } from '../theme';

export default function Me() {
  const { profile, wallet, settings, setSettings, setProfile, checkin, resetAll, customCharacters, conversations } = useStore();
  const insets = useSafeAreaInsets();
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [persona, setPersona] = useState(settings.userPersona);
  const [name, setName] = useState(profile.name);
  const today = new Date().toISOString().slice(0, 10);
  const checkedIn = wallet.lastCheckin === today;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Tôi</Text>

        <LinearGradient colors={[colors.primary, colors.primary2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={styles.heroName}>Xin chào, {profile.name} 👋</Text>
          <View style={{ flexDirection: 'row', marginTop: 14 }}>
            <Stat value={String(wallet.credits)} label="Lượt chat" />
            <Stat value={String(Object.keys(conversations).length)} label="Cuộc trò chuyện" />
            <Stat value={String(customCharacters.length)} label="Đã tạo" />
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎁 Điểm danh hằng ngày</Text>
          <Text style={styles.cardBody}>
            Mỗi ngày bạn có {DAILY_FREE} lượt chat miễn phí. Điểm danh để nhận thêm {CHECKIN_BONUS} lượt. Chuỗi hiện tại: {wallet.streak} ngày.
          </Text>
          <GradientButton
            title={checkedIn ? 'Đã điểm danh hôm nay ✓' : `Điểm danh +${CHECKIN_BONUS}`}
            disabled={checkedIn}
            onPress={() => {
              if (checkin()) Alert.alert('Thành công', `Bạn nhận được ${CHECKIN_BONUS} lượt chat!`);
            }}
            style={{ marginTop: 12 }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>👑 Kealen VIP</Text>
          <Text style={styles.cardBody}>Chat không giới hạn, AI thông minh hơn, trí nhớ dài hơn. (Sắp ra mắt)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧑 Hồ sơ của bạn</Text>
          <View style={{ height: 12 }} />
          <Field label="Tên hiển thị" value={name} onChangeText={setName} maxLength={24} />
          <Field
            label="Bạn là ai trong câu chuyện (persona)"
            value={persona}
            onChangeText={setPersona}
            multiline
            placeholder="Ví dụ: 22 tuổi, sinh viên mỹ thuật, tính cách vui vẻ..."
            maxLength={400}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 Cài đặt AI</Text>
          <Text style={styles.cardBody}>
            Bỏ trống API key để dùng chế độ demo (câu trả lời mẫu). Lấy key tại openrouter.ai → Keys. Key chỉ lưu trên máy bạn.
          </Text>
          <View style={{ height: 12 }} />
          <Field label="OpenRouter API key" value={apiKey} onChangeText={setApiKey} placeholder="sk-or-v1-..." autoCapitalize="none" autoCorrect={false} secureTextEntry />
          <Field label="Model" value={model} onChangeText={setModel} placeholder={DEFAULT_MODEL} autoCapitalize="none" autoCorrect={false} hint={`Mặc định: ${DEFAULT_MODEL}`} />
        </View>

        <GradientButton
          title="Lưu cài đặt"
          onPress={() => {
            setSettings({ apiKey: apiKey.trim(), model: model.trim() || DEFAULT_MODEL, userPersona: persona.trim() });
            if (name.trim()) setProfile({ name: name.trim() });
            Alert.alert('Đã lưu');
          }}
        />
        <View style={{ height: 12 }} />
        <GhostButton
          danger
          title="Xóa toàn bộ dữ liệu"
          onPress={() =>
            Alert.alert('Xóa toàn bộ dữ liệu?', 'Mọi cuộc trò chuyện, nhân vật đã tạo và cài đặt sẽ bị xóa.', [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Xóa', style: 'destructive', onPress: resetAll },
            ])
          }
        />
        <Text style={styles.version}>Kealen · bản thử nghiệm 0.1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: '#fff', opacity: 0.85, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 12 },
  hero: { borderRadius: radius.lg, padding: 18, marginBottom: 14 },
  heroName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  card: { backgroundColor: colors.bgElevated, borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  cardBody: { color: colors.textMuted, marginTop: 6, lineHeight: 20 },
  version: { color: colors.textMuted, textAlign: 'center', marginTop: 24, fontSize: 12 },
});
