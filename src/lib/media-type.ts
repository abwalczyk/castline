export type DetectedMedia =
  | { mime: "image/png"; type: "image" }
  | { mime: "image/jpeg"; type: "image" }
  | { mime: "image/webp"; type: "image" }
  | { mime: "image/gif"; type: "gif" }
  | { mime: "video/mp4"; type: "mp4" };

export function detectMedia(bytes: Uint8Array): DetectedMedia | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: "image/png", type: "image" };
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", type: "image" };
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") {
    return { mime: "image/gif", type: "gif" };
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return { mime: "image/webp", type: "image" };
  }
  if (ascii(bytes, 4, 4) === "ftyp") return { mime: "video/mp4", type: "mp4" };
  return null;
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  if (bytes.length < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  if (bytes.length < offset + length) return "";
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}
