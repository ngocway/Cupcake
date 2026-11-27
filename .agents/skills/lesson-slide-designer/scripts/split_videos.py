#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Split one lesson-level slides.json into N stand-alone decks, one per topic video
(the usual rule for course platforms: one topic per video, 10 to 12 minutes, with its own opening and close).

Usage:
  python split_videos.py <lesson>/slides.json [--build] [--render]

Every slide in the source carries "video": 1..N. The optional key "video_settings" configures each video:
  {"number": 2, "slug": "V2-five-models", "title": "Five delivery models",
   "title_narration": "narration for the generated title slide",
   "objectives": {"label": "...", "items": ["..", ".."], "icons": ["..", ".."], "narration": "..."},
   "closing": {"action": "Next: Video 3 ...", "narration": "...", "icon": "arrow-right", "label": "Next"}}

Each video goes to <lesson>/<video slug>/slides.json (file_name = <lesson file_name>-<video slug>), in this order:
  1. title       the video's own 'title' slide if it has one, else generated from its first 'section' slide,
                 labelled "Video k/N"; that 'section' slide is dropped and its narration moves forward
  2. objectives  the video's own objectives, if configured and the video has no 'objectives' slide
  3. body        the video's slides, unchanged
  4. closing     generated if the video does not end on 'closing' (bridges to the next video);
                 the last video keeps the lesson's closing slide
Re-run after every edit of the lesson-level slides.json (the single source). Never edit the generated decks by hand.
--build runs build_slides.py on every deck; --render also renders the preview images.
"""
import argparse
import copy
import json
import os
import re
import subprocess
import sys
import unicodedata

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from build_slides import WPM, pause_seconds_in_notes  # noqa: E402


def slugify(t):
    # ASCII folding for file names: strip accents; d with stroke (U+0111, U+0110) has no NFD form, so map it by hand
    t = unicodedata.normalize("NFD", t.replace("\u0111", "d").replace("\u0110", "D"))
    t = "".join(c for c in t if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def split(src):
    spec = json.load(open(src, encoding="utf-8"))
    slides = spec["slides"]
    numbers = sorted({s["video"] for s in slides if s.get("video") is not None})
    if not numbers:
        raise SystemExit("No slide in slides.json has a 'video' number")
    n = len(numbers)
    cfg = {c["number"]: c for c in spec.get("video_settings", [])}
    base = spec.get("file_name") or os.path.basename(os.path.dirname(src))
    written = []
    for k in numbers:
        group = [copy.deepcopy(s) for s in slides if s.get("video") == k]
        c = cfg.get(k, {})
        title = c.get("title") or next((s.get("title") for s in group if s["type"] == "section"), f"Video {k}")
        slug = c.get("slug") or f"V{k}-{slugify(title)}"
        label = f"{spec.get('lesson_code', '')} · Video {k}/{n}".strip(" ·")
        out, carried = [], ""
        if group[0]["type"] == "title":
            group[0].setdefault("label", label)
            out.append(group.pop(0))
        else:
            sec = next((s for s in group if s["type"] == "section"), None)
            out.append({"type": "title", "video": k, "label": label, "title": title,
                        "icon": (sec or {}).get("icon", "graduation-cap"),
                        "narration": c.get("title_narration", f"This is video {k} of {spec.get('lesson_title', 'the lesson')}."),
                        "notes": f"Opening of video {k}/{n}: {title}."})
            if sec is not None and group and group[0] is sec:
                carried = sec.get("narration", "").strip()
                group = group[1:]
        obj = c.get("objectives")
        if obj and not any(s["type"] == "objectives" for s in group + out):
            narr = obj.get("narration") or f"By the end of this video you can do {len(obj['items'])} things."
            if carried:
                narr += "\n" + carried
            out.append({"type": "objectives", "video": k, "title": obj.get("title", "This video's objectives"),
                        "label": obj.get("label", "By the end of this video you can"), "items": obj["items"],
                        "icons": obj.get("icons"), "narration": narr, "notes": "Objectives of this video."})
        elif carried and group:
            group[0]["narration"] = carried + "\n" + group[0].get("narration", "")
        out += group
        if out[-1]["type"] != "closing":
            cc = c.get("closing", {})
            nxt = cfg.get(k + 1, {}).get("title", f"Video {k + 1}")
            out.append({"type": "closing", "video": k, "icon": cc.get("icon", "arrow-right"), "label": cc.get("label", "Next"),
                        "action": cc.get("action", f"Next: Video {k + 1}, {nxt}"),
                        "narration": cc.get("narration", f"That is the end of video {k}.\nVideo {k + 1} is about {nxt.lower()}."),
                        "notes": f"Close of video {k}/{n}."})
        for s in out:
            s["video"] = k
        sub = {kk: vv for kk, vv in spec.items() if kk not in ("slides", "video_settings", "videos")}
        sub.update(file_name=f"{base}-{slug}", video_number=k, video_count=n, video_title=title, slides=out)
        folder = os.path.join(os.path.dirname(src), slug)
        os.makedirs(folder, exist_ok=True)
        dest = os.path.join(folder, "slides.json")
        json.dump(sub, open(dest, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        w = sum(len(s.get("narration", "").split()) for s in out)
        minutes = (w / WPM * 60 + sum(pause_seconds_in_notes(s.get("notes", "")) for s in out)) / 60
        print(f"V{k} {slug}: {len(out)} slides, {w} narration words, about {minutes:.1f} min"
              + ("  (OVER 12 MIN, split further)" if minutes > 12.5 else ""))
        written.append(dest)
    return written


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slides", help="the lesson-level slides.json")
    ap.add_argument("--build", action="store_true", help="run build_slides.py on every generated deck")
    ap.add_argument("--render", action="store_true", help="build, then render the preview images of every deck")
    a = ap.parse_args()
    if not os.path.isfile(a.slides):
        raise SystemExit(f"File not found: {os.path.abspath(a.slides)}")
    for p in split(os.path.abspath(a.slides)):
        if a.build or a.render:
            r = subprocess.run([sys.executable, os.path.join(HERE, "build_slides.py"), p])
            if r.returncode:
                raise SystemExit(f"build_slides.py failed on {p}")
        if a.render:
            d = json.load(open(p, encoding="utf-8"))
            pptx = os.path.join(os.path.dirname(p), (d.get("file_name") or "slides") + ".pptx")
            subprocess.run([sys.executable, os.path.join(HERE, "render_slides.py"), pptx], check=True)


if __name__ == "__main__":
    main()
