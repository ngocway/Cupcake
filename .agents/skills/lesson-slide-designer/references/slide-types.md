# slides.json and the 16 slide types

`scripts/build_slides.py` reads one JSON file and writes the deck and the video script. Full example: `templates/slides.example.json`.

## 1. Deck-level keys

```json
{
  "course": "Course name",                  // on the title slide (in capitals by default)
  "organization": "School, company or brand", // smallest line on the title slide (optional)
  "lesson_code": "Module 4 · Lesson 2",     // default label on title and agenda slides
  "lesson_title": "Lesson title",           // title slide heading
  "instructor": "Your name",
  "contact": "yoursite.com",                // footer: "instructor · contact"
  "footer_text": "",                        // optional: replaces the footer text on every slide except the cover
  "language": "en",                         // any language; "en" gets extra narration checks
  "theme": "navy",                          // navy | light | forest | plum
  "title_case": "upper",                    // upper (default) | as-written
  "file_name": "M04-L02-lesson-name",       // name of the .pptx and .video-script.md
  "voice": "Narrator or TTS voice",         // written into the video script (optional)
  "videos": [ {"number": 1, "title": "...", "minutes": 11} ],   // optional, see section 2
  "slides": [ ... ]
}
```

Themes (background / text / accent; cards and muted text are tints): `navy` 14213D / white / amber FCA311 (default, dark background with light text); `light` white / navy 1E2761 / orange-red E05A2B (for print); `forest` 0F3D2E / F5F5F5 / green 97BC62; `plum` 2D1B4E / white / yellow F9C846. Every theme passes a contrast check (text and muted text at least 7:1 on the background, 6:1 on cards). Use one theme for a whole course.

## 2. Planning video length (video courses)

A lesson plan splits a lesson into videos with planned minutes. Declare them and give every slide a `video` number; the script adds narration time (150 words per minute) and pauses (`duration`, or "Silence N seconds" in `notes`) per video, warns when a video is under 60% of its plan or more than 35% over, and prints a coverage table in the video script. It warns rather than stops, because the source can be shorter than the plan: then fix the plan or add real content. Never pad with filler.

```json
"videos": [
  {"number": 1, "title": "Four pieces of advice", "minutes": 11},
  {"number": 2, "title": "Five delivery models", "minutes": 12}
],
"slides": [ {"type": "title", "video": 1, ...}, ... ]
```

For one deck per video, see `split_videos.py` and its `video_settings` key (documented at the top of the script).

## 3. Keys every slide can have

| Key | Meaning |
|---|---|
| `type` | required, one of the 16 types below |
| `narration` | what the voice says on this slide (rules in `narration-and-video-script.md`); goes into the speaker notes and the video script |
| `notes` | production directions: reveals, pointer, circles, clips, "Silence 60 seconds" |
| `duration` | seconds, overrides the time computed from the narration |
| `video` | video number, when the lesson is split into videos |
| `label` | small accent label above the title, for example "Part 2 · Structure" |
| `icon` | Lucide icon name (section 4) for types with one main icon |

## 4. The 16 types

Limits assume 24 pt Arial on a 16:9 canvas. The script measures with the real font and stops when text does not fit, so write short and build to check.

