# Layer Audio Editor

A single-file, multi-track audio editor with built-in text to speech. No build step, no server-side code, no API keys.

## Run it

Serve the folder and open it in Chrome, Edge or Firefox (opening the file directly via `file://` can break the TTS worker's model cache):

```bash
cd audio-editor && python3 -m http.server 8000
```

Then open http://localhost:8000.

## Features

- Unlimited tracks with volume, pan, mute and solo
- Import audio files (button or drag and drop onto a track), record from the microphone with overdub
- Move clips along and between tracks, trim edges, split, duplicate, per-clip gain, fades and normalize
- Snapping to clip edges and the playhead, zoom, undo/redo
- Export the mix (or a single clip) as 16-bit WAV

## Text to speech

Uses [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) through [kokoro-js](https://www.npmjs.com/package/kokoro-js) (Apache 2.0), running locally in a Web Worker. The model downloads from Hugging Face on first use and is cached by the browser. With WebGPU available it runs at full precision on the GPU (about 330 MB); otherwise it uses a q8 CPU build (about 90 MB). 28 English voices (US and UK); `af_heart` and `af_bella` are the strongest.
