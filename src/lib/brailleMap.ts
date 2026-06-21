// Grade-1 Braille mapping: character → 6-dot pattern [1,2,3,4,5,6]
// Dots are numbered: 1(top-left) 4(top-right) 2(mid-left) 5(mid-right) 3(bot-left) 6(bot-right)

export type BrailleDots = [boolean, boolean, boolean, boolean, boolean, boolean];

const BRAILLE_MAP: Record<string, BrailleDots> = {
  'a': [true, false, false, false, false, false],
  'b': [true, true, false, false, false, false],
  'c': [true, false, false, true, false, false],
  'd': [true, false, false, true, true, false],
  'e': [true, false, false, false, true, false],
  'f': [true, true, false, true, false, false],
  'g': [true, true, false, true, true, false],
  'h': [true, true, false, false, true, false],
  'i': [false, true, false, true, false, false],
  'j': [false, true, false, true, true, false],
  'k': [true, false, true, false, false, false],
  'l': [true, true, true, false, false, false],
  'm': [true, false, true, true, false, false],
  'n': [true, false, true, true, true, false],
  'o': [true, false, true, false, true, false],
  'p': [true, true, true, true, false, false],
  'q': [true, true, true, true, true, false],
  'r': [true, true, true, false, true, false],
  's': [false, true, true, true, false, false],
  't': [false, true, true, true, true, false],
  'u': [true, false, true, false, false, true],
  'v': [true, true, true, false, false, true],
  'w': [false, true, false, true, true, true],
  'x': [true, false, true, true, false, true],
  'y': [true, false, true, true, true, true],
  'z': [true, false, true, false, true, true],
  ' ': [false, false, false, false, false, false],
  '.': [false, true, false, false, true, true],
  ',': [false, true, false, false, false, false],
  '!': [false, true, true, false, true, false],
  '?': [false, true, true, false, false, true],
  '-': [false, false, true, false, false, true],
  '0': [false, true, false, true, true, false],
  '1': [true, false, false, false, false, false],
  '2': [true, true, false, false, false, false],
  '3': [true, false, false, true, false, false],
  '4': [true, false, false, true, true, false],
  '5': [true, false, false, false, true, false],
  '6': [true, true, false, true, false, false],
  '7': [true, true, false, true, true, false],
  '8': [true, true, false, false, true, false],
  '9': [false, true, false, true, false, false],
};

// Number indicator prefix
export const NUMBER_INDICATOR: BrailleDots = [false, false, true, true, true, true];

export function textToBraille(text: string): { char: string; dots: BrailleDots }[] {
  const result: { char: string; dots: BrailleDots }[] = [];
  const lower = text.toLowerCase();
  let inNumber = false;

  for (const ch of lower) {
    if (ch >= '0' && ch <= '9') {
      if (!inNumber) {
        result.push({ char: '#', dots: NUMBER_INDICATOR });
        inNumber = true;
      }
    } else {
      inNumber = false;
    }

    const dots = BRAILLE_MAP[ch];
    if (dots) {
      result.push({ char: ch, dots });
    }
  }

  return result;
}

export function dotsToUnicode(dots: BrailleDots): string {
  // Unicode Braille starts at U+2800
  let offset = 0;
  if (dots[0]) offset += 1;
  if (dots[1]) offset += 2;
  if (dots[2]) offset += 4;
  if (dots[3]) offset += 8;
  if (dots[4]) offset += 16;
  if (dots[5]) offset += 32;
  return String.fromCharCode(0x2800 + offset);
}

export default BRAILLE_MAP;