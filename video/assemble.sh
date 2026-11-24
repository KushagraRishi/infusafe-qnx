#!/bin/bash
# Joins the cards and the recorded QNX session into build/video/infusafe-demo.mp4
#   python3 video/make_cards.py && vhs video/qnx-session.tape && video/assemble.sh
# Optional: SESSION_TRIM=seconds cuts that much off the start of the session (long boot log).
set -e
cd "$(dirname "$0")/../build/video"
TRIM="${SESSION_TRIM:-0}"
ENC=(-c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -r 30)

clip() {  # clip <png> <seconds> <out>
  local d="$2"
  ffmpeg -y -loglevel error -loop 1 -t "$d" -i "$1" \
    -vf "fade=t=in:st=0:d=0.4,fade=t=out:st=$(echo "$d - 0.4" | bc):d=0.4,scale=1600:900" \
    "${ENC[@]}" "$3"
}

clip 01_title.png   4   c01.mp4
clip 02_problem.png 9   c02.mp4
clip 03_live.png    3.5 c03.mp4
ffmpeg -y -loglevel error -ss "$TRIM" -i qnx-session.mp4 \
  -vf "scale=1600:900,fade=t=in:st=0:d=0.4" -an "${ENC[@]}" c04.mp4
clip 04_how.png     9   c05.mp4
clip 05_results.png 9   c06.mp4
clip 06_bugs.png    10  c07.mp4
clip 07_end.png     5   c08.mp4

printf "file '%s'\n" c01.mp4 c02.mp4 c03.mp4 c04.mp4 c05.mp4 c06.mp4 c07.mp4 c08.mp4 > list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -c copy -movflags +faststart infusafe-demo.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 infusafe-demo.mp4 | awk '{printf "infusafe-demo.mp4: %.1f s\n", $1}'
