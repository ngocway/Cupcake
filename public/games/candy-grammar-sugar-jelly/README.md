# Candy Grammar Quest — Sugar Burst + Jelly Wobble

Bộ source hoàn chỉnh dành cho game câu hỏi + 4 đáp án dài.

## Hiệu ứng chính

### Đáp án đúng — Sugar Burst
- Squash & stretch ngắn khi chọn
- Bảng bật nảy lên
- Glow vàng/đường quanh viền
- Vòng sugar ring bung ra
- 42 hạt sprinkle nhiều màu
- Hạt đường trắng
- Sao kẹo vàng
- +15 bay lên thanh coin
- Các đáp án còn lại mờ đi

### Đáp án sai — Jelly Wobble
- Bảng biến dạng kiểu thạch thay vì rung cứng
- Squash ngang/dọc + skew nhiều nhịp
- Frosting đổi sắc nhẹ
- Đường bột `poof`
- Kẹo nhỏ rơi xuống
- Sau ~760ms bảng trở về bình thường và cho chọn lại

## Background full screen

`styles.css` dùng một design stage 16:9 kiểu cover:

```css
.stage {
  width: max(100vw, calc(100vh * 16 / 9));
  height: max(calc(100vw * 9 / 16), 100vh);
}
```

Nhờ vậy không còn khoảng trống xanh ở hai bên. Nếu màn hình không phải 16:9, phần rìa được crop thay vì để letterbox.

## Dữ liệu động / Antigravity

Có thể inject trước `game.js`:

```html
<script>
window.CANDY_QUIZ_DATA = [
  {
    question: "Listen! Someone _____ at the front door right now.",
    answers: [
      "is knocking at the front door right now.",
      "has already knocked at the front door.",
      "knocked at the front door yesterday.",
      "will be knocking at the front door soon."
    ],
    correct: 0,
    fill: "is knocking"
  }
];
</script>
```

## Cấu trúc

- `index.html`
- `styles.css`
- `game.js`
- `assets-manifest.json`
- `assets/background/`
- `assets/boards/`
- `assets/hud/`
- `assets/buttons/`
- `assets/effects/`
- `assets/decor/`

Chỉ cần mở `index.html`.
