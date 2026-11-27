# Changelog

## v1.3.4 - 2026-11-19

- **Output follows the language the user writes in.** This replaces the English-default wording of the previous release: whatever language the request is in, the lesson text comes back in it. Only fixed labels that ship in English stay English.

## v1.3.3 - 2026-11-19

- **English is the default output language,** stated in SKILL.md: another language only when the user asks for it or the material is in it. The docs no longer show a Vietnamese language code as an example, so nobody reads it as a supported option.

## v1.3.2 - 2026-11-19

- **The Vietnamese language mode is removed.** `build_slides.py` no longer has a Vietnamese entry for the default labels and prefixes, the stock-phrase list, the stop words, the spoken numbers and durations, the word pairs kept on one line, or the "these four models" check. The structure stays, with `en` as the only entry, so another language can be added in `DEFAULT_TEXT` and `AI_PHRASES`.
- A deck in any language other than `en` gets English default labels and prefixes, the English stock-phrase check, and the checks that do not depend on language.
- English output is unchanged. The template and the example deck build to the same video script, byte for byte, and the same slide text, with 0 errors and 0 warnings.
- README, SKILL.md and the references no longer promise Vietnamese support. The table of default labels in `references/slide-types.md` lists English only. The source of the slide rules is cited by its English title.
- Comments and docstrings are in English only, and no tracked text file holds Vietnamese text.

## v1.3.1 - 2026-11-19

Fixes from an audit that followed the README on a clean machine.

- The build no longer needs an SVG rasterizer. Before, `requirements.txt` installed `cairosvg`, which needs the native Cairo library; on Windows that library was only there when Poppler's `bin` folder was on PATH, so a new user got "No SVG rasterizer found. Install one: pip install cairosvg" with `cairosvg` already installed, and no deck. The 125 icons now ship pre-rendered in `assets/icons/png/` and are tinted with Pillow. The icons keep the size and shape `cairosvg` gave them (same alpha channel; the colour differs by at most 2 in 255 on edge pixels).
- `requirements.txt` drops `cairosvg`. An SVG icon you add yourself is still rasterized at build time, by the first of `resvg-py`, `cairosvg`, `sharp-cli`, `rsvg-convert`, Inkscape; when none works the error says why each one failed and how to install one. `build_slides.py --prerender-icons` writes the PNG for new SVG icons.
- `templates/slides.example.json` now matches the example deck (the closing slide says "within seven days"), so the template builds with 0 warnings. v1.3.0 had changed only the example.
- `--help` exits with code 0 in every script, and `split_videos.py --help` prints its full description.
- Clear messages in place of tracebacks: a `slides.json` or `.pptx` that does not exist, invalid JSON, a LibreOffice conversion that fails (its own error text is shown). `render_slides.py` checks for LibreOffice and `pdftoppm` before it starts, and the messages for missing LibreOffice, Poppler and ffmpeg give the install command.
- README: a table of what to have before installing (Git, Python, Claude Code) with a check command and a link for each; a note for Git Bash on Windows; `python3-venv` on Debian and Ubuntu; what LibreOffice and Poppler each do; where to change the font (`FONT`, `FONT_FILES`); the icon count is 125, not 126. The claim about the Claude desktop and web apps now says what is needed there and that it is untested.
- SKILL.md: says where the `scripts/` folder is relative to the user's project, so the commands run as written.

- **Linux without Arial: the false "does not fit" errors now explain themselves.** Without Arial or Liberation Sans the width estimate is rough and the build refused the shipped template. The error list now starts with the cause and the install command, and `fonts-liberation` is in the Debian and Ubuntu install line.

## v1.3.0 - 2026-11-18

- A label and its number ("Stage 4", "Lesson 3", "Step 2", "Part 1") now stay together across a line break, in every language, so a number never drops to a line of its own.
- New warning: the narration says a quantity ("ten questions", "twenty minutes") that no text on the slide carries. Anything the learner must do or reach has to be on screen.
- New warning: the narration says an item is required or mandatory but the slide does not.
- New warnings for patterns that confuse viewers: a total or overall figure inside a `process` slide (use `cards`), a title that promises a count that differs from the list under it, a "this lesson" question in a multi-video lesson with no scope, a slide missing from the middle of an "X N of M" label chain.
- The example closing slide now writes "within seven days" on screen, as its narration says.

## v1.2.0 - 2026-11-17

- New optional deck key `footer_text`: replaces the footer text on every slide except the title slide, which keeps `instructor · contact`. Without it nothing changes.
- The course name on the title slide is now 28 pt (was the 24 pt floor) and steps down to 24 pt only if it does not fit on one line. Decks without a long course name differ from v1.1.0 only in this line on the cover.

## v1.1.0 - 2026-11-17

Fixes from a first run by a new user on Windows 11 (Python 3.12 in a venv, LibreOffice and Poppler from winget).

- README: PowerShell commands for Windows next to the bash ones, for both the personal and the per-project install. Every install now makes a `.venv` in the project and installs `requirements.txt` into it.
- README: how to install LibreOffice and Poppler (`pdftoppm` on PATH) on Windows (winget), macOS (Homebrew) and Linux (apt, dnf), how to check it, and what to do when `pdftoppm` is not found. A note on Arial and Liberation Sans for the text measurement.
- SKILL.md: Claude runs the scripts with the project's `.venv` Python when there is one (`.venv/Scripts/python` on Windows, `.venv/bin/python` elsewhere), otherwise `python`.
- SKILL.md: Claude takes or asks for the instructor name and contact for the footer, and when none is given, says in the report that every slide still reads "Your name · yoursite.com" and how to change it.
- `build_slides.py`: the part-divider check now counts an `agenda` repeated with `current` set to part 2 or later, as SKILL.md always allowed. Before, a deck that used repeated agendas instead of `section` slides got a false warning ("The agenda lists 3 parts but there are only 0 'section' slides"). Decks without enough dividers still get the warning, now naming both kinds.
- `references/slide-types.md`: a table of the labels and prefixes the script adds by itself ("By the end of this lesson you can", "Next lesson: ", "Source: " and the rest, in English and Vietnamese), how to change or hide each, the extra English text `split_videos.py` writes, and what the footer prints by default.

## v1.0.0 - 2026-11-12

First public release.
