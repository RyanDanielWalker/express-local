import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
// Shutdown hooks need a real process and real signals. From probes/nest:
//   npx tsc -p gaps && node gaps/sdrun.mjs
const sd = fileURLToPath(new URL('./dist/sd.js', import.meta.url));
for (const mode of ['off', 'on']) for (const sig of ['SIGTERM', 'SIGINT']) {
  await new Promise(res => {
    const c = spawn('node', [sd, mode]); let out = '';
    c.stdout.on('data', d => { out += d; if (String(d).includes('READY')) c.kill(sig) });
    c.on('exit', (code, s) => { console.log(mode, sig, '->', JSON.stringify(out.replace('READY\n', '').trim()), 'exit', code, s); res() });
  });
}
