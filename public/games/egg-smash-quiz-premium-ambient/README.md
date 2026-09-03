
# Egg Smash Quiz - bản dynamic hoàn chỉnh

Bản này đã sửa đúng theo yêu cầu mới:

## Những gì đã thay đổi
1. **Quả trứng không còn chứa đáp án trong asset**
   - 4 file trứng là asset sạch, **không có số**.
   - Đáp án được render động bằng HTML/CSS/JS (`.answer-label`).

2. **Background không còn thông tin động**
   - File `assets/background-farm-clean.png` chỉ còn cảnh nông trại + ổ rơm + búa.
   - Không có chữ câu hỏi, điểm, xu, sao, đáp án in sẵn trên ảnh nền.
   - Tất cả thông tin động nằm ở HTML/CSS/JS.

3. **Đã có hiệu ứng vỡ vỏ 2 mảnh**
   - **Chọn đúng**: trứng vỡ thành 2 mảnh, phát sáng, confetti, spark, +15 xu, âm thanh.
   - **Chọn sai**: trứng cũng vỡ 2 mảnh nhưng nhẹ hơn, có dấu X đỏ + bụi `poof`, sau đó tự khép lại để chơi tiếp.

4. **Không bị khoảng trống 2 bên**
   - Dùng `scene` cover full màn hình theo tỉ lệ 16:9, không còn viền trống xanh 2 bên.

## Cấu trúc file
- `index.html`
- `styles.css`
- `game.js`
- `assets/background-farm-clean.png`
- `assets/egg-blue.png`
- `assets/egg-green.png`
- `assets/egg-pink.png`
- `assets/egg-purple.png`
- `assets/spark-burst.svg`

## Cách chạy
Giải nén rồi mở `index.html` bằng trình duyệt.
Nếu trước đó từng mở bản cũ, hãy bấm `Ctrl + F5` để xoá cache.

## Chỗ để Antigravity / hệ thống khác tự điền
Nếu bạn muốn engine khác tự đổ dữ liệu:
- `#questionCounter`
- `#questionText`
- `#coinValue`
- các `.answer-label`
- `#instructionText`

## Phím tắt
- Bấm `1`, `2`, `3`, `4` để chọn trứng.
- `Esc` để tạm dừng.


## Asset động mới
- `assets/bee.svg`: ong bay lượn
- `assets/butterfly-pink.svg`, `assets/butterfly-blue.svg`: bướm bay nhẹ
- `assets/flower-white.svg`, `assets/flower-yellow.svg`: hoa lắc lư

Các asset này đã được gắn sẵn vào `index.html` và animate bằng `styles.css`, không cần JS bổ sung.

## Premium ambient assets

Bản này thay toàn bộ asset động cũ bằng asset PNG chất lượng cao mới:

- `assets/bee-premium.png`
- `assets/butterfly-pink-premium.png`
- `assets/butterfly-blue-premium.png`
- `assets/flower-white-premium.png`
- `assets/flower-yellow-premium.png`

Các asset đã được gắn sẵn vào `index.html` và dùng animation trong `styles.css`.
Không cần thay đổi `game.js`.
