// Runs every probe folder (or the ones named) under TypeScript 5.9, 6.0 and 7.0.
// Convention: a tsconfig.neg*.json must fail to compile (it holds a deliberately
// wrong assertion, or code that should be an error), and every other
// tsconfig*.json must compile cleanly, except tsconfig.reveal*.json, which
// exists to make tsc print a type in an error message: its output is shown,
// not judged.
// Usage: npm run check            all folders
//        npm run check -- narrow  one folder (or a path, like _review/my-check)
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
const versions = { '5.9': 'typescript', '6.0': 'typescript-6', '7.0': 'typescript-7' };
const only = process.argv.slice(2);
const dirs = only.length
  ? only // any folder path, including _review/<name>
  : readdirSync('.').filter(d => statSync(d).isDirectory() && !['node_modules', '_review'].includes(d));
let bad = 0;
for (const dir of dirs) {
  for (const cfg of readdirSync(dir).filter(f => /^tsconfig.*\.json$/.test(f))) {
    for (const [v, pkg] of Object.entries(versions)) {
      let passed = true, out = '';
      try { execFileSync('node', [`node_modules/${pkg}/bin/tsc`, '-p', `${dir}/${cfg}`], { stdio: 'pipe' }); }
      catch (e) { passed = false; out = String(e.stdout || e.message).trim().split('\n').slice(0, 3).join(' | '); }
      // A config or missing-file error (TS5xxx, TS6053) is not the failure a neg probe is for.
      const realError = /error TS(?!5\d{3}|6053)\d+/.test(out);
      if (!passed && !realError && cfg.startsWith('tsconfig.neg')) { console.log(`WRONG ${dir}/${cfg} on ${v}: failed for the wrong reason  ${out}`); bad++; continue; }
      const reveal = cfg.startsWith('tsconfig.reveal');
      const want = !cfg.startsWith('tsconfig.neg');
      const verdict = reveal ? 'info' : passed === want ? 'ok' : 'WRONG';
      if (verdict === 'WRONG') bad++;
      console.log(`${verdict.padEnd(5)} ${dir}/${cfg} on ${v}: ${passed ? 'compiles' : 'errors'}${(verdict === 'WRONG' || reveal) && out ? '  ' + out : ''}`);
    }
  }
}
console.log(bad ? `${bad} result(s) not as expected` : 'all as expected');
process.exit(bad ? 1 : 0);
