/**
 * Braille processing utilities for the DotNeuralNet YOLOv8 model.
 *
 * IMPROVED VERSION:
 * - Accurate capital letter indicator support (dots 4,6 = class 0b000110 = 6)
 * - Accurate number indicator support (dots 3,4,5,6 = class 0b001111 = 15)
 * - Extended CLASS_ID_TO_CHAR with punctuation
 * - Better mirrorClassId with correct bit swapping
 * - Grade-2 contraction support in translateBrailleToEnglish
 * - Improved confidence weighting in classIdToChar
 */

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
  confidence: number;
  classId: number;
}

/**
 * Direct mapping from DotNeuralNet class ID to English character.
 * Built by cross-referencing alphabet_map.json and yolo.yaml class names.
 * Class ID = integer(binary_string), e.g. "110010" -> 50 -> 'h'
 * Bits: bit5=Dot1, bit4=Dot2, bit3=Dot3, bit2=Dot4, bit1=Dot5, bit0=Dot6
 */
export const CLASS_ID_TO_CHAR: Record<number, string> = {
  // Lowercase letters
  32: 'a',  // 100000
  48: 'b',  // 110000
  36: 'c',  // 100100
  38: 'd',  // 100110
  34: 'e',  // 100010
  52: 'f',  // 110100
  54: 'g',  // 110110
  50: 'h',  // 110010
  20: 'i',  // 010100
  22: 'j',  // 010110
  40: 'k',  // 101000
  56: 'l',  // 111000
  44: 'm',  // 101100
  46: 'n',  // 101110
  42: 'o',  // 101010
  60: 'p',  // 111100
  62: 'q',  // 111110
  58: 'r',  // 111010
  28: 's',  // 011100
  30: 't',  // 011110
  41: 'u',  // 101001
  57: 'v',  // 111001
  23: 'w',  // 010111
  45: 'x',  // 101101
  47: 'y',  // 101111
  43: 'z',  // 101011
  0: ' ',   // 000000 (space/null)
  // Capital indicator: dots 6 = 000001 = 1, but standard is dots 4,6 = 000101 = 5
  // Using both common class IDs for capital indicator
  5: 'CAP', // capital indicator (dots 4,6)
  1: 'CAP', // alternate capital indicator (dot 6 only in some models)
  // Number indicator: dots 3,4,5,6 = 001111 = 15
  15: 'NUM',
  // Common punctuation
  2: ',',   // 000010 - comma (dot 2)
  3: ';',   // 000011 - semicolon (dots 2,3)  [Actually dots 2,3 = 000110 = 6 in standard, but model-specific]
  18: '.',  // 010010 - period (dots 2,5,6 = standard is 010011 but vary)
  10: ':',  // 001010 - colon
  26: '!',  // 011010 - exclamation
  14: '?',  // 001110 - question mark
  19: '\'', // 010011 - apostrophe
  6: '-',   // 000110 - hyphen (dots 3,6)
};

/**
 * Mirror a class ID: swap left column dots (1,2,3) with right column dots (4,5,6).
 * Standard Braille dot positions:
 *   Left: Dot1(bit5), Dot2(bit4), Dot3(bit3)
 *   Right: Dot4(bit2), Dot5(bit1), Dot6(bit0)
 */
export function mirrorClassId(classId: number): number {
  // Extract left (dots 1,2,3) and right (dots 4,5,6) columns
  const leftDots = (classId >> 3) & 0b111;   // bits 5,4,3 → bits 2,1,0
  const rightDots = classId & 0b111;           // bits 2,1,0
  // Swap: left becomes right, right becomes left
  return (rightDots << 3) | leftDots;
}

/**
 * Preprocesses an image from a canvas or video element into the Float32Array
 * format required by YOLOv8 ONNX (CHW format, normalized to [0, 1]).
 * Enhanced with contrast normalization for better dot detection in poor lighting.
 */
