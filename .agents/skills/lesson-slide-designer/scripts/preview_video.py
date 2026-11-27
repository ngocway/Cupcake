#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Make a quick slideshow video (1080p mp4) from the rendered slide images and the timings in slides.json.

Usage:
  python preview_video.py <slides.json> [--audio <folder with S01.mp3, S02.mp3 ...>] [--out <file.mp4>]

- Images come from <folder of slides.json>/_preview/slide-NN.png (run render_slides.py first).
- Each slide stays on screen for its "duration" (seconds) if set, otherwise for the narration length at
  150 words per minute plus any "Silence N seconds" in its notes.
- With --audio, each slide uses its own recording (S01.mp3 ...) and lasts the recording plus 0.6 s.
- Without audio you get a silent preview to check the pacing or to hand to a video editor.
Needs ffmpeg and ffprobe.
"""
import json
import os
import re
import shutil
import subprocess
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_slides import WPM, pause_seconds_in_notes  # noqa: E402


def audio_seconds(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0 if len(sys.argv) > 1 else 2)
    src = os.path.abspath(sys.argv[1])
    args = sys.argv[2:]
    audio = os.path.abspath(args[args.index("--audio") + 1]) if "--audio" in args else None
    out = os.path.abspath(args[args.index("--out") + 1]) if "--out" in args else None
    if not os.path.isfile(src):
        raise SystemExit(f"File not found: {src}")
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            raise SystemExit(f"{tool} not found. Install ffmpeg (Windows: winget install --id Gyan.FFmpeg -e, "
                             "macOS: brew install ffmpeg, Linux: ffmpeg) and open a new terminal.")
    base = os.path.dirname(src)
    spec = json.load(open(src, encoding="utf-8"))
    name = spec.get("file_name") or os.path.splitext(os.path.basename(src))[0]
    out = out or os.path.join(base, name + ".preview.mp4")
    prev = os.path.join(base, "_preview")
    tmp = os.path.join(prev, "_video")
    os.makedirs(tmp, exist_ok=True)
    parts = []
    for i, d in enumerate(spec["slides"], 1):
        png = os.path.join(prev, f"slide-{i:02d}.png")
        if not os.path.isfile(png):
            raise SystemExit(f"Missing {png}: run render_slides.py first.")
        mp3 = os.path.join(audio, f"S{i:02d}.mp3") if audio else None
        if mp3 and os.path.isfile(mp3):
            dur = audio_seconds(mp3) + 0.6
        else:
            mp3 = None
            words = len(re.findall(r"\S+", d.get("narration", "")))
            dur = d.get("duration") or max(4, round(words / WPM * 60)) + pause_seconds_in_notes(d.get("notes", ""))
        seg = os.path.join(tmp, f"S{i:02d}.mp4")
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", "30", "-i", png]
        if mp3:
            cmd += ["-i", mp3]
        else:
            cmd += ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"]
        cmd += ["-t", f"{dur:.2f}", "-vf", "scale=1920:1080,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast",
                "-r", "30", "-c:a", "aac", "-b:a", "160k", "-af", "apad", seg]
        subprocess.run(cmd, check=True)
        parts.append((seg, dur))
    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w", encoding="utf-8") as f:
        for seg, _ in parts:
            f.write(f"file '{seg.replace(chr(92), '/')}'\n")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", out], check=True)
    total = sum(p[1] for p in parts)
    print(f"Wrote: {out}")
    print(f"Length: {int(total // 60)} min {int(total % 60)} s; {len(parts)} slides; {'with' if audio else 'no'} narration audio")


if __name__ == "__main__":
    main()
