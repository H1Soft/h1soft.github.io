# Native app walkthrough provenance

Recorded on 17 September 2026. This is a continuous recording of the working Android app, not a screenshot slideshow, animation mock-up, or generated video.

## Source

- App: `output/nonogram-trip-preview.apk`, package `com.nonogram.trip`.
- APK SHA-256: `be04f159d9297da6e46d0124a829f14ede1506d2b8b7d1adbdb82695856d8304`.
- Device: dedicated `NonogramTrip_QA` Android 15 / API 35 emulator, serial `emulator-5586`, 1080 × 2400 native display.
- The unrelated `emulator-5554` and physical devices were not used or modified.
- App language: English; light appearance. The QA profile already had two unfinished flights and automatic empty-cell marking enabled. The recorded flight, **NT-0103 · Palace Gate**, began with a fresh board and was completed through real touch input.
- Touch input was scripted through `adb` for repeatable timing. The three strokes filled the first row, the remaining first-column cells, and the remaining fourth-column cells. These are the actual cells in the bundled puzzle. The app itself handled automatic marks, completion, photo development, and persistence.
- No puzzle state, completion record, or result image was injected during capture. The final album shows the newly earned photo and a count of 1 / 16.

## Published files

| File | Format / contents | Size |
| --- | --- | ---: |
| `public/media/nonogram-trip.mp4` | H.264 Main, yuv420p, 720 × 1600, 30 fps, **35.000 seconds**, 1,050 frames, no audio | 495,219 bytes |
| `public/media/nonogram-trip.webm` | VP9 Profile 0, yuv420p, 720 × 1600, 30 fps, **35.000 seconds**, 1,050 frames, no audio | 732,816 bytes |
| `public/images/video-poster.webp` | Actual album frame at 00:01, 720 × 1600 | 41,356 bytes |
| `public/media/captions-en.vtt` | Eight English descriptive captions | UTF-8 WebVTT |
| `public/media/captions-ko.vtt` | Eight Korean descriptive captions | UTF-8 WebVTT |

Video SHA-256: `37630b9f8f34548b358c01fb7c4c22000bb32b652a02b63c6a61f76f0b3482e6`.

Poster SHA-256: `b5f791534c1786a4471f87e5ef44b6d79a876991b7bf293165f8a1f6f7e463d8`.

Use `object-fit: contain` and the actual **9:20** aspect ratio to preserve the entire interface. Playback is user initiated. Captions describe the visuals; there is no narration or music.

## Sequence

| Time | Recorded action |
| --- | --- |
| 00:00–00:04 | Seoul album before completion |
| 00:04–00:08 | Twelve-city route screen |
| 00:08–00:10 | Return to the album and open Departures |
| 00:10–00:12.5 | Actual departure board |
| 00:12.5–00:15.5 | Fresh Palace Gate board and clues |
| 00:15.5–00:24.3 | Three real fill strokes; app marks completed lines automatically |
| 00:24.3–00:30.5 | Native completion animation and finished photograph |
| 00:30.5–00:35 | Return to the album with the collected photo |

## Processing and checks

Captured with Android `screenrecord --size 720x1600 --bit-rate 3000000 --time-limit 36`. Android omits redundant frames on an unchanged display, so its variable-frame-rate source ends at the last changed album frame (about 30.42 seconds). Encoding repeats that unchanged final frame to retain the intended 35-second viewing time. No interaction is sped up, rearranged, or replaced.

FFmpeg 7.1, distributed in `imageio-ffmpeg` 0.6.0, encoded a constant frame rate with `fps=30,tpad=stop_mode=clone:stop_duration=6,setsar=1`, `-t 35`, `libx264`, CRF 23, Main profile, yuv420p, and `+faststart`. Only the video stream is retained. The poster is extracted from that encoded video at one second, with WebP quality 84.

Verified all 1,050 output frames decode without errors; the output contains one video stream and no audio. Visually checked album, route, board in progress, native completion, and final collected-photo frames. Both caption files use increasing, nonoverlapping timestamps within the video duration. The video stays below the 4 MB budget.

This capture verifies the shown Android preview flow. It does not establish store publication or claim that every device has identical performance.

## WebM alternative — 19 September 2026

The verified MP4 was transcoded to WebM with FFmpeg 7.1, `libvpx-vp9`, CRF 30, zero target bitrate, good deadline, CPU-used 4 and row multithreading. All 1,050 frames decode without errors and the duration remains exactly 35 seconds. The smaller MP4 is offered first; browsers can use the WebM alternative when H.264 is unavailable. Neither format downloads before playback (`preload="none"`).

WebM SHA-256: `3fbf6e8af9d6d625457dcfe567db0b9263c1ed40d03f90eada7bd643fa73f849`.
