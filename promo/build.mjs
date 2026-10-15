// Komplette Pipeline: Soundtrack -> Frames -> MP4 (H.264 + AAC).
// Voraussetzung für frische Screens: node promo/demo-server.mjs läuft, dann
//   node promo/build.mjs --capture
// Ohne --capture werden die vorhandenen Screens aus work/screens benutzt.
// Ergebnis: promo/out/partykeller-promo.mp4
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { faststart } from './lib/faststart.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const work = path.join(here, 'work');
const outDir = path.join(here, 'out');
const FPS = Number(process.env.PROMO_FPS ?? 30);

function run(cmd, args) {
  console.log('>', cmd, args.join(' '));
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: path.resolve(here, '..') });
  if (r.status !== 0) throw new Error(`${cmd} fehlgeschlagen (${r.status})`);
}

function findFfmpeg() {
  const candidates = [
    process.env.FFMPEG,
    'ffmpeg',
    'C:/Program Files (x86)/Design&Print/tools/ImageMagick/ffmpeg.exe',
  ].filter(Boolean);
  for (const c of candidates) {
    const r = spawnSync(c, ['-version'], { stdio: 'ignore' });
    if (r.status === 0) return c;
  }
  throw new Error('ffmpeg nicht gefunden (FFMPEG=Pfad setzen)');
}

if (process.argv.includes('--capture')) run('node', ['promo/capture.mjs']);
if (!process.argv.includes('--encode-only')) {
  run('python', ['promo/music.py']);
  run('node', ['promo/render.mjs']);
}

fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'partykeller-promo.mp4');
// Bewusst nur Optionen, die auch sehr alte ffmpeg-Builds kennen (libx264 + AAC)
const aac = ['-encoders', '-codecs'].map((flag) => {
  const r = spawnSync(findFfmpeg(), [flag], { encoding: 'utf8' });
  return `${r.stdout ?? ''}${r.stderr ?? ''}`;
}).join('');
// Alte Builds: eingebauter aac-Encoder ist dort noch „experimental" -> libvo_aacenc
const audioCodec = /libvo_aacenc/.test(aac) ? 'libvo_aacenc' : 'aac';
run(findFfmpeg(), [
  '-y',
  '-r', String(FPS), '-i', path.join(work, 'frames', 'f_%05d.jpg'),
  '-i', path.join(work, 'music.wav'),
  '-vcodec', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-g', String(FPS * 2),
  '-acodec', audioCodec, '-ab', '192k', '-ar', '44100', '-ac', '2',
  '-shortest',
  out,
]);
if (faststart(out)) console.log('faststart: moov nach vorne verschoben');
console.log('fertig:', out);
