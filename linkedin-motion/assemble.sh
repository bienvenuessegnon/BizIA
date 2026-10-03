#!/usr/bin/env bash
# Assemble a LinkedIn-ready MP4: 1080x1350, 25 fps, H.264 + AAC, faststart.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist export

ffmpeg -y \
  -framerate 25 -start_number 0 -i "${FRAME_DIR:-/tmp/li-frames}/%04d.png" \
  -i dist/audio.wav \
  -map 0:v:0 -map 1:a:0 \
  -frames:v 1125 \
  -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.0 \
  -pix_fmt yuv420p \
  -maxrate 14M -bufsize 28M \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart \
  export/linkedin-45s-4x5.mp4

ffmpeg -y -ss 20.40 -i export/linkedin-45s-4x5.mp4 -frames:v 1 -update 1 export/thumbnail.jpg

ffprobe -v error -show_entries format=duration,size,format_name -show_streams \
  -of compact export/linkedin-45s-4x5.mp4
ls -lh export/linkedin-45s-4x5.mp4 export/thumbnail.jpg
