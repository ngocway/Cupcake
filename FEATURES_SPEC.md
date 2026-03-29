# TÀI LIỆU ĐẶC TẢ CHI TIẾT CHỨC NĂNG (FEATURES SPECIFICATION)

Chỉ thị cho Antigravity Agent: Dưới đây là mô tả User Flow, Data Validation và Logic của từng tính năng. Hãy sử dụng tài liệu này để định nghĩa các API Endpoints, State Management (Zustand), và các Form Validators (Zod/Yup).

## PHÂN HỆ 1: XÁC THỰC & PHÂN QUYỀN (AUTH & ROLES)
- **Đăng nhập / Đăng ký:** Hỗ trợ Email/Password và Google OAuth.
- **Chọn Role (Lần đầu đăng nhập):** Người dùng phải chọn là TEACHER (Giáo viên) hoặc STUDENT (Học sinh). Không cho phép đổi role sau khi đã chọn (trừ khi admin can thiệp).
- **Routing Logic:**
  - Role TEACHER -> Redirect về `/teacher/dashboard`.
  - Role STUDENT -> Redirect về `/student/assignments`.

## PHÂN HỆ 2: BẢNG ĐIỀU KHIỂN GIÁO VIÊN (TEACHER DASHBOARD)
- **Widget Tổng quan (Overview):**
  - Tính tổng số bài tập đã tạo và số lượt giao bài trong tháng hiện tại.
  - Tính tỷ lệ nộp bài trung bình của tất cả các lớp.
- **Widget Cảnh báo Sức khỏe Lớp học (Class Health):**
  - **Logic:** Query những lớp có `last_assignment_date` cách đây > 7 ngày.
  - **Hiển thị:** Tên lớp + Label cảnh báo màu cam. Nút "Giao bài ngay" (Mở modal chọn bài tập có sẵn để giao).
- **Widget Phân tích Điểm yếu (Insights):**
  - **Logic:** Query lịch sử làm bài (Submissions), nhóm theo `question_type` (Trắc nghiệm, Điền từ...), tính điểm trung bình (Correct Rate).
  - **Hiển thị:** Dạng thanh tiến độ. Bôi đỏ những dạng bài có tỷ lệ đúng < 50%.
  - **Action:** Nút "Tạo bài tập bổ trợ", click vào sẽ điều hướng sang màn Editor và tự động chọn sẵn dạng bài đó.

## PHÂN HỆ 3: QUẢN LÝ LỚP HỌC (CLASS MANAGEMENT)
- **Tạo Lớp (Create Class):**
  - **Input:** Tên lớp (Bắt buộc), Mô tả, Khối/Cấp độ.
  - **Logic:** Khi tạo thành công, hệ thống tự sinh ra một `class_code` ngẫu nhiên (VD: ENG-6XYZ) gồm 6-8 ký tự.
- **Tham gia Lớp (Join Class - Góc nhìn Học sinh):**
  - Học sinh nhập `class_code` để tham gia. Xác thực mã code tồn tại.
- **Bảng điểm (Gradebook):**
  - Hiển thị dạng ma trận (Data Grid). Cột dọc là tên Học sinh, cột ngang là các Bài tập. Các ô chứa điểm số. Cột cuối cùng tính Điểm trung bình (Average) của từng học sinh.

## PHÂN HỆ 4: SOẠN THẢO BÀI TẬP (THE EDITOR) - MODULE CỐT LÕI
Mọi thay đổi trong Editor phải được tự động lưu (Auto-save) vào database sau mỗi 3 giây (debounce) dưới trạng thái status: DRAFT.

### 4.1. Meta Data của Bài tập
- **Input:** Tiêu đề bài tập (Tự động focus khi mở).
- **Config:** Điểm mặc định cho mỗi câu (VD: 1.0).

### 4.2. Chi tiết 5 Dạng Câu Hỏi
Mỗi câu hỏi đều có chung: Số thứ tự, Điểm số riêng, Icon Thùng rác (Xóa), Icon Copy (Nhân bản), Input "Thêm lời giải thích" (Hiển thị cho học sinh xem sau khi có kết quả).

1. **Dạng 1: Trắc nghiệm (Multiple Choice)**
   - **Input:** Rich Text cho Câu hỏi. 4 ô Text/Image cho 4 đáp án (A, B, C, D). Nút (+) để thêm đáp án thứ 5, 6 nếu muốn.
   - **Logic Chọn:** Radio button ở mỗi đáp án để giáo viên chọn đáp án ĐÚNG.
   - **Validation:** Bấm "Lưu" phải kiểm tra: Đã nhập câu hỏi chưa? Có ít nhất 2 đáp án chưa? Đã chọn 1 đáp án đúng chưa?

2. **Dạng 2: Điền vào chỗ trống (Cloze Test)**
   - **Input:** Một Textarea lớn (Rich Text).
   - **Tương tác đục lỗ:** Giáo viên bôi đen một cụm từ, một Tooltip nổi lên -> Bấm "Tạo ô trống".
   - **Data Structure (Backend):** Lưu trữ dạng Template String. VD: `Hello, I am a {{student}} at school.`. Backend lưu Text gốc và một Array chứa các từ khóa đúng: `["student"]`.
   - **Config:** Checkbox "Chấp nhận chữ hoa/chữ thường" (Case Insensitive - Mặc định bật).

