# Kealen

App chat nhập vai với nhân vật AI (bản thử nghiệm). Kế hoạch đầy đủ: [docs/PLAN.md](docs/PLAN.md).

## Bản thử nghiệm hiện có
- Onboarding, Khám phá (6 nhân vật mẫu, lọc thể loại, tìm kiếm), hồ sơ nhân vật
- Chat nhập vai: *hành động* in nghiêng, tạo lại câu trả lời, xóa tin nhắn, bắt đầu lại
- Tạo nhân vật riêng (có chặn nội dung liên quan trẻ vị thành niên)
- Giới hạn 30 lượt/ngày + điểm danh nhận thêm lượt
- AI: chế độ demo (không cần key) hoặc AI thật qua OpenRouter API key nhập ở tab "Tôi"
- Dữ liệu chỉ lưu trên máy (chưa có server)

## Chạy thử
```
cd app && npm install && npx expo start
```

## File IPA
GitHub Actions (`.github/workflows/ios-ipa.yml`) build file IPA **chưa ký** trên máy macOS và đăng lên mục Releases.
Cài lên iPhone bằng Sideloadly (Windows/Mac) hoặc AltStore với Apple ID của bạn.
