// „Faststart" für MP4 (wie qt-faststart / -movflags faststart, das alte
// ffmpeg-Builds nicht kennen): verschiebt das moov-Atom vor mdat und korrigiert
// die Chunk-Offsets (stco/co64), damit Browser und Messenger sofort abspielen.
import fs from 'node:fs';

function atoms(buf, start, end) {
  const list = [];
  let p = start;
  while (p + 8 <= end) {
    let size = buf.readUInt32BE(p);
    const type = buf.toString('latin1', p + 4, p + 8);
    let header = 8;
    if (size === 1) { size = Number(buf.readBigUInt64BE(p + 8)); header = 16; }
    else if (size === 0) size = end - p;
    list.push({ type, start: p, size, header });
    p += size;
  }
  return list;
}

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'dinf']);

function shiftOffsets(buf, start, end, delta) {
  for (const a of atoms(buf, start, end)) {
    const body = a.start + a.header;
    if (CONTAINERS.has(a.type)) shiftOffsets(buf, body, a.start + a.size, delta);
    else if (a.type === 'stco') {
      const n = buf.readUInt32BE(body + 4);
      for (let i = 0; i < n; i++) {
        const o = body + 8 + i * 4;
        buf.writeUInt32BE(buf.readUInt32BE(o) + delta, o);
      }
    } else if (a.type === 'co64') {
      const n = buf.readUInt32BE(body + 4);
      for (let i = 0; i < n; i++) {
        const o = body + 8 + i * 8;
        buf.writeBigUInt64BE(buf.readBigUInt64BE(o) + BigInt(delta), o);
      }
    }
  }
}

export function faststart(file) {
  const buf = fs.readFileSync(file);
  const top = atoms(buf, 0, buf.length);
  const moov = top.find((a) => a.type === 'moov');
  const mdatIdx = top.findIndex((a) => a.type === 'mdat');
  if (!moov || mdatIdx < 0) throw new Error('kein moov/mdat gefunden');
  if (top.indexOf(moov) < mdatIdx) return false; // schon vorne

  const moovBuf = Buffer.from(buf.subarray(moov.start, moov.start + moov.size));
  shiftOffsets(moovBuf, 8, moovBuf.length, moov.size);
  const before = top.slice(0, mdatIdx).filter((a) => a.type !== 'free');
  const rest = top.slice(mdatIdx).filter((a) => a !== moov);
  // free-Atome vor mdat entfallen -> deren Größe von den Offsets abziehen
  const dropped = top.slice(0, mdatIdx).filter((a) => a.type === 'free').reduce((s, a) => s + a.size, 0);
  if (dropped) shiftOffsets(moovBuf, 8, moovBuf.length, -dropped);

  const parts = [...before.map((a) => buf.subarray(a.start, a.start + a.size)), moovBuf,
    ...rest.map((a) => buf.subarray(a.start, a.start + a.size))];
  fs.writeFileSync(file, Buffer.concat(parts));
  return true;
}