| Type | Layout | Its own keys | Limits |
|---|---|---|---|
| `title` | centred | `title` (default `lesson_title`), `label` (default `lesson_code`), `icon` or `image` | title at most 2 lines at 44 pt |
| `objectives` | vertical grid | `items` [3 or 4], `icons` [one per item], `title`, `label` | each item at most 2 lines (about 90 characters) |
| `agenda` | vertical grid | `items` [3 to 6], `current` (number of the part being taught, highlighted), `start` | one line per item |
| `section` | centred | `number` (1 to 99), `title`, `subtitle`, `icon` | title at most 2 lines |
| `cards` | grid | `title`, `cards` [2 to 6 of {`icon`, `title`, `text`}] | 6 cards: title one line (about 20 characters), text 2 lines (about 40); 3 cards: about twice that |
| `two-column` | half and half | `title`, `items` [up to 6 bullets], `image` or `icon`, `visual_side` ("left" or "right"), `caption` | text column 6.6 in, about 40 characters per line |
| `process` | horizontal (up to 4 steps) or vertical timeline (5 or 6) | `title`, `steps` [2 to 6 of {`title`, `text`, `icon`}] | horizontal: step title 2 lines; vertical: title and text one line each |
| `compare` | half and half | `title`, `left` {`title`, `items`, `icon`}, `right` {...} | up to 4 short lines per side |
| `big-numbers` | horizontal grid | `title`, `numbers` [1 to 4 of {`value`, `label`, `icon`}] | `value` up to about 8 characters; `label` 2 lines |
| `question` | centred on the **accent background** | `question`, then `options` [2 to 4] **or** `instructions`, `timer`, `label`, `icon` | question 2 lines at 34 pt; give the answer on the next slide or in `notes` |
| `key-message` | centred | `message`, `subtitle`, `label`, `icon` | message 3 lines at 40 pt |
| `image` | centred | `title`, `image`, `caption` | the image keeps its ratio inside 12 x 4.7 in |
| `table` | grid | `title`, `columns`, `rows`, `widths` (relative weights) | at most 5 data rows and 4 columns; every cell at 24 pt |
| `summary` | horizontal grid | `keywords` [3], `items` [up to 3], `title`, `label` | keywords up to 3 words |
| `closing` | centred | `action` (the one thing to do next), `next_lesson`, `label`, `icon` | action 3 lines at 34 pt |
| `chart` | half and half | `title`, `chart_type` (column, bar, pie, line), `categories` [2 to 6], `values`, `unit` ("%", " min"), `highlight` (position of the bar in the accent colour), `takeaway` (one sentence), `source`, `icon` | native, editable PowerPoint chart; takeaway 3 lines; source about 30 characters |

Image paths are relative to `slides.json`; PNG or JPG; the build stops when an image is missing.

**Text the script adds by itself.** Leave a key out and the script prints its default (from `DEFAULT_TEXT` in `scripts/build_slides.py`, by `language`; only `en` ships, so a deck in any other language gets the English text below unless you set the key). Know these before you write titles, or the slide says the same thing twice.

| Slide | Key | Default | How to change it |
|---|---|---|---|
| `objectives` | `title` | Learning objectives | set `title` |
| `objectives` | `label` | By the end of this lesson you can | set `label`; `""` hides it. Write the items so they follow it ("Sort ...", not "You can sort ...") |
| `agenda` | `title` | What this lesson covers | set `title` |
| `agenda` | `label` | the deck's `lesson_code` | set `label`; `""` hides it |
| `title` | `title`, `label` | `lesson_title`, `lesson_code` | set them on the slide |
| `section` | `label` | Part | set `label` (the big number comes from `number`) |
| `question` | `label` | Pause the video and answer | set `label`, for example "Ask the room" in a live class |
| `summary` | `title` | Three things to remember | set `title` |
| `summary` | `label` | Summary | set `label`; `""` hides it |
| `closing` | `label` | Do this next | set `label` |
| `closing` | prefix of `next_lesson` | "Next lesson: " | always added. Give only the name: `"next_lesson": "Write objectives with Bloom's verbs"`, not "Next lesson: Lesson 2: ...". Leave `next_lesson` out to drop the box |
| `chart` | prefix of `source` | "Source: " | always added; give only the source name |

The prefixes are changed in `DEFAULT_TEXT`. To add a language, add an entry for its code there with the same keys. `split_videos.py` writes a few slides of its own in English whatever the language: a title slide labelled "`lesson_code` · Video k/N", objectives titled "This video's objectives" with the label "By the end of this video you can", and a closing labelled "Next" with the action "Next: Video k+1, <title>". Change the objectives and closing text in `video_settings`; for the title slide, give that video its own `title` slide with a `label`.

