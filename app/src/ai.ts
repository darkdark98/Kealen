import { Character, Message, Settings } from './types';

const MAX_HISTORY = 30;

export function buildSystemPrompt(c: Character, userName: string, persona: string) {
  return [
    `Bạn đang nhập vai nhân vật "${c.name}" trong một câu chuyện tương tác bằng tiếng Việt.`,
    `Tính cách: ${c.personality}`,
    `Bối cảnh: ${c.scenario}`,
    `Người dùng tên là "${userName || 'bạn'}".${persona ? ` Về người dùng: ${persona}` : ''}`,
    'Quy tắc:',
    '- Luôn giữ vai, nói ở ngôi thứ nhất, không bao giờ nhận mình là AI.',
    '- Mô tả hành động, cử chỉ trong dấu *sao*, lời thoại để bình thường.',
    '- Trả lời 2–5 câu, tự nhiên, cảm xúc, có gợi mở để câu chuyện tiếp diễn.',
    '- Không nói thay hay quyết định hành động thay người dùng.',
    '- Giữ nội dung lãng mạn ở mức an toàn: không có nội dung tình dục, không bạo lực cực đoan.',
  ].join('\n');
}

export async function generateReply(
  c: Character,
  history: Message[],
  settings: Settings,
  userName: string,
): Promise<string> {
  if (!settings.apiKey.trim()) return demoReply(c, history);

  const messages = [
    { role: 'system', content: buildSystemPrompt(c, userName, settings.userPersona) },
    ...history.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey.trim()}`,
      'Content-Type': 'application/json',
      'X-Title': 'Kealen',
    },
    body: JSON.stringify({
      model: settings.model.trim() || DEFAULT_MODEL,
      messages,
      temperature: 0.9,
      max_tokens: 400,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lỗi AI (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI không trả về nội dung.');
  return content.trim();
}

export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

// Offline replies so the prototype works without an API key.
const DEMO_LINES = [
  '*{name} khẽ mỉm cười, ánh mắt dừng lại trên bạn lâu hơn một chút* Bạn nói vậy làm tôi tò mò đấy. Kể thêm đi?',
  '*{name} nghiêng đầu suy nghĩ* Hừm... tôi chưa từng nghĩ theo cách đó. Còn bạn thì sao, bạn thật sự muốn gì?',
  '*{name} bật cười* Bạn lúc nào cũng làm tôi bất ngờ. Được rồi, tôi sẽ đi cùng bạn.',
  '*{name} im lặng một lúc rồi nhẹ giọng* Thật ra... tôi đã chờ bạn nói câu đó từ lâu rồi.',
  '*{name} nhìn ra ngoài cửa sổ, nơi trời bắt đầu mưa* Có vẻ ta phải ở đây thêm một lúc. Bạn không phiền chứ?',
  '*{name} khoanh tay, giả vờ nghiêm túc* Câu trả lời đó chưa thuyết phục đâu. Thử lại xem nào.',
];

function demoReply(c: Character, history: Message[]): Promise<string> {
  const idx = (history.length + c.name.length) % DEMO_LINES.length;
  const line = DEMO_LINES[idx].replace('{name}', c.name);
  const note = history.length <= 2 ? '\n\n(Chế độ demo — nhập OpenRouter API key ở tab "Tôi" để chat bằng AI thật.)' : '';
  return new Promise((r) => setTimeout(() => r(line + note), 900));
}
