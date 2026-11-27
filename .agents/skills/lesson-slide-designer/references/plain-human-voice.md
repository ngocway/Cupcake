# Plain human voice

Everything on the slides and in the narration should read like a real teacher, not like a brochure written by a machine. The build script blocks what a machine can catch (dashes, stock phrases); the rest you catch by reading the narration out loud.

## 1. Dashes: only the plain hyphen "-"

Allowed: the ordinary hyphen-minus (U+002D) for compounds, codes and ranges: "hands-on", "M04-L02", "25-45%".

Not allowed: the em dash (U+2014), the en dash (U+2013) and their relatives (U+2012, U+2015, U+2010, U+2011, U+2212, U+2043, U+FE58, U+FE63, U+FF0D). Where a dash was used as punctuation, rewrite the sentence with a comma, a colon, brackets or a new sentence. Do not just swap the character.

## 2. Stock phrases the script blocks

English: delve, in today's fast-paced world, ever-evolving, tapestry, game-changer, unlock the power, unleash, harness the power, seamless, cutting-edge, state-of-the-art, it is worth noting, plays a crucial (vital, pivotal) role, a testament to, in conclusion, embark on, let's dive in, dive into, navigate the complexities, elevate your, holistic, synergy, paradigm shift, robust, leverage, and "not only... but also".

Only the English list ships, and it runs on every deck whatever its `language`. Add a list for another language in `AI_PHRASES` inside the script, under that language's code.

## 3. Structures that give the AI voice away (check by hand)

- **Tidy triplets everywhere**: "fast, simple and effective". People say one or two things, or four or five in a messy list.
- **Every lesson opening the same way** (rhetorical question, then lead-in, then content). Vary the opening: a story, a mistake, a number, a try-it-first task.
- **Every sentence the same length**, pauses placed a little too neatly. Real speech mixes long sentences with three-word ones. Narration may, and should, do that.
- **The read-aloud test**: if it sounds like a presentation or a report, rewrite it as if you were explaining it to a friend across the table.
- Bold everywhere, emoji, advertising headlines, too many sub-headings inside the narration.

## 4. Concrete instead of generic

- "A customer", "many years ago" become a person, a place and a time from the lesson source: "Maria, a nurse educator in Leeds", "back in March 2022". Do not invent them; if there is no real detail, say it is a made-up example.
- Odd numbers with a source ("47% of learners") sound true; round numbers without one ("50%") sound made up. A number without a source does not go on a slide.

## 5. A real person's voice

- Allow the instructor's own expressions and a little informality; a sentence that is not textbook grammar is fine in narration.
- Have an opinion. It is fine to be annoyed at a common mistake or to say which option you would pick. Stay respectful to learners and fair to people and platforms, and promise no income.

## 6. How to check

1. `build_slides.py` finishes with 0 errors (dashes and stock phrases in both on-screen text and narration).
2. Read the whole narration out loud once. Rewrite anything that sounds like a report.