3. **Dạng 3: Nối cặp (Matching)**
   - **UI:** Hiển thị N dòng, mỗi dòng chia 2 cột (Cột A, Cột B) và icon 🔗 ở giữa.
   - **Input:** Text hoặc up Ảnh Thumbnail nhỏ. Nút "Thêm cặp mới".
   - **Validation:** Phải có tối thiểu 2 cặp dữ liệu. Cả 2 vế của 1 cặp không được bỏ trống.
   - **Logic Frontend:** Giáo viên luôn nhập Cặp Đúng trên cùng 1 hàng. Khi Render cho học sinh thi, thuật toán sẽ tự động Shuffle (Xáo trộn ngẫu nhiên) mảng ở Cột B.

4. **Dạng 4: Đúng/Sai (True/False)**
   - **UI:** Câu hỏi Rich text + 2 Thẻ bấm khổng lồ (TRUE và FALSE).
   - **Tương tác:** Giáo viên click vào Thẻ nào thì Thẻ đó sáng lên (Chọn làm đáp án đúng). Có Dropdown nhỏ để đổi nhãn chữ thành "Yes/No" hoặc "Right/Wrong".

5. **Dạng 5: Sắp xếp câu (Reorder)**
   - **Tính năng "Smart Import":** Một ô input text lớn. Khi giáo viên gõ `Từ 1 / Từ 2 / Từ 3` và Enter -> Hệ thống tự động `split("/")` và tạo thành 3 khối thẻ riêng biệt bên dưới.
   - **UI:** Danh sách các khối thẻ dọc. Có icon Drag-handle (Kéo thả) để giáo viên đổi thứ tự.
   - **Logic:** Backend lưu mảng các thẻ theo Thứ tự Đúng. Khi học sinh làm bài, frontend sẽ Shuffle mảng này.

## PHÂN HỆ 5: LUỒNG GIAO BÀI (ASSIGNMENT SETTINGS)
Khi giáo viên bấm "Giao bài", mở Modal cài đặt:
- **Đối tượng:** Chọn một hoặc nhiều Lớp (Checkbox).
- **Thời gian làm bài (Timer):** Input số (phút). Nếu bỏ trống là Không giới hạn.
- **Lịch trình (Scheduling):** DatePicker chọn "Thời gian mở" và "Hạn nộp" (Deadline).
- **Giới hạn số lần làm (Attempts):** Input số (VD: 1, 2, 3).
- **Chế độ chống gian lận (Focus Mode):** Toggle Button. Nếu BẬT: Học sinh rời khỏi tab trình duyệt hoặc tắt app -> Cảnh báo. Quá 3 lần -> Tự động nộp bài (Force Submit).
- **Cho phép xem đáp án:** Toggle (Bật/Tắt).

## PHÂN HỆ 6: HỌC SINH LÀM BÀI (STUDENT QUIZ RUNNER)
*Yêu cầu Agent code theo nguyên tắc Mobile-First.*

- **Phòng chờ (Lobby):**
  - Fetch và hiển thị thông tin bài tập. Check logic: Nếu `current_time > deadline` hoặc `attempts >= max_attempts` -> Disable nút Bắt đầu, thay bằng nút "Xem kết quả".
- **Giao diện Làm bài (Zero Distraction):**
  - Header cố định: Đồng hồ đếm ngược (`setInterval`, khi còn <= 5 phút -> text màu đỏ). Progress Bar (số câu đã làm / tổng số câu). Icon lưới mở "Question Map" (Bản đồ chọn câu).
  - Footer cố định: Nút Prev / Next. Ở câu cuối cùng đổi thành "Nộp Bài".
- **Logic tương tác các câu hỏi (Student View):**
  - **Điền từ (Typing):** Khi Focus vào ô Input, dùng JavaScript `scrollIntoView()` để ô Input trượt lên giữa màn hình, tránh bị bàn phím ảo che khuất.
  - **Nối cặp (Tap to match):** State management để lưu id của "Thẻ A đang chọn". Khi chạm tiếp vào Thẻ B -> Validate và tạo mảng Pairs đã nối. Vẽ đường line bằng CSS hoặc đơn giản là đánh dấu cùng màu (VD: Cặp 1 màu xanh, Cặp 2 màu vàng).
  - **Sắp xếp:** Sử dụng thư viện `dnd-kit` để vuốt/kéo thả các thẻ lên xuống.
- **Khôi phục trạng thái (Resiliency):** Mỗi khi học sinh chọn đáp án, lưu tạm vào localStorage hoặc gửi API nháp. Nếu rớt mạng hoặc reload trang, load lại dữ liệu từ cache để học sinh không bị mất bài.

## PHÂN HỆ 7: BÁO CÁO & CHẤM BÀI (REPORTING & GRADING)
- **Phân tích Tổng quan:**
  - Query số bài đã nộp/Tổng số HS.
  - Biểu đồ phổ điểm (Histogram): Phân nhóm học sinh theo dải điểm (0-4, 5-7, 8-10).
- **Phân tích Câu hỏi:**
  - Tính `Correct_Rate` (Tỷ lệ làm đúng) của từng câu hỏi = (Số học sinh trả lời đúng / Tổng số học sinh đã nộp).
  - Sắp xếp danh sách từ Câu có tỷ lệ đúng thấp nhất lên cao (Để GV biết câu nào khó nhất).
- **Drawer Chi tiết Học sinh & Feedback:**
  - Bấm vào tên học sinh -> Mở slide-out menu.
  - Hiển thị bài làm chi tiết (Câu 1: HS chọn B, Đáp án đúng là C -> Màu đỏ).
  - Footer Feedback: Form gửi nhận xét. Có Checkbox `Send via Email`. Nếu tick, gọi API SendGrid/Resend để bắn email điểm số + nội dung nhận xét cho học sinh.