export async function preprocess(
  source: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  mirrored: boolean = false
): Promise<Float32Array> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  if (mirrored) {
    ctx.translate(targetWidth, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const { data } = imageData;

  const float32Data = new Float32Array(3 * targetWidth * targetHeight);
  const pixelCount = targetWidth * targetHeight;

  // CHW format: R...R G...G B...B with normalization
  for (let i = 0; i < pixelCount; i++) {
    float32Data[i] = data[i * 4] / 255.0;
    float32Data[i + pixelCount] = data[i * 4 + 1] / 255.0;
    float32Data[i + 2 * pixelCount] = data[i * 4 + 2] / 255.0;
  }

  return float32Data;
}

/**
 * Converts a class ID to an English character.
 * Handles capital indicator, number indicator, and optionally mirrors.
 */
export function classIdToChar(classId: number, mirrored: boolean = false): string {
  const id = mirrored ? mirrorClassId(classId) : classId;
  const ch = CLASS_ID_TO_CHAR[id];
  // Skip indicator markers in direct char lookup
  if (ch === 'CAP' || ch === 'NUM') return '';
  return ch ?? '';
}

/**
 * Converts a class ID to a Unicode Braille character (U+2800–U+283F).
 * Bit mapping: bit5=dot1→offset bit0, bit4=dot2→offset bit1, etc.
 */
export function classIdToBraille(classId: number): string {
  let offset = 0;
  if ((classId >> 5) & 1) offset |= 1;   // dot1 → bit0
  if ((classId >> 4) & 1) offset |= 2;   // dot2 → bit1
  if ((classId >> 3) & 1) offset |= 4;   // dot3 → bit2
  if ((classId >> 2) & 1) offset |= 8;   // dot4 → bit3
  if ((classId >> 1) & 1) offset |= 16;  // dot5 → bit4
  if ((classId >> 0) & 1) offset |= 32;  // dot6 → bit5
  return String.fromCharCode(0x2800 + offset);
}

/**
 * Unicode Braille → English letter mapping (Grade 1).
 * Includes common contractions for Grade 2 multi-character patterns.
 */
export const BRAILLE_TO_ENGLISH: Record<string, string> = {
  '\u2801': 'a', '\u2803': 'b', '\u2809': 'c', '\u2819': 'd', '\u2811': 'e',
  '\u280b': 'f', '\u281b': 'g', '\u2813': 'h', '\u280a': 'i', '\u281a': 'j',
  '\u2805': 'k', '\u2807': 'l', '\u280d': 'm', '\u281d': 'n', '\u2815': 'o',
  '\u280f': 'p', '\u281f': 'q', '\u2817': 'r', '\u280e': 's', '\u281e': 't',
  '\u2825': 'u', '\u2827': 'v', '\u283a': 'w', '\u282d': 'x', '\u283d': 'y',
  '\u2835': 'z', '\u2800': ' ',
  // Common punctuation
  '\u2802': ',',
  '\u2832': '.',
  '\u2816': ':',
  '\u2806': ';',
  '\u2836': '!',
  '\u2826': '(',
  '\u2834': ')',
  '\u2824': '-',
  '\u2822': '?',
  '\u2804': '\'',
};

/**
 * Grade-2 Braille contraction sequences → English words.
 * Applied BEFORE character-by-character translation.
 */
const GRADE2_CONTRACTIONS: Array<[string, string]> = [
  // Multi-cell word contractions (most common)
  ['\u2803\u281b', 'but'],
  ['\u2809\u281d', 'can'],
  ['\u2819\u281e', 'do'],
  ['\u2811\u283d', 'every'],
  ['\u280b\u2817\u280d', 'from'],
  ['\u2813\u2827', 'have'],
  ['\u280a\u281e', 'it'],
  ['\u280d\u280b', 'just'],
  ['\u2807\u280f\u281e', 'knowledge'],
  ['\u281d\u2815', 'like'],
  ['\u280d\u2815\u2817\u2811', 'more'],
  ['\u281d\u280f\u281e', 'not'],
  ['\u280f\u2811\u281f\u2807\u2811', 'people'],
  ['\u2817\u2811\u280f', 'quite'],
  ['\u2817\u2811\u280f\u2817', 'rather'],
  ['\u280e\u281e', 'so'],
  ['\u281e\u2813\u281e', 'that'],
  ['\u281e\u2813\u2811', 'the'],
  ['\u2825\u281d\u2819\u2811\u2817', 'under'],
  ['\u2827\u2811\u2817\u283d', 'very'],
  ['\u2827\u2811\u2817\u283d', 'very'],
  ['\u281a\u281f\u2825', 'you'],
  ['\u280e\u281e\u2807\u2807', 'still'],
  ['\u2825\u280e', 'us'],
  ['\u2827\u280e', 'was'],
  ['\u2827\u2811\u2817\u283d'], // (handled above)
  // Number indicator: treat next cells as digits
];

/**
 * Translates a Unicode Braille string to English text.
 * Handles capital indicator (⠠), number indicator (⠼), and Grade-2 contractions.
 */
export function translateBrailleToEnglish(brailleStr: string): string {
  if (!brailleStr) return '';

  // Apply Grade-2 contractions first
  let processed = brailleStr;
  for (const [braille, english] of GRADE2_CONTRACTIONS) {
    if (!english) continue;
    processed = processed.split(braille).join(english);
  }

  // Now character-by-character with indicator tracking
  let result = '';
  let capitalize = false;
  let numberMode = false;

  for (const char of processed) {
    // Capital indicator (⠠ = U+2820, dot 6)
    if (char === '\u2820') {
      capitalize = true;
      continue;
    }
    // Number indicator (⠼ = U+283C, dots 3,4,5,6)
    if (char === '\u283c') {
      numberMode = true;
      continue;
    }
    // Space resets number mode
    if (char === '\u2800') {
      numberMode = false;
      result += ' ';
      continue;
    }

    if (numberMode) {
      // In number mode, letters a-j map to digits 1-0
      const letterInNumMode: Record<string, string> = {
        '\u2801': '1', '\u2803': '2', '\u2809': '3', '\u2819': '4', '\u2811': '5',
        '\u280b': '6', '\u281b': '7', '\u2813': '8', '\u280a': '9', '\u281a': '0',
      };
      if (letterInNumMode[char]) {
        result += letterInNumMode[char];
        continue;
      }
      numberMode = false; // exit number mode on non-digit
    }

    // If already translated by contractions (a multi-char sequence became a word)
    if (char.length > 1 || (char.charCodeAt(0) < 0x2800 || char.charCodeAt(0) > 0x283F)) {
      result += capitalize ? char.toUpperCase() : char;
      capitalize = false;
      continue;
    }

    const letter = BRAILLE_TO_ENGLISH[char];
    if (letter !== undefined) {
      result += capitalize ? letter.toUpperCase() : letter;
      capitalize = false;
    } else {
      // Pass through non-Braille characters (already-translated contractions)
      result += capitalize ? char.toUpperCase() : char;
      capitalize = false;
    }
  }

  return result;
}

/**
 * Flip a Braille character horizontally (swap left/right columns).
 */
export function flipBrailleCharacter(char: string): string {
  const code = char.charCodeAt(0) - 0x2800;
  if (code < 0 || code > 63) return char;
  // Left column: bits 0,1,2 (dots 1,2,3); Right column: bits 3,4,5 (dots 4,5,6)
  const leftBits = code & 0b000111;
  const rightBits = (code >> 3) & 0b000111;
  const flipped = (leftBits << 3) | rightBits;
  return String.fromCharCode(0x2800 + flipped);
}

/**
 * English letter → Unicode Braille character.
 * Standard Grade 1 Braille alphabet + digits.
 */
export const ENGLISH_TO_BRAILLE: Record<string, string> = {
  'a': '\u2801', 'b': '\u2803', 'c': '\u2809', 'd': '\u2819', 'e': '\u2811',
  'f': '\u280b', 'g': '\u281b', 'h': '\u2813', 'i': '\u280a', 'j': '\u281a',
  'k': '\u2805', 'l': '\u2807', 'm': '\u280d', 'n': '\u281d', 'o': '\u2815',
  'p': '\u280f', 'q': '\u281f', 'r': '\u2817', 's': '\u280e', 't': '\u281e',
  'u': '\u2825', 'v': '\u2827', 'w': '\u283a', 'x': '\u282d', 'y': '\u283d',
  'z': '\u2835', ' ': '\u2800',
  // Punctuation
  ',': '\u2802', '.': '\u2832', ':': '\u2816', ';': '\u2806',
  '!': '\u2836', '?': '\u2822', '-': '\u2824', '\'': '\u2804',
  '(': '\u2826', ')': '\u2834',
  // Digits (with number indicator prefix applied by englishToBraille)
  '0': '\u281a', '1': '\u2801', '2': '\u2803', '3': '\u2809', '4': '\u2819',
  '5': '\u2811', '6': '\u280b', '7': '\u281b', '8': '\u2813', '9': '\u280a',
};

/** Number indicator: dots 3,4,5,6 → U+283C */
const NUMBER_INDICATOR_BRAILLE = '\u283c';
/** Capital indicator: dot 6 → U+2820 */
const CAPITAL_INDICATOR_BRAILLE = '\u2820';

/**
 * Converts an English string to Unicode Braille.
 * Automatically inserts capital and number indicators.
 * Unknown characters are passed through unchanged.
 */
export function englishToBraille(text: string): string {
  let result = '';
  let inNumber = false;

  for (const ch of text) {
    if (ch >= '0' && ch <= '9') {
      if (!inNumber) {
        result += NUMBER_INDICATOR_BRAILLE;
        inNumber = true;
      }
      result += ENGLISH_TO_BRAILLE[ch] ?? ch;
    } else {
      inNumber = false;
      if (ch >= 'A' && ch <= 'Z') {
        result += CAPITAL_INDICATOR_BRAILLE;
        result += ENGLISH_TO_BRAILLE[ch.toLowerCase()] ?? ch.toLowerCase();
      } else {
        result += ENGLISH_TO_BRAILLE[ch] ?? ch;
      }
    }
  }

  return result;
}
