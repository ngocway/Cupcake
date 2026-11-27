# Narration and the video script

`<file_name>.video-script.md`, written by `build_slides.py`, is **the one file to hand to the video step**: a human editor, a video tool, or an automated text-to-speech pipeline. For every slide it gives the order, type, layout, estimated seconds, the text on screen, the production notes and the narration. The narration is also in each slide's speaker notes, so you can present live or use PowerPoint's own recording feature.

## 1. Narration rules (written for text-to-speech, and for humans reading aloud)

1. **Only the words to be spoken.** No labels, no markdown, no numbering, no stage directions (those go in `notes`).
2. **One breath per line**, one idea, about 5 to 20 words. Every line ends with `.` (long pause), `,` (short pause), `?` (rising question) or `!`. The script warns about lines without one.
3. **Numbers, symbols and abbreviations as spoken**: "thirty percent", "module three", "five to ten minutes". Text-to-speech engines read digits unpredictably, so the script warns about digits in narration. Codes nobody reads aloud are fine; say why when you report.
4. **Never read the slide word for word** (the redundancy principle). The slide holds keywords; the voice explains, gives the example, asks the question.
5. **Spoken language**: short and long sentences mixed, "you", no "in this lesson we will", no long hello. See `plain-human-voice.md`.
6. **Pace**: about 150 words per minute for timing estimates (140 to 160 for English). Measure the real audio once it exists; synthetic voices are often faster. Most slides run 15 to 60 seconds; question slides add time for the learner to work.
7. **Pauses**: a `question` slide says "pause the video" (or the equivalent in your language) in its narration, and the time the voice gives must match the `timer` label on the slide. The script stops when they disagree, because learners would see one number and hear another. Write the silence in `notes` ("Silence 3 seconds" when the learner pauses the video themselves; "Silence 40 seconds" when the video should wait).
8. **Point backwards only at what was named.** "These four models" is fine only after the four models were named on screen or in earlier narration; otherwise listeners cannot tell what is meant. The script checks this for English phrasing.

## 2. Production notes (`notes`)

Plain words an editor understands: "Reveal the cards one by one with the narration, 0.25 s apart"; "Circle answer B after a 5 second silence"; "Insert clip A, 75 seconds, the slide keeps only its title"; "Zoom into the Share column when the voice says seventy-five percent".

Motion that works for lesson videos: elements enter in 0.5 to 0.8 s and leave in half that time; stagger reveals by 0.1 to 0.25 s; text that is being read never moves; no spins, flips or explosions; nothing stands still longer than about 25 seconds.

## 3. Read every item on its own slide

For `summary` and `two-column` (every slide whose items appear one by one):
- The narration of that slide reads **each** item, and the item appears as its sentence is spoken. Do not read a few keywords and let the rest appear in silence.
- An item shown on one slide is read on that slide, not on the next one.
- Paraphrase is fine as long as the narration contains at least half of the item's content words.
- After the last item, hold the frame 3 to 4 seconds (one short extra sentence or a `duration`) so viewers can finish reading.
- The build reports both problems as errors. Run `build_slides.py slides.json --check-only` to check without writing files.

## 4. Handing over to video

- **Quick pacing check**: `render_slides.py` (1920x1080 images), then `preview_video.py slides.json` for a silent slideshow at the scripted timings. With one audio file per slide (`S01.mp3`, `S02.mp3`...) add `--audio <folder>` for a narrated version timed to the audio.
- **Full production**: give the editor or the video tool `<file_name>.video-script.md` plus `_preview/slide-NN.png` (or the .pptx). Any text-to-speech engine works: generate one clip per slide from its narration, check pronunciation of names and terms, then cut to the images and add the reveals from `notes`.
- **One video per topic**: split a long lesson with `split_videos.py` first, then produce each video from its own folder.
