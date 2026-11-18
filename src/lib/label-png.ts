import { crc32, deflateSync } from "node:zlib";

const FONT: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b10010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  " ": [0, 0, 0, 0, 0, 0, 0],
};

export function labelPng(
  width: number,
  height: number,
  background: [number, number, number],
  foreground: [number, number, number],
  text: string,
) {
  const pixels = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    pixels[index * 4] = background[0];
    pixels[index * 4 + 1] = background[1];
    pixels[index * 4 + 2] = background[2];
    pixels[index * 4 + 3] = 255;
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < 10; x += 1) {
      const index = (y * width + x) * 4;
      pixels[index] = foreground[0];
      pixels[index + 1] = foreground[1];
      pixels[index + 2] = foreground[2];
    }
  }
  drawText(pixels, width, height, foreground, text);
  return encodePng(width, height, pixels);
}

function drawText(
  pixels: Uint8Array,
  width: number,
  height: number,
  color: [number, number, number],
  text: string,
) {
  const glyphs = text.toUpperCase().split("");
  const columns = glyphs.reduce((sum, glyph) => sum + (glyph === " " ? 3 : 6), 0);
  const scale = Math.max(1, Math.min(8, Math.floor((width - 48) / Math.max(columns, 1)), Math.floor((height - 36) / 7)));
  const textWidth = columns * scale;
  let cursor = Math.max(24, Math.floor((width - textWidth) / 2));
  const top = Math.max(16, Math.floor((height - 7 * scale) / 2));
  for (const glyph of glyphs) {
    const rows = FONT[glyph] ?? FONT[" "];
    const glyphWidth = glyph === " " ? 3 : 5;
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < glyphWidth; col += 1) {
        if (((rows[row] >> (4 - col)) & 1) !== 1) continue;
        for (let dy = 0; dy < scale; dy += 1) {
          for (let dx = 0; dx < scale; dx += 1) {
            const x = cursor + col * scale + dx;
            const y = top + row * scale + dy;
            if (x < 0 || y < 0 || x >= width || y >= height) continue;
            const index = (y * width + x) * 4;
            pixels[index] = color[0];
            pixels[index + 1] = color[1];
            pixels[index + 2] = color[2];
          }
        }
      }
    }
    cursor += (glyph === " " ? 3 : 6) * scale;
  }
}

function encodePng(width: number, height: number, pixels: Uint8Array) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset + y * width * 4, width * 4).copy(raw, rowStart + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}