**The footer.** Every slide except `title` carries, at the bottom, `instructor · contact` on the left (the two deck-level keys joined by " · "), the slide number "n/N" on the right, and a thin progress bar in the accent colour. The `title` slide shows `instructor · contact` centred under the visual instead. The optional deck-level key `footer_text` replaces that left-hand footer text on every slide except `title`, which keeps `instructor · contact`; use it for a series name or a copyright line. With neither key nor `footer_text` set, the footer text is empty and only the number and the bar remain. `templates/slides.example.json` and the example deck use the placeholders `"instructor": "Your name"` and `"contact": "yoursite.com"`, so a deck copied from them prints "Your name · yoursite.com" on every slide until you replace both keys and rebuild. Set them to `""` to remove the text. The course name on the title slide is set at 28 pt and steps down to the 24 pt floor only when it will not fit on one line.

**Orphan words.** When one word would sit alone on the last line, the script first tries the standard fix (a non-breaking space between the last two words). If that still does not fit, it stops and asks you to rewrite. You can also break a line yourself with `\n`, for example a key message `"Over ten minutes? Cut,\ndo not talk faster."`.

**Items read aloud.** On `summary` and `two-column` slides the items appear one at a time with the voice, so the narration of that same slide must read every item (at least half of each item's content words). Reading it on the next slide is an error too.

## 5. Icons

The Lucide set (ISC licence) lives in `assets/icons/*.svg`; use the file name without `.svg`. Icons are drawn in the accent colour, or in the background colour on an accent circle, and rasterised to PNG once per deck (cache in `_icons/`).

Useful groups:
- **Learning**: book-open graduation-cap presentation pen-tool pencil edit-3 clipboard-list clipboard-check list-checks file-text folder
- **People**: user users smile frown hand thumbs-up thumbs-down ear eye brain heart
- **Goals and results**: target flag trophy award star check-circle x-circle alert-triangle info help-circle
- **Time**: clock timer calendar pause-circle play-circle
- **Media and tech**: video camera mic monitor laptop smartphone image headphones music volume-2
- **Ideas**: lightbulb sparkles zap rocket compass puzzle search zoom-in
- **Process**: arrow-right arrow-left arrow-up arrow-down chevron-right repeat refresh-cw layers layout-grid settings sliders-horizontal wrench scissors
- **Numbers**: bar-chart-3 pie-chart trending-up activity gauge percent hash scale
- **Communication**: message-circle message-square mail phone send share-2 megaphone bell link globe
- **Other**: quote type text list tag bookmark shield lock key gift coffee home building briefcase dollar-sign map-pin sun moon leaf flame droplet database cloud download upload printer keyboard mouse-pointer ruler palette plus minus divide equal

Every icon above also ships as a 512 px PNG in `assets/icons/png/`; the build tints that PNG with Pillow and needs no SVG tool.

Need another icon? Copy its SVG from the Lucide set (https://lucide.dev) into `assets/icons/` under the same name. An icon without a PNG is rasterized from its SVG at build time, which needs one SVG rasterizer on the machine: `pip install resvg-py` (Python 3.10 or newer) is the simplest, and `cairosvg`, `sharp-cli`, `rsvg-convert` and Inkscape also work. `python scripts/build_slides.py --prerender-icons` then writes the PNG for every new SVG, so later builds need no rasterizer. If you replace an SVG that already has a PNG, delete that PNG first.

## 6. A short example

```json
{
  "type": "cards",
  "label": "Part 1",
  "title": "Three parts of every video",
  "cards": [
    {"icon": "play-circle", "title": "Open", "text": "Hook, promise, route"},
    {"icon": "layers", "title": "Body", "text": "Two to four ideas, one example each"},
    {"icon": "flag", "title": "Close", "text": "Three takeaways, one action"}
  ],
  "narration": "Every video has three parts.\nThe open, the body and the close.\nThe open gets thirty seconds, no more.",
  "notes": "Reveal the three cards one by one with the narration."
}
```
