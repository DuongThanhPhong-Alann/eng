# Học Vui · Ôn tập tiếng Anh

Ứng dụng Next.js để luyện câu hỏi tiếng Anh theo hai level: Level 1 chọn đáp án A/B/C/D, Level 2 tự nhập đáp án. Sau mỗi câu, ứng dụng hiện đáp án đúng và giải thích tiếng Việt. Điểm, thời lượng và số lần rời tab/cửa sổ được lưu trong MongoDB.

## Chạy ứng dụng

Yêu cầu Node.js 20.9 trở lên. Tạo cơ sở dữ liệu MongoDB local hoặc Atlas, rồi điền URI vào `.env` hoặc `.env.local`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/
MONGODB_DB=english_practice
```

Cài thư viện và chạy máy chủ phát triển:

```bash
npm install
npm run dev
```

Ứng dụng lưu bộ đề trong collection `exams` và các lần làm trong `attempts`. Người học được nhận diện bằng mã ẩn danh trong hồ sơ trình duyệt hiện tại; chưa có đăng nhập hoặc đồng bộ hồ sơ giữa thiết bị.

## Bộ đề hiện có

Ba tài liệu đã cung cấp có tổng cộng 370 câu: hai bộ 130 câu và một bộ 110 câu. Chúng được trộn vào sáu đề, mỗi đề 61–62 câu; mỗi câu nguồn được dùng một lần. Mỗi đề có Level 1 và Level 2, cùng danh sách câu hỏi đã được xáo thứ tự.

- Dữ liệu nguồn: `data/unit-3-community-service.json`, `data/unit-3-community-service-ex14-24.json`, `data/unit-3-community-service-word-form-10-tu.json`.
- Sáu đề hiển thị trên trang chủ: `data/unit-3-community-service-exam-1.json` đến `data/unit-3-community-service-exam-6.json`.
- Đáp án đúng được lấy từ answer key; mỗi câu có thêm ba lựa chọn nhiễu.

## Nhập và tạo đề

```bash
python scripts/extract_docx.py "duong-dan-tep.docx"
python scripts/import_pasted_questions.py "duong-dan-tep.txt"
python scripts/import_word_form_10.py "duong-dan-tep.docx"
python scripts/add_mcq_choices.py
python scripts/combine_exams.py
```

Khi thêm tài liệu mới, thêm dữ liệu nguồn và các phương án nhiễu tương ứng vào `scripts/add_mcq_choices.py`, rồi chạy lại script tạo đề để chia lại câu hỏi.

## Ghi nhận khi làm bài

Khi cửa sổ mất tiêu điểm hoặc tab bị ẩn, ứng dụng ghi một lần rời màn hình; lần chuyển tab và cửa sổ trong cùng một lượt được gộp lại. Lịch sử hiển thị số lần này, điểm đúng/sai, thời lượng và chi tiết từng câu sau khi hoàn thành.
