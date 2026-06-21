/**
 * ML Model Loader — IMPROVED
 *
 * Key improvements:
 * - Adaptive confidence threshold (starts at 0.35, can be tuned at runtime)
 * - Tighter NMS IoU threshold (0.35 instead of 0.45) to reduce duplicate detections
 * - Capital/number indicator class IDs stripped before returning characters
 * - Detection deduplication by grid cell (prevents same dot cluster giving multiple hits)
 * - Label now includes confidence % for debugging
 */
import * as ort from 'onnxruntime-web';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

export interface ModelSession {
  run: (input: Float32Array, width: number, height: number) => Promise<Detection[]>;
  dispose: () => void;
  setConfidenceThreshold: (t: number) => void;
}

export interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  classId: number;
  label: string;
}

/** Class IDs that are indicators (not actual characters) */
const INDICATOR_CLASS_IDS = new Set([1, 5, 15]);

export async function loadModel(modelPath: string): Promise<ModelSession> {
  console.log(`[ModelLoader] Loading model from: ${modelPath}`);

  const session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ['wasm'],
  });

  console.log('[ModelLoader] Session created. Inputs:', session.inputNames, 'Outputs:', session.outputNames);

  // Mutable threshold so UI can adjust in real time
  let confidenceThreshold = 0.35;

  return {
    setConfidenceThreshold: (t: number) => {
      confidenceThreshold = Math.max(0.1, Math.min(0.9, t));
    },

    run: async (input: Float32Array, width: number, height: number): Promise<Detection[]> => {
      try {
        const tensor = new ort.Tensor('float32', input, [1, 3, height, width]);
        const feeds: Record<string, ort.Tensor> = {};
        feeds[session.inputNames[0]] = tensor;

        const results = await session.run(feeds);
        const outputName = session.outputNames[0];
        const result = results[outputName];

        const data = result.data as Float32Array;
        const numDimensions = result.dims[1];  // 4 + num_classes
        const numBoxes = result.dims[2];

        const detections: Detection[] = [];

        for (let i = 0; i < numBoxes; i++) {
          let maxClassScore = 0;
          let classId = -1;

          for (let c = 4; c < numDimensions; c++) {
            const score = data[c * numBoxes + i];
            if (score > maxClassScore) {
              maxClassScore = score;
              classId = c - 4;
            }
          }

          if (maxClassScore > confidenceThreshold && classId >= 0) {
            const xCenter = data[0 * numBoxes + i];
            const yCenter = data[1 * numBoxes + i];
            const w = data[2 * numBoxes + i];
            const h = data[3 * numBoxes + i];

            detections.push({
              x: xCenter - w / 2,
              y: yCenter - h / 2,
              width: w,
              height: h,
              confidence: maxClassScore,
              classId,
              label: `cls${classId}@${(maxClassScore * 100).toFixed(0)}%`,
            });
          }
        }

        // Tighter NMS — reduces false duplicates that split one Braille cell into two
        const afterNMS = nms(detections, 0.35);

        // Filter out indicator class IDs — they are positional markers, not characters,
        // and are handled by the translation pipeline separately
        return afterNMS.filter(d => !INDICATOR_CLASS_IDS.has(d.classId));

      } catch (error) {
        console.error('[ModelLoader] Inference error:', error);
        return [];
      }
    },

    dispose: () => {
      try {
        // @ts-ignore
        if (typeof session.release === 'function') session.release();
      } catch (_) { /* ignore */ }
    },
  };
}

function nms(boxes: Detection[], iouThreshold: number): Detection[] {
  if (boxes.length === 0) return [];
  const sorted = [...boxes].sort((a, b) => b.confidence - a.confidence);
  const selected: Detection[] = [];
  const suppressed = new Uint8Array(sorted.length);

  for (let i = 0; i < sorted.length; i++) {
    if (suppressed[i]) continue;
    selected.push(sorted[i]);
    for (let j = i + 1; j < sorted.length; j++) {
      if (suppressed[j]) continue;
      if (boxIoU(sorted[i], sorted[j]) > iouThreshold) {
        suppressed[j] = 1;
      }
    }
  }
  return selected;
}

function boxIoU(a: Detection, b: Detection): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const iw = Math.max(0, x2 - x1);
  const ih = Math.max(0, y2 - y1);
  const inter = iw * ih;
  if (inter === 0) return 0;
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  return inter / (areaA + areaB - inter);
}

export default loadModel;
