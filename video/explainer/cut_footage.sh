#!/bin/bash
# Cuts each footage shot into 1280x720 JPG frames at 30 fps: media/frames/<shot>/0001.jpg ...
# Vertical clips sit on a blurred copy of themselves. The pump close-up is cropped to the
# screen and keypad, so no brand name shows.
set -e
cd "$(dirname "$0")/media"
FPS=30
LAND="scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720"
VERT="split[a][b];[a]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,boxblur=24:2,eq=brightness=-0.12[bg];[b]scale=-2:720[fg];[bg][fg]overlay=(W-w)/2:0"
CROP="crop=520:292:380:120,scale=1280:720"

shot() { # shot <name> <file> <start> <seconds> <filter>
  local out="frames/$1"; rm -rf "$out"; mkdir -p "$out"
  ffmpeg -y -loglevel error -ss "$3" -i "$2" -t "$4" -filter_complex "$5,fps=$FPS" -q:v 3 "$out/%04d.jpg"
  echo "$1: $(ls "$out" | wc -l | tr -d ' ') frames"
}

shot patient   px_6207642.mp4  1.0 4.2 "$LAND"
shot drip      px_6248839.mp4  0.5 2.6 "$VERT"
shot pumpline  px_34263157.mp4 1.0 2.2 "$VERT"
shot hand      px_6010955.mp4  0.5 2.2 "$LAND"
shot kink      px_6010955.mp4  3.0 2.7 "$LAND"
shot chamber   px_35429657.mp4 0.3 2.5 "$VERT"
shot nurse     px_6130030.mp4  1.0 3.0 "$LAND"
shot patient2  px_6207635.mp4  1.0 5.6 "$LAND"
shot keypad    px_8311305.mp4  0.5 1.4 "$CROP"
