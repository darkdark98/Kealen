# Kế hoạch: App chat nhập vai với nhân vật AI (kiểu Dokichat) — dự án "Kealen"

## Context
- Mục tiêu: xây app chat với nhân vật AI có cá tính, nhập vai lãng mạn, người dùng tự tạo nhân vật, có giới hạn lượt chat + nhiệm vụ + gói trả phí. Tham chiếu: Dokichat (Google Play `app.doki.dokichat`, dokichat.club).
- Hiện trạng: repo `Kealen` **trống hoàn toàn** (chưa có commit). Mọi thứ làm từ đầu.
- Đã chốt: Web + mobile một codebase; một người làm cùng Claude Code; AI chưa chọn → thiết kế lớp trung gian đổi được nhà cung cấp; nội dung **cả hai chế độ** (an toàn + 18+).

## Cảnh báo phải biết trước (đọc trước khi làm)
1. **Chế độ 18+ không được xuất hiện trong bản App Store / Play Store.** Apple và Google cấm app có nội dung khiêu dâm do AI sinh ra → bị gỡ/khóa tài khoản dev. Giải pháp: bản mobile chỉ có chế độ an toàn; 18+ chỉ mở trên **web**, sau khi xác minh tuổi. [Chắc chắn với Apple; Có khả năng cao với Google]
2. **Thanh toán 18+:** Stripe/PayPal cấm nội dung người lớn → phải dùng cổng "high-risk" (CCBill, Segpay, Verotel), phí 10–15%, cần pháp nhân. [Có khả năng cao]
3. **Pháp luật Việt Nam** cấm phát tán nội dung khiêu dâm; nếu bạn/pháp nhân ở VN thì 18+ có rủi ro pháp lý thật → nên đăng ký pháp nhân/hosting ở nước ngoài và tham vấn luật sư trước khi mở 18+. [Có khả năng cao — cần luật sư xác nhận]
4. **Quy tắc cứng, không có ngoại lệ ở mọi chế độ:** cấm nhân vật vị thành niên hoặc trông như trẻ em trong ngữ cảnh tình dục, cấm nhân vật là người thật có danh tính (người nổi tiếng), cấm nội dung bạo lực tình dục không đồng thuận. Phải có bộ lọc tự động + báo cáo + xử lý. Đây là điều kiện sống còn của app, không phải tùy chọn.
5. **Chi phí AI là chi phí lớn nhất.** Mỗi tin nhắn tốn token cho cả lịch sử hội thoại → phải có giới hạn lượt, tóm tắt hội thoại dài, chọn model rẻ cho người dùng miễn phí.
6. API lớn (Claude, OpenAI, Gemini) **không cho phép** nội dung khiêu dâm → chế độ 18+ phải dùng model mở (Llama/Qwen/Mistral fine-tune) qua nhà cung cấp cho phép, hoặc tự host. [Chắc chắn]

## Kiến trúc đề xuất
| Thành phần | Chọn | Lý do |
|---|---|---|
| App (iOS/Android/Web) | **Expo (React Native) + Expo Router + TypeScript** | Một codebase ra cả 3 nền tảng |
| UI | NativeWind (Tailwind cho RN) + Reanimated | Giao diện đẹp nhanh, animation mượt |
| State/data | TanStack Query + Zustand | Cache server + state cục bộ |
| Backend dữ liệu | **Supabase** (Postgres, Auth, Storage, Realtime, pgvector) | Một người làm không phải tự dựng DB/auth |
| API chat | **Node + Hono** (deploy Fly.io/Railway) | Stream phản hồi AI, kiểm quota, ghép prompt, giữ API key bí mật |
| Lớp AI | Interface `LLMProvider` + **OpenRouter** làm mặc định | Đổi model bằng cấu hình: model rẻ cho free, model tốt cho VIP, model mở cho 18+ |
| Kiểm duyệt | OpenAI Moderation API (miễn phí) + bộ lọc từ khóa + LLM phân loại cho nhân vật mới | Chặn nội dung cấm |
| Ảnh avatar | Supabase Storage; (tùy chọn) tạo ảnh AI qua Replicate/fal.ai | |
| Thanh toán | **RevenueCat** (IAP mobile) + Stripe (web an toàn) + CCBill/Segpay (web 18+) | |
| Thông báo đẩy | Expo Notifications | Nhân vật "nhắn tin chủ động" kéo người dùng quay lại |
| Theo dõi | Sentry (lỗi) + PostHog (hành vi) | |

