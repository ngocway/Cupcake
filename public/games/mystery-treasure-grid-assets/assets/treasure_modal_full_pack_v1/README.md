# Treasure Question Modal — Full Asset + HTML + CSS

This pack is ready to open directly in Google Chrome.

## Included
- `index.html` — standalone modal demo
- `treasure-modal.css` — layout, responsive styling, hover animations, correct/wrong state animations
- `assets/png/` — 10 high-resolution transparent PNG assets

## Dynamic text
Question text, A/B/C/D, and answer labels are HTML text, so they can be changed from your game data without regenerating assets.

## Correct / wrong states
From your JavaScript, add one of these classes to an answer button:

```js
button.classList.add('is-correct');
button.classList.add('is-wrong');
```

## Show / hide
Add `is-hidden` to the backdrop to hide the modal:

```js
document.querySelector('#treasureModal').classList.add('is-hidden');
```

Remove it to show the modal.

No framework, CDN, or external font is required.
