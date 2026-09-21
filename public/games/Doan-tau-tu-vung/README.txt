ĐOÀN TÀU TỪ VỰNG — BỘ GAME VÀ ASSET

CÁCH CHƠI TRÊN MÁY TÍNH
1. Giải nén toàn bộ thư mục.
2. Mở index.html bằng Chrome hoặc Edge.
3. Kéo thẻ chữ vào toa có hình phù hợp; hoặc bấm chữ rồi bấm toa.
4. Ghép đủ 4 cặp, bấm Cho tàu chạy!

Không cần cài phần mềm, npm, máy chủ hay kết nối mạng để chơi.
Tiếng đọc từ sử dụng giọng đọc có sẵn trên thiết bị; một số giọng có thể cần mạng.
Nếu thiết bị không có giọng đọc tiếng Anh, game vẫn chơi được.

THAY ẢNH VÀ CHỮ
Cách 1: Trong game, chọn Bộ từ của tôi, nhập 4 từ khác nhau và chọn 4 ảnh.
Bộ từ này dùng trong lần mở trang hiện tại, không tự lưu sau khi đóng trang.
Cách 2: Đặt ảnh vào assets/my-images/ rồi chỉnh data.js.
Mỗi bộ gồm đúng 4 cặp, mỗi cặp là ["Từ tiếng Anh", "assets/my-images/ten-anh.png"].
Giữ 3 bộ có sẵn và thay nội dung của từng bộ. Tên ảnh phân biệt hoa/thường.
Nên dùng ảnh PNG, JPG hoặc WebP; tên ảnh không dấu, không khoảng trắng.
Ví dụ: ["Apple", "assets/my-images/apple.png"]
Bộ mẫu hiện dùng emoji để chạy độc lập; có thể thay toàn bộ bằng ảnh của bạn.

CÁC TỆP
index.html — giao diện trò chơi.
style.css — bố cục, màu sắc, hiệu ứng, phiên bản điện thoại.
app.js — logic ghép cặp, kéo thả, âm thanh, bộ từ tùy chọn.
data.js — dữ liệu các cặp ảnh–chữ.
asset-catalog.html — mở để xem toàn bộ asset và tên file.
assets/background/ — duy nhất một background dùng cho mọi vòng.
assets/train/ — đầu máy, 4 thân toa, 2 bánh xe, đường ray, thanh nối, 3 cụm khói.
assets/ui/ — nút, thẻ, ô nhận chữ, đèn tín hiệu, tiến độ, khung thông báo, icon.
assets/effects/ — ngôi sao, tia sáng, dấu đúng, pháo giấy, ruy băng, huy chương.
ASSET-MANIFEST.json — danh sách đầy đủ tệp và kích thước.
ART-DIRECTION.txt — mô tả bộ hình và phương pháp tạo.

Ảnh cảnh và bộ phận tàu là PNG; foreground có nền trong suốt.
Nút, khung và icon là SVG, có thể mở trong trình duyệt hoặc phần mềm thiết kế.
Bánh xe, thân tàu và khói tách riêng; chuyển động do CSS/JavaScript điều khiển.
Không có nhân vật đồng hành. Mọi vòng sử dụng cùng một background.

THIẾT BỊ
Máy tính: 4 toa nằm trên một hàng. Điện thoại: toa xếp 2 hàng để dễ thao tác.
Âm thanh chỉ phát sau thao tác người dùng. Có nút tắt tiếng.
Tôn trọng cài đặt giảm chuyển động của hệ điều hành.