Cấu trúc repo (monorepo pnpm):
```
apps/mobile      # Expo app (iOS/Android/Web)
apps/api         # Hono chat API
packages/shared  # types, zod schema, hằng số dùng chung
supabase/        # migrations SQL, seed, RLS policies
```

## Mô hình dữ liệu chính (Postgres)
- `profiles` (user_id, tên, avatar, giới tính ưa thích, ngày sinh, `age_verified`, `nsfw_enabled`, gói, ngôn ngữ)
- `characters` (id, creator_id, tên, avatar, giới thiệu, tính cách, bối cảnh, lời chào đầu, ví dụ hội thoại, tags, `rating: safe|mature`, `visibility: public|private`, trạng thái duyệt, lượt chat, lượt thích)
- `conversations` (user, character, persona người dùng, tóm tắt dài hạn, cập nhật lúc)
- `messages` (conversation, role, nội dung, token, các bản "tạo lại" để vuốt chọn, thời gian)
- `memories` (conversation, nội dung, embedding vector) — trí nhớ dài hạn
- `posts`, `post_comments` (bảng tin; nhân vật AI tự bình luận)
- `wallets` (lượt chat còn lại, kim cương/xu), `transactions`, `tasks`, `task_progress`, `subscriptions`
- `reports`, `moderation_logs`, `follows`, `likes`
- Bật **Row Level Security** cho mọi bảng ngay từ đầu.

## Lộ trình — 10 giai đoạn, mỗi giai đoạn ~1–2 tuần (tổng ~4–5 tháng cho một người + Claude Code) [Ước đoán về thời gian]

### GĐ 1 — Nền móng (tuần 1–2)
- Tạo monorepo, Expo app, Hono API, Supabase project, ESLint/Prettier, CI GitHub Actions.
- Design system: màu, font, component cơ bản (Button, Input, Avatar, Card, Sheet, Toast).
- **Cần có:** tài khoản Supabase, OpenRouter, Expo (EAS), GitHub. **Thiếu:** tên thương hiệu, logo, bảng màu.

### GĐ 2 — Đăng nhập & hồ sơ (tuần 2–3)
- Đăng nhập Google, Apple (bắt buộc trên iOS nếu có Google), email OTP, khách (guest).
- Onboarding: chọn giới tính nhân vật thích, sở thích (tags), ngôn ngữ, ngày sinh.
- **Cần có:** Apple Developer ($99/năm), Google Play Console ($25), OAuth client.

### GĐ 3 — Lõi chat AI (tuần 3–5) ← giai đoạn quan trọng nhất
- API `/chat/send` stream phản hồi (SSE), lưu tin nhắn, đếm token.
- Bộ ghép prompt: system prompt nhân vật + persona người dùng + tóm tắt + trí nhớ liên quan + N tin gần nhất (cắt theo ngân sách token).
- Tạo lại câu trả lời (vuốt trái/phải), sửa tin nhắn, xóa, tiếp tục câu trả lời.
- Hiệu ứng "đang gõ…", markdown hành động kiểu `*mỉm cười*` hiển thị in nghiêng.
- **Thiếu:** bộ system prompt mẫu đạt chất lượng nhập vai → phải tự viết và thử nhiều vòng.

