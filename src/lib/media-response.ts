export function mediaResponse(bytes: Uint8Array, mime: string, request: Request) {
  const headers = {
    "Content-Type": mime,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, max-age=60",
  };
  const range = request.headers.get("range");
  if (!range) {
    return new Response(Buffer.from(bytes), {
      headers: { ...headers, "Content-Length": String(bytes.byteLength) },
    });
  }
  const match = /^bytes=(\d+)-(\d*)$/.exec(range);
  if (!match) return new Response("Range not satisfiable", { status: 416 });
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : bytes.byteLength - 1;
  if (start > end || end >= bytes.byteLength) return new Response("Range not satisfiable", { status: 416 });
  const slice = bytes.slice(start, end + 1);
  return new Response(Buffer.from(slice), {
    status: 206,
    headers: {
      ...headers,
      "Content-Length": String(slice.byteLength),
      "Content-Range": `bytes ${start}-${end}/${bytes.byteLength}`,
    },
  });
}
