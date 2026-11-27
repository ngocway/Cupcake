---
name: lesson-slide-designer
description: Turn one lesson (a lesson plan, a teaching script, a syllabus section or notes) into a clean, lively PowerPoint deck (.pptx, 16:9, icons, native charts, speaker notes) plus one video script file that a video editor or a text-to-speech pipeline can use to produce a narrated slideshow video. Follows instructional design rules (one idea per slide, a visual on every slide, 6x6 text, nothing under 24 pt, dark background, three colours, a title-to-closing lesson structure) and checks every rule with a script before handing anything over. Use this skill whenever the user wants slides, a slide deck, a PowerPoint, a presentation or a slideshow for a lesson, lecture, class, workshop, training session, online course video or Udemy lecture, or says "turn this lesson into slides", "make the deck for module 2", "slides for my course video", even if they never say PowerPoint. Not for writing the lesson content itself or for business pitch decks.
---

# Lesson Slide Designer

Turn the content of **one lesson** into a **slide deck people can learn from** and a **video script** for the narrated version. One lesson at a time, one folder per lesson.

Output, in `slides/<course>/<lesson>/` unless the user names another place:

| File | What it is |
|---|---|
| `slides.json` | The single source: every slide as data, using 16 slide types (`references/slide-types.md`). Edit this, then rebuild |
| `<file_name>.pptx` | The 16:9 deck, Arial, a three-colour theme; each slide's narration is in its speaker notes |
| `<file_name>.video-script.md` | **The file for the video step**: one block per slide with on-screen text, production notes, narration ready for text-to-speech, and seconds, plus an overview table |
| `_preview/slide-NN.png`, `_preview/contact-sheet.png` | 1920x1080 images of every slide and a contact sheet, for your own visual check and as frames for a video |
| `<file_name>.preview.mp4` (optional) | A silent slideshow at the scripted timings, or a narrated one when per-slide audio exists |

Tools the scripts use: Python 3.9+ with `python-pptx`, `Pillow`, `lxml` (all in `requirements.txt`) to build; LibreOffice (deck to PDF) and Poppler's `pdftoppm` (PDF to PNG) to render previews; `ffmpeg` for the optional preview video. Icons are the Lucide set (ISC licence) in `assets/icons/`, shipped pre-rendered in `assets/icons/png/`, so a build needs no SVG tool. Only an SVG icon the user adds needs a rasterizer; the build error lists the choices (`pip install resvg-py` is the simplest). When a script says a tool is missing, give the user the install command it prints, do not work around it.

**Where the scripts are.** `scripts/`, `references/`, `templates/` and `assets/` are folders of this skill, next to this file. Run the commands below from the user's project root and put the skill folder in front of `scripts/`, for example `.claude/skills/lesson-slide-designer/scripts/build_slides.py` (project install) or `~/.claude/skills/lesson-slide-designer/scripts/build_slides.py` (personal install). The `slides/...` paths are relative to the project root.

**Which Python.** If the user's project has a `.venv` folder, run every script with that environment's Python: `.venv/Scripts/python` on Windows, `.venv/bin/python` on macOS and Linux. Otherwise use `python`. The commands below say `python`; swap in the venv path when there is one. If a script fails with `ModuleNotFoundError`, install `requirements.txt` into that same Python rather than into another one.

## Workflow

### Step 0. Read the source and settle the brief

1. Read **all** of the lesson source: objectives, audience, delivery mode, the lesson plan with minutes, the script, the questions with answers, any slide outline, handouts. If the user only gives a title, ask for the content or write it first (the companion skill `lesson-content-writer` does exactly that).
2. Read `references/slide-standards.md` (the rules and the deck structure) and `references/slide-types.md` (the 16 types and their text limits).
3. Settle: delivery (self-paced video, so every video is a cluster with its own open, body and close plus pause slides; or live class, so slides to ask the room and to brief practice); language (`language`: the language the user writes in; the built-in labels and the language-specific narration checks are English, so for another language set every label the script would add, listed in `references/slide-types.md`, and tell the user that the "Next lesson: " and "Source: " prefixes stay English); theme (default `navy`; one theme per course, reuse it lesson after lesson); how the instructor addresses learners (take it from the script); instructor name and contact for the footer.
4. The footer. `instructor` and `contact` print as "instructor · contact" on the title slide and at the bottom of every slide. Default configured for this workspace: `instructor: "Dolcake"` and `contact: "dolcake.com"`. To drop the footer text, set both keys to `""`. Optional `footer_text` overrides the footer line on every slide except the title slide.

### Step 1. Plan the deck