### GĐ 4 — Nhân vật & khám phá (tuần 5–6)
- Seed 30–50 nhân vật chất lượng cao (avatar, lời chào, tính cách) — **bạn phải chuẩn bị nội dung/ảnh**, hoặc tạo bằng AI rồi biên tập.
- Trang chủ khám phá: banner, danh mục theo tag, xu hướng, mới, tìm kiếm.
- Trang hồ sơ nhân vật: ảnh lớn, giới thiệu, tags, lượt chat, nút "Chat ngay".

### GĐ 5 — Tạo nhân vật (tuần 6–7)
- Form nhiều bước: ảnh → tên/giới tính → tính cách → bối cảnh → lời chào → ví dụ hội thoại → công khai/riêng tư.
- "Tạo bằng AI": nhập 1 câu mô tả → AI điền form.
- Kiểm duyệt tự động trước khi công khai (quy tắc cứng ở mục Cảnh báo #4).

### GĐ 6 — Trí nhớ & chất lượng hội thoại (tuần 7–8)
- Tóm tắt tự động khi hội thoại dài; trích "sự kiện quan trọng" vào `memories` + pgvector.
- Persona người dùng (bạn là ai trong câu chuyện).
- Đánh giá tin nhắn 👍/👎 để chọn model/prompt tốt hơn.

### GĐ 7 — Kinh tế trong app (tuần 8–10)
- Quota: X tin/ngày miễn phí, hồi lại theo giờ; nhiệm vụ (điểm danh, chat với nhân vật mới, mời bạn, xem quảng cáo) để nhận lượt.
- Gói VIP (tuần/tháng/năm): không giới hạn, model tốt hơn, trí nhớ dài hơn. Xu/kim cương cho tính năng lẻ.
- RevenueCat + webhook cập nhật quyền lợi phía server (không tin client).
- **Cần có:** pháp nhân/tài khoản ngân hàng nhận tiền, thuế, chính sách hoàn tiền.

### GĐ 8 — Cộng đồng & giữ chân (tuần 10–11)
- Bảng tin: người dùng đăng bài, nhân vật AI tự bình luận/thả tim (job nền giới hạn tần suất).
- Theo dõi người tạo nhân vật, thích, chia sẻ link nhân vật.
- Push notification: nhân vật "nhắn chủ động" sau 24h không mở app.

### GĐ 9 — An toàn, chế độ 18+ trên web, pháp lý (tuần 11–13)
- Moderation pipeline cho tin nhắn, nhân vật, bài đăng; nút báo cáo; trang admin duyệt (có thể dùng Supabase Studio + một trang admin đơn giản).
- Chế độ 18+: chỉ trên web, cờ `nsfw_enabled` cần `age_verified` (Yoti/Veriff/Persona), route sang model mở, nhân vật `mature` bị ẩn hoàn toàn trên bản mobile.
- Tài liệu: Điều khoản, Chính sách quyền riêng tư, Nguyên tắc cộng đồng, xóa tài khoản (Apple bắt buộc).
- **Thiếu:** tư vấn luật sư; dịch vụ xác minh tuổi (trả phí theo lượt).

### GĐ 10 — Kiểm thử & phát hành (tuần 13–15)
- Test tải API chat, đo chi phí/tin nhắn, đặt cảnh báo ngân sách AI.
- Beta: TestFlight + Play Internal Testing + web staging; thu phản hồi.
- Nộp store (chế độ an toàn, rating 17+/Mature), ra mắt web.

## Kế hoạch giao diện (UI/UX)
Phong cách: tông tối là mặc định (hồng/tím neon trên nền đen-tím), ảnh nhân vật lớn, bo góc mềm, animation nhẹ. Thanh tab dưới 5 mục.

| # | Màn hình | Nội dung chính |
|---|---|---|
| 1 | Splash / Onboarding | 3 slide giới thiệu → chọn giới tính nhân vật thích → chọn tags → nhập ngày sinh |
| 2 | Đăng nhập | Google / Apple / Email / Vào với tư cách khách |
| 3 | **Tab Khám phá** (Home) | Banner trượt, hàng tag ngang, lưới thẻ nhân vật 2 cột (ảnh dọc 3:4, tên, mô tả 1 dòng, lượt chat), ô tìm kiếm trên cùng |
| 4 | Hồ sơ nhân vật | Ảnh nền toàn màn hình mờ dần, tên, tags, giới thiệu, người tạo, nút "Chat" nổi cố định dưới |
| 5 | **Tab Tin nhắn** | Danh sách hội thoại: avatar, tên, tin cuối, thời gian, chấm chưa đọc |
| 6 | **Màn chat** | Ảnh nhân vật làm nền mờ; bong bóng chat (của AI bên trái, của mình bên phải); hành động in nghiêng; vuốt để tạo lại câu trả lời (1/3, 2/3…); nhấn giữ: sửa/xóa/copy/báo cáo; thanh dưới: ô nhập, nút gửi, bộ đếm lượt còn lại; menu ⋮: persona, trí nhớ, làm mới hội thoại, cài đặt nhân vật |
| 7 | **Tab Tạo (+)** | Wizard nhiều bước có thanh tiến độ, nút "✨ Tạo bằng AI", xem trước thẻ nhân vật |
| 8 | **Tab Bảng tin** | Bài đăng dạng card, ảnh, bình luận của nhân vật AI có huy hiệu "AI" |
| 9 | **Tab Tôi** | Avatar, số lượt/xu, nút VIP nổi bật, nhân vật đã tạo, đã thích, cài đặt |
| 10 | Nhiệm vụ / Phần thưởng | Lịch điểm danh 7 ngày, danh sách nhiệm vụ có thanh tiến độ, nút "Nhận" |
| 11 | Paywall VIP | So sánh Free vs VIP, 3 gói giá, nút dùng thử, khôi phục mua hàng |
| 12 | Cài đặt | Ngôn ngữ, giao diện, thông báo, chế độ nội dung (chỉ web), xóa tài khoản, điều khoản |
| 13 | Admin (web) | Hàng chờ duyệt nhân vật, báo cáo, khóa người dùng |

Trước khi code UI: vẽ wireframe 13 màn này (Figma hoặc Canva — có thể dùng Canva qua kết nối có sẵn), chốt bảng màu, rồi mới làm GĐ 1.

## Tổng hợp: cần có / còn thiếu
**Tài khoản & dịch vụ:** GitHub ✅ (đã có repo), Supabase, OpenRouter (hoặc Anthropic/OpenAI), Expo EAS, Apple Developer ($99/năm), Google Play ($25), RevenueCat, Stripe, Sentry, PostHog, domain + hosting API (Fly.io/Railway ~$5–20/tháng).
**Chỉ có khi mở 18+:** cổng thanh toán high-risk, dịch vụ xác minh tuổi, pháp nhân phù hợp, luật sư.
**Nội dung bạn phải tự cung cấp/duyệt:** tên & logo app, bảng màu, 30–50 nhân vật mẫu (ảnh + kịch bản), văn bản điều khoản/chính sách, nội dung nhiệm vụ & bảng giá.
**Chi phí ước tính tháng đầu (ít người dùng):** ~$50–150 + chi phí AI theo lượng dùng (model rẻ ~$0.0005–0.002/tin nhắn) [Ước đoán — phụ thuộc model và độ dài hội thoại].

## Kiểm chứng (mỗi giai đoạn)
- Unit test cho bộ ghép prompt, quota, webhook thanh toán (Vitest).
- Chạy app web local (`expo start --web`) + Playwright test luồng: đăng nhập → chọn nhân vật → chat có stream → hết lượt → hiện paywall.
- Test RLS: user A không đọc được hội thoại user B.
- Test moderation với bộ câu mẫu vi phạm (phải bị chặn) trước mỗi lần phát hành.
- Bản mobile: kiểm tra không có bất kỳ đường nào bật được nội dung `mature`.

## Bước tiếp theo khi được duyệt
Bắt đầu GĐ 1: khởi tạo monorepo + Expo + Hono + Supabase trong repo `Kealen`, commit lên nhánh làm việc.
