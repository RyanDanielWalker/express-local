// Compile one probe folder and run a file in it.
// Usage: npm run probe -- <folder> <file>     e.g. npm run probe -- example smoke
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
const [dir, file] = process.argv.slice(2);
if (!dir || !file || !existsSync(`${dir}/tsconfig.json`)) {
  console.error('Usage: npm run probe -- <folder> <file>   (the folder needs a tsconfig.json)');
  process.exit(1);
}
execFileSync('node', ['node_modules/typescript/bin/tsc', '-p', dir], { stdio: 'inherit' });
execFileSync('node', [`${dir}/dist/${file.replace(/\.ts$/, '')}.js`], { stdio: 'inherit' });
