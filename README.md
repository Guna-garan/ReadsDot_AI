# Readsdot AI — Braille to English Translator

A real-time Braille recognition web app powered by a YOLOv8 ONNX model (DotNeuralNet), with a 3-stage translation pipeline.

## Features
- 📷 Live camera Braille scanning
- 🧠 YOLOv8 ONNX neural network (runs in-browser via ONNX Runtime Web)
- 🔄 3-stage pipeline: Raw detection → Edit-distance stabilisation → Spell correction
- 📝 Text → Braille converter with capital & number indicators
- 🔊 Text-to-speech read-aloud
- 🔀 AI Mirror mode for reversed Braille

## Project Structure
```
src/
  ml/
    brailleUtils.ts   — Braille ↔ English conversion, Grade-2 contractions
    modelLoader.ts    — ONNX model loading, NMS, confidence threshold
    brailleMapper.ts  — Legacy mapper (kept for compatibility)
    detector.ts       — Camera detection helpers
    preprocess.ts     — Image preprocessing
  pages/
    TranslatePage.tsx — Main live-translation UI
    ScanPage.tsx      — Scan uploaded images
    LearnPage.tsx     — Learn Braille page
    TextToBraillePage.tsx
  lib/
    brailleMap.ts     — Static Grade-1 dot pattern map
```

## Getting Started
```bash
npm install
npm run dev
```

Place your ONNX model at `public/models/yolov8n-braille.onnx`.

## Translation Pipeline
1. **Raw** — Per-frame YOLOv8 detections sorted into lines with space detection
2. **Stabilised** — Medoid across last 10 frames (most consistent reading)  
3. **Corrected** — Levenshtein spell correction against English word dictionary

## Contributing
See `CONTRIBUTING.md` for how to contribute.