From the source's slide outline, or from the lesson sequence, write a table: # | type | the one idea of the slide | visual or icon | question or pause | video number. Constraints:
- Full structure: `title` -> (`question`, a try-it-first opener, if the lesson has one) -> `objectives` -> `agenda` -> for each part a `section` (or the `agenda` again with `current` set to that part's number) -> 2 to 5 content slides -> at least one `question` -> `summary` -> `closing`. The script counts both kinds of divider.
- Some slide types print a default label or prefix ("By the end of this lesson you can" on `objectives`, "Next lesson: " before `next_lesson` on `closing`, and others). Check the defaults table in `slide-types.md` so the title or the text does not repeat them.
- **One idea per slide.** At least 4 slide types per deck, never 3 of the same type in a row, a pause or question at least every 10 to 12 minutes of narration.
- Plan the **emotional arc** and put a **rhythm breaker** at the 1/3 and 2/3 marks; write titles as **statements**, not labels (`references/rhythm-and-titles.md`). Numbers with a source go on `big-numbers` or `chart`, not in bullets.
- Facts, terms, numbers and examples come from the lesson source only. Never invent them. Examples come from the learners' own work.
- Video courses: follow the lesson plan, cover **every section, example, pause question and worked sample** of the source on a slide or in the narration, and declare `videos` with planned minutes so the script can warn about thin videos. A slide outline in the source is a floor, not a ceiling. A 100-minute lesson usually needs 35 to 60 slides; the 17-slide template is a technical demo, not a full lesson.

### Step 2. Write `slides.json`

Copy `templates/slides.example.json` and fill it from the plan. For every slide:
- On-screen text is **keywords and short lines** that fit at 24 pt (limits per type in `slide-types.md`). Too long? Split the slide. Never shrink the text.
- `narration`: from the lesson script, rewritten for the ear (`references/narration-and-video-script.md`): one breath per line, each line ends with `.` `,` `?` or `!`, numbers written as spoken, the slide is never read out word for word, question slides say "pause the video".
- `notes`: production directions (reveal one by one, point, circle, insert clip, "Silence 60 seconds").
- Pick icons by meaning (`slide-types.md`, section 4) and keep one icon per recurring concept for the whole course. Real images (screenshots, product photos) sit next to `slides.json` with their source in `IMAGE-SOURCES.md`. Ask before downloading images from the web, and check the licence.
- Write like a person, not a brochure (`references/plain-human-voice.md`).

### Step 3. Build and check

```bash
python scripts/build_slides.py slides/<course>/<lesson>/slides.json
```
The script STOPS on hard violations: more than 6 lines, text that does not fit at 24 pt, an orphan word that cannot be fixed by pulling two words together, a missing icon or image, an unknown type, a banned dash or stock AI phrase, a timer label that disagrees with the narration, an item the narration never reads. Fix `slides.json` and rebuild until there are **0 errors**. Read every warning too (long lines, digits in narration, three slides of one type in a row, no rhythm breaker, thin videos, a quantity in the narration that the slide never shows, "required" said aloud but not written, a title count that disagrees with its list, a total inside a process slide) and fix it or note why not.

```bash
python scripts/render_slides.py slides/<course>/<lesson>/<file_name>.pptx
```
**Look** at `_preview/contact-sheet.png`, then at each `slide-NN.png` at full size, with the checklist in `slide-standards.md` section 5: clipped or overlapping text, big empty areas, misalignment, readable at a third of the size, one focal point per slide. Fix, rebuild, look again until a full pass shows nothing. Never report done without looking at the latest render.

Optional, to check the pacing or to hand over a draft video:
```bash
python scripts/preview_video.py slides/<course>/<lesson>/slides.json [--audio <folder with S01.mp3 ...>]
```

Long lessons on video platforms (one topic per video, 10 to 12 minutes): keep one lesson-level `slides.json` with a `video` number on every slide and split it:
```bash
python scripts/split_videos.py slides/<course>/<lesson>/slides.json --build --render
```
Each video gets its own folder and deck with a title slide ("Video k/N"), its own objectives, its body and a closing that bridges to the next video. Edit the lesson-level file, never the generated ones.

### Step 4. Report

Give the user: the paths of the deck, the video script and the contact sheet; a short overview table (# - type - idea - seconds); slide count and estimated length; the theme; your assumptions (form of address, numbers and where they came from); warnings you left and why; and, if the footer still reads "Your name · yoursite.com", a line telling the user to change `instructor` and `contact` in `slides.json` and rebuild. Show the contact sheet.

## Several lessons in a row

Reuse the theme, footer, form of address and the icon-per-concept set of the earlier lessons in the same course folder. Keep `title` and `closing` slides identical in layout across the course, and let each closing bridge to the next lesson.

## Principles

- **The standards do not move** (`slide-standards.md`). The content inside them is where the creativity goes. The script is the gatekeeper; never switch a check off to get through.
- **Slides are for the eyes, narration is for the ears.** The two channels add to each other and never duplicate.
- **Learners do something.** Every part has a question or a pause; the deck ends with one concrete action.
- **Titles in capitals** by default (`"title_case": "upper"`), the JSON stays as written so narration and subtitles are unaffected. Capitals run wider, so keep titles short.
- **24 pt is the floor for everything**, labels, captions, sources and footers included. Too long means rewrite, not shrink.
- **No orphan words.** One word alone on the last line of a title, card, step or bullet looks broken. The script pulls the last two words together when that fits, and stops when it does not.
- **Run it, then hand it over.** Build, render, look, measure. Never guess.
- To add a slide type, add an `s_<type>` method in `scripts/build_slides.py`, register it in `KINDS`, document it in `slide-types.md`, and build a test deck before using it.

## Reference files

- `references/slide-standards.md` - what digital learning slides are, the ten design rules and how the script checks each, the deck structure, multimedia learning principles, the pre-delivery checklist.
- `references/slide-types.md` - the `slides.json` format, the 16 slide types with text limits, themes, video planning, the icon list.
- `references/narration-and-video-script.md` - narration rules for text-to-speech or a human voice, production notes, reading every on-screen item, handing over to video production.
- `references/rhythm-and-titles.md` - the emotional arc of a lesson, rhythm breakers at 1/3 and 2/3, statement titles, sentence patterns for openers, comparisons, numbers and closings.
- `references/plain-human-voice.md` - how to remove the AI voice: banned dashes and phrases, sentence rhythm, concrete details, opinion.
- `templates/slides.example.json` - a 17-slide demo lesson that uses every major type, already built and checked.
